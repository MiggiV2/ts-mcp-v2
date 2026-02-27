import http from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getTeamSpeakClient } from "./teamspeak.js";
import { listChannels, listChannelsSchema } from "./tools/listChannels.js";
import { createChannel, createChannelSchema } from "./tools/createChannel.js";
import { updateChannel, updateChannelSchema } from "./tools/updateChannel.js";
import { deleteChannel, deleteChannelSchema } from "./tools/deleteChannel.js";

const PORT = Number(process.env.MCP_PORT ?? 3000);

const server = new McpServer({
  name: "teamspeak-mcp",
  version: "1.0.0",
});

server.tool("ts_list_channels", "List all channels on the TeamSpeak server", listChannelsSchema, listChannels);

server.tool("ts_create_channel", "Create a new channel on the TeamSpeak server", createChannelSchema, createChannel);

server.tool("ts_update_channel", "Update properties of an existing channel", updateChannelSchema, updateChannel);

server.tool("ts_delete_channel", "Delete a channel by ID", deleteChannelSchema, deleteChannel);

// Map of session ID → transport for stateful sessions
const transports = new Map<string, StreamableHTTPServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/mcp" && req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };
      await server.connect(transport);
    }

    let body: unknown;
    try {
      body = await new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        });
        req.on("error", reject);
      });
    } catch {
      res.writeHead(400);
      res.end("Bad Request: invalid JSON");
      return;
    }

    await transport.handleRequest(req, res, body);
    return;
  }

  if (req.url === "/mcp" && req.method === "GET") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      return;
    }
    res.writeHead(400);
    res.end("No session");
    return;
  }

  if (req.url === "/mcp" && req.method === "DELETE") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
      transports.delete(sessionId);
      return;
    }
    res.writeHead(404);
    res.end("Session not found");
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

async function main() {
  console.log("Connecting to TeamSpeak...");
  await getTeamSpeakClient();
  console.log("TeamSpeak connected.");

  httpServer.listen(PORT, () => {
    console.log(`MCP server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});

# GitHub Copilot Prompt — TeamSpeak MCP Server (TypeScript)

## Project Goal
Generate a fully working TeamSpeak MCP Server in TypeScript. The server connects to a
TeamSpeak 3 server via the Server Query API and exposes channel management actions as
MCP tools that any MCP-compatible AI client (e.g. Claude Desktop, VS Code Copilot) can call.

---

## Tech Stack
- **Runtime:** Node.js 22+
- **Language:** TypeScript (strict mode, ESM)
- **MCP Framework:** `@modelcontextprotocol/sdk` (McpServer, Streamable HTTP transport)
- **TeamSpeak Client:** `ts3-nodejs-library` (npm: `ts3-nodejs-library`)
- **Validation:** `zod`
- **Build:** `tsc`
- **Containerization:** Docker + Docker Compose

---

## Project Structure
```
teamspeak-mcp/
├── src/
│   ├── index.ts          # Entry point — starts MCP server
│   ├── teamspeak.ts      # TeamSpeak connection singleton
│   └── tools/
│       ├── listChannels.ts
│       ├── createChannel.ts
│       ├── updateChannel.ts
│       └── deleteChannel.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── tsconfig.json
└── package.json
```

---

## Environment Variables (.env.example)
```env
TS_HOST=localhost
TS_QUERY_PORT=10011
TS_SERVER_PORT=9987
TS_USERNAME=serveradmin
TS_PASSWORD=your_password
TS_NICKNAME=MCPBot
TS_SERVER_ID=1
MCP_PORT=3000
```

---

## TeamSpeak Connection (`src/teamspeak.ts`)
- Create a singleton that connects to TeamSpeak using `TeamSpeak.connect()` from `ts3-nodejs-library`
- Use environment variables for all connection parameters
- Implement auto-reconnect on disconnect
- Export the `TeamSpeak` instance for use by all tools

```ts
import { TeamSpeak } from "ts3-nodejs-library";

let client: TeamSpeak | null = null;

export async function getTeamSpeakClient(): Promise<TeamSpeak> {
  if (client) return client;
  client = await TeamSpeak.connect({
    host: process.env.TS_HOST!,
    queryport: Number(process.env.TS_QUERY_PORT),
    serverport: Number(process.env.TS_SERVER_PORT),
    username: process.env.TS_USERNAME!,
    password: process.env.TS_PASSWORD!,
    nickname: process.env.TS_NICKNAME!,
  });
  client.on("close", async () => { client = null; });
  return client;
}
```

---

## MCP Tools to Implement

### 1. `ts_list_channels`
- **Description:** List all channels on the TeamSpeak server
- **Input schema (Zod):** `{}` (no parameters)
- **Logic:** Call `ts.channelList()`, return array of `{ cid, name, topic, totalClients }`
- **Returns:** JSON string of channel list

### 2. `ts_create_channel`
- **Description:** Create a new channel on the TeamSpeak server
- **Input schema (Zod):**
  ```ts
  {
    name: z.string().describe("Name of the new channel"),
    topic: z.string().optional().describe("Channel topic"),
    description: z.string().optional().describe("Channel description"),
    password: z.string().optional().describe("Channel password"),
    parentChannelId: z.number().optional().describe("CID of the parent channel for sub-channels"),
    isPermanent: z.boolean().default(true).describe("Whether the channel is permanent"),
  }
  ```
- **Logic:** Call `ts.channelCreate(name, properties)` with mapped properties
- **Returns:** `{ success: true, cid: number, name: string }`

### 3. `ts_update_channel`
- **Description:** Update properties of an existing channel
- **Input schema (Zod):**
  ```ts
  {
    channelId: z.number().describe("The CID of the channel to update"),
    name: z.string().optional().describe("New channel name"),
    topic: z.string().optional().describe("New channel topic"),
    description: z.string().optional().describe("New channel description"),
    password: z.string().optional().describe("New channel password"),
    isPermanent: z.boolean().optional(),
  }
  ```
- **Logic:** Call `ts.channelEdit(channelId, properties)`
- **Returns:** `{ success: true, channelId: number }`

### 4. `ts_delete_channel`
- **Description:** Delete a channel by ID
- **Input schema (Zod):**
  ```ts
  {
    channelId: z.number().describe("The CID of the channel to delete"),
    force: z.boolean().default(false).describe("Force delete even if clients are inside"),
  }
  ```
- **Logic:** Call `ts.channelDelete(channelId, force)`
- **Returns:** `{ success: true, channelId: number }`

---

## MCP Server Entry Point (`src/index.ts`)
- Instantiate `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- Use **Streamable HTTP transport** (`StreamableHTTPServerTransport`) on `MCP_PORT`
- Register all four tools above using `server.tool(name, zodSchema, handler)`
- Each handler should call `getTeamSpeakClient()` and wrap logic in try/catch
- On error, return `{ content: [{ type: "text", text: "Error: <message>" }], isError: true }`
- Connect to TeamSpeak eagerly on startup before accepting MCP requests

---

## Docker Setup

### `Dockerfile`
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### `docker-compose.yml`
```yaml
services:
  teamspeak-mcp:
    build: .
    ports:
      - "${MCP_PORT:-3000}:3000"
    env_file:
      - .env
    restart: unless-stopped
```

---

## tsconfig.json Requirements
- `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- `"strict": true`
- `"outDir": "dist"`, `"rootDir": "src"`
- `"target": "ES2022"`

---

## package.json Scripts
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "tsc --watch"
}
```

---

## Additional Requirements
- All tool handlers must be fully async with proper error handling
- Use `console.error` for errors, `console.log` for startup info only
- Never hardcode credentials — always read from `process.env`
- Add a `README.md` explaining setup, env vars, Docker usage, and available MCP tools

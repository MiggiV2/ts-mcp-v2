import { z } from "zod";
import { getTeamSpeakClient } from "../teamspeak.js";

export const listChannelsSchema = {};

export async function listChannels(_args: Record<string, never>) {
  try {
    const ts = await getTeamSpeakClient();
    const channels = await ts.channelList();
    const result = channels.map((ch) => ({
      cid: ch.cid,
      name: ch.name,
      topic: ch.topic,
      totalClients: ch.totalClients,
    }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    console.error("listChannels error:", err);
    return {
      content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

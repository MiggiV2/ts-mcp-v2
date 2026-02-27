import { z } from "zod";
import { getTeamSpeakClient } from "../teamspeak.js";

export const createChannelSchema = {
  name: z.string().describe("Name of the new channel"),
  topic: z.string().optional().describe("Channel topic"),
  description: z.string().optional().describe("Channel description"),
  password: z.string().optional().describe("Channel password"),
  parentChannelId: z.number().optional().describe("CID of the parent channel for sub-channels"),
  isPermanent: z.boolean().default(true).describe("Whether the channel is permanent"),
};

type CreateChannelArgs = z.infer<z.ZodObject<typeof createChannelSchema>>;

export async function createChannel(args: CreateChannelArgs) {
  try {
    const ts = await getTeamSpeakClient();
    const properties: Record<string, unknown> = {};
    if (args.topic !== undefined) properties.channelTopic = args.topic;
    if (args.description !== undefined) properties.channelDescription = args.description;
    if (args.password !== undefined) properties.channelPassword = args.password;
    if (args.parentChannelId !== undefined) properties.channelOrder = 0; // cpid handled separately
    if (args.isPermanent) {
      properties.channelFlagPermanent = true;
    } else {
      properties.channelFlagTemporary = true;
    }

    const channel = await ts.channelCreate(args.name, {
      ...properties,
      ...(args.parentChannelId !== undefined ? { cpid: String(args.parentChannelId) } : {}),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, cid: channel.cid, name: channel.name }),
        },
      ],
    };
  } catch (err) {
    console.error("createChannel error:", err);
    return {
      content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

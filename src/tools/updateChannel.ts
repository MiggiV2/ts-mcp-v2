import { z } from "zod";
import { getTeamSpeakClient } from "../teamspeak.js";

export const updateChannelSchema = {
  channelId: z.number().describe("The CID of the channel to update"),
  name: z.string().optional().describe("New channel name"),
  topic: z.string().optional().describe("New channel topic"),
  description: z.string().optional().describe("New channel description"),
  password: z.string().optional().describe("New channel password"),
  isPermanent: z.boolean().optional(),
};

type UpdateChannelArgs = z.infer<z.ZodObject<typeof updateChannelSchema>>;

export async function updateChannel(args: UpdateChannelArgs) {
  try {
    const ts = await getTeamSpeakClient();
    const properties: Record<string, string | boolean | number | undefined> = {};
    if (args.name !== undefined) properties.channelName = args.name;
    if (args.topic !== undefined) properties.channelTopic = args.topic;
    if (args.description !== undefined) properties.channelDescription = args.description;
    if (args.password !== undefined) properties.channelPassword = args.password;
    if (args.isPermanent !== undefined) {
      if (args.isPermanent) {
        properties.channelFlagPermanent = true;
        properties.channelFlagTemporary = false;
      } else {
        properties.channelFlagPermanent = false;
        properties.channelFlagTemporary = true;
      }
    }

    await ts.channelEdit(String(args.channelId), properties);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, channelId: args.channelId }),
        },
      ],
    };
  } catch (err) {
    console.error("updateChannel error:", err);
    return {
      content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

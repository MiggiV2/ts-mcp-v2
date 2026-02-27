import { z } from "zod";
import { getTeamSpeakClient } from "../teamspeak.js";

export const deleteChannelSchema = {
  channelId: z.number().describe("The CID of the channel to delete"),
  force: z.boolean().default(false).describe("Force delete even if clients are inside"),
};

type DeleteChannelArgs = z.infer<z.ZodObject<typeof deleteChannelSchema>>;

export async function deleteChannel(args: DeleteChannelArgs) {
  try {
    const ts = await getTeamSpeakClient();
    await ts.channelDelete(String(args.channelId), args.force);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, channelId: args.channelId }),
        },
      ],
    };
  } catch (err) {
    console.error("deleteChannel error:", err);
    return {
      content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

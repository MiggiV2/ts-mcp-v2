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
  client.on("close", async () => {
    client = null;
  });
  return client;
}

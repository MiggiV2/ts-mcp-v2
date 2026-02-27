# TeamSpeak MCP Server

A Model Context Protocol (MCP) server that exposes TeamSpeak 3 channel management as MCP tools. Compatible with any MCP client such as Claude Desktop or VS Code Copilot.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your TeamSpeak server details:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `TS_HOST` | TeamSpeak server hostname | `localhost` |
| `TS_QUERY_PORT` | ServerQuery port | `10011` |
| `TS_SERVER_PORT` | Voice server port | `9987` |
| `TS_USERNAME` | ServerQuery username | `serveradmin` |
| `TS_PASSWORD` | ServerQuery password | _(required)_ |
| `TS_NICKNAME` | Bot display name | `MCPBot` |
| `TS_SERVER_ID` | Virtual server ID | `1` |
| `MCP_PORT` | Port the MCP server listens on | `3000` |

### 2. Local Development

```bash
npm install
npm run build
npm start
```

For watch mode during development:

```bash
npm run dev
```

### 3. Docker

```bash
# Build and start
docker compose up --build

# Run in background
docker compose up -d --build
```

## Available MCP Tools

### `ts_list_channels`
List all channels on the TeamSpeak server.

**Parameters:** none

**Returns:** JSON array of `{ cid, name, topic, totalClients }`

---

### `ts_create_channel`
Create a new channel on the TeamSpeak server.

**Parameters:**
- `name` (string, required) — Channel name
- `topic` (string, optional) — Channel topic
- `description` (string, optional) — Channel description
- `password` (string, optional) — Channel password
- `parentChannelId` (number, optional) — CID of parent channel for sub-channels
- `isPermanent` (boolean, default `true`) — Whether the channel is permanent

**Returns:** `{ success: true, cid, name }`

---

### `ts_update_channel`
Update properties of an existing channel.

**Parameters:**
- `channelId` (number, required) — The CID of the channel to update
- `name` (string, optional) — New channel name
- `topic` (string, optional) — New channel topic
- `description` (string, optional) — New channel description
- `password` (string, optional) — New channel password
- `isPermanent` (boolean, optional) — Permanent flag

**Returns:** `{ success: true, channelId }`

---

### `ts_delete_channel`
Delete a channel by ID.

**Parameters:**
- `channelId` (number, required) — The CID of the channel to delete
- `force` (boolean, default `false`) — Force delete even if clients are inside

**Returns:** `{ success: true, channelId }`

## MCP Client Configuration

Configure your MCP client to connect to `http://localhost:3000/mcp` (or the configured `MCP_PORT`).

Example for Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "teamspeak": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

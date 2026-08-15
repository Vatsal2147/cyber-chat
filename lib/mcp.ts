import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const MCP_URL =
  "https://remote-mcp-server-authless.awesomevatsal2147.workers.dev/mcp";

export async function createMcpClient() {
  const client = new Client({
    name: "gemini-chatbot",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_URL),
  );

  await client.connect(transport);

  return client;
}
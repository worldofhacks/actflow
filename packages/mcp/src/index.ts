#!/usr/bin/env node
import "dotenv/config";
import { MarketplaceMcpServer } from "./mcp-server";

async function main() {
  const server = new MarketplaceMcpServer();
  await server.start();
}

main().catch((error) => {
  // stderr only: stdout is reserved for the MCP JSON-RPC stream.
  console.error("Fatal error starting ACT Marketplace MCP Server:", error);
  process.exit(1);
});

export { MarketplaceMcpServer };

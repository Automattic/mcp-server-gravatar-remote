#!/usr/bin/env node

/**
 * Gravatar MCP Server - Express.js Node.js Implementation
 * Entry point for the unified MCP server
 */

import { createServer } from "./server.js";
import { createHttpTransport } from "./transports/http-unified.js";

const server = createServer();

async function main() {
  console.log("Starting Gravatar MCP StreamableHTTP server...");
  createHttpTransport(server);
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});

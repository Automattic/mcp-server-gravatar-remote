#!/usr/bin/env node

/**
 * Gravatar MCP Server - Node.js Implementation
 * Entry point for the MCP server with support for both STDIO and HTTP transports
 */

import { createServer } from "./server.js";
import { createStdioTransport } from "./transports/stdio.js";
import { createHttpTransport } from "./transports/http-unified.js";
import { getEnv, type Env } from "./common/env.js";

async function main() {
  const env = getEnv<Env>();
  const server = createServer();

  if (env.MCP_TRANSPORT === "http") {
    console.log("Starting Gravatar MCP server in HTTP mode...");
    createHttpTransport(server);
  } else {
    // Default to STDIO (standard MCP pattern)
    createStdioTransport(server);
  }
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});

/**
 * STDIO Transport for MCP Server
 *
 * Provides standard input/output transport for MCP communication.
 * This is the standard MCP transport mode used by most clients.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getEnv, type Env } from "../common/env.js";

/**
 * Create and start STDIO transport for MCP server
 * @param server - The MCP server instance
 */
export function createStdioTransport(server: McpServer): void {
  const env = getEnv<Env>();

  const transport = new StdioServerTransport();

  // Connect the server to the transport
  server.connect(transport);

  if (env.DEBUG === "true") {
    console.error("[DEBUG] Server listening on STDIO");
  }
}

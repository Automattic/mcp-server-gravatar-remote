#!/usr/bin/env node

/**
 * Gravatar MCP Server - Express.js Node.js Implementation
 * Entry point for the unified MCP server
 */

import { createServer } from "./server.js";
import { createUnifiedTransport } from "./transports/unified.js";

// Create MCP server instance
const mcpServer = createServer();

// Start unified transport (creates its own Express app)
createUnifiedTransport(mcpServer);

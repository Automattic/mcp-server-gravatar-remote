#!/usr/bin/env node

/**
 * Gravatar MCP Server - Express.js Node.js Implementation
 * Entry point and Express server setup
 */

import express from "express";
import cors from "cors";
import { createServer } from "./server.js";
import { createUnifiedTransport } from "./transports/unified.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create MCP server instance
const mcpServer = createServer();

// Setup unified transport (HTTP + SSE)
createUnifiedTransport(app, mcpServer);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "gravatar-mcp-server",
    version: "0.1.0",
  });
});

// Root endpoint with basic info
app.get("/", (_req, res) => {
  res.json({
    name: "Gravatar MCP Server",
    version: "0.1.0",
    endpoints: {
      health: "/health",
      mcp_sse: "/mcp (GET)",
      mcp_http: "/mcp (POST)",
    },
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Gravatar MCP Server listening on port ${port}`);
  console.log(`📡 SSE endpoint: http://localhost:${port}/mcp`);
  console.log(`🩺 Health check: http://localhost:${port}/health`);
});

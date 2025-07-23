/**
 * StreamableHTTP MCP transport
 * - POST /mcp: StreamableHTTP JSON-RPC requests
 * - GET /health: Health check endpoint
 */

import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export const createUnifiedTransport = (server: McpServer) => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "gravatar-mcp-server",
      version: "0.1.0",
      transports: ["streamable-http"],
    });
  });

  // POST /mcp → StreamableHTTP transport only
  app.post("/mcp", async (req, res) => {
    try {
      if (process.env.DEBUG === "true") {
        console.log(`[DEBUG] POST /mcp - Method: ${req.body?.method}`);
      }

      const httpTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless operation
      });

      await server.connect(httpTransport);

      // Set response headers
      res.setHeader("Content-Type", "application/json");

      await httpTransport.handleRequest(req, res, req.body);

      // Send tool list notification after initialize
      if (req.body?.method === "initialize") {
        server.sendToolListChanged();
      }
    } catch (error) {
      console.error("Error in POST /mcp:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
            data: error instanceof Error ? error.message : String(error),
          },
          id: req.body?.id || null,
        });
      }
    }
  });

  const port = Number.parseInt(process.env.PORT || "8787", 10);
  const host =
    process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  app.listen(port, host, () => {
    console.log(`🚀 Gravatar MCP Server listening on ${host}:${port}`);
    console.log(
      `📡 MCP endpoint: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/mcp`,
    );
    console.log(
      `🩺 Health check: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/health`,
    );
    console.log("✨ Supports: StreamableHTTP (modern MCP transport)");
  });
};

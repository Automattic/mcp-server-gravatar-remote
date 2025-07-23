/**
 * StreamableHTTP MCP transport
 * - POST /mcp: StreamableHTTP JSON-RPC requests (client-to-server)
 * - GET /mcp: SSE stream for server notifications (server-to-client)
 * - GET /health: Health check endpoint
 *
 * Based on the CircleCI MCP server implementation:
 * https://github.com/CircleCI-Public/mcp-server-circleci
 * Licensed under Apache License 2.0
 */

import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Debug subclass that logs every payload sent over SSE
class DebugSSETransport extends SSEServerTransport {
  override async send(payload: any) {
    if (process.env.DEBUG === "true") {
      console.log("[DEBUG] SSE out ->", JSON.stringify(payload));
    }
    return super.send(payload);
  }
}

export const createHttpTransport = (server: McpServer) => {
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

  // GET /mcp → SSE stream for StreamableHTTP server-to-client notifications
  app.get("/mcp", (_req, res) => {
    (async () => {
      if (process.env.DEBUG === "true") {
        console.log("[DEBUG] StreamableHTTP SSE stream request");
      }
      // Create SSE transport for server-to-client notifications
      const transport = new DebugSSETransport("/mcp", res);
      if (process.env.DEBUG === "true") {
        console.log("[DEBUG] Created SSE transport for StreamableHTTP notifications");
      }
      await server.connect(transport);
      // Notify newly connected client of current tool catalogue
      server.sendToolListChanged();
      // SSE connection will be closed by client or on disconnect
    })().catch((err) => {
      console.error("GET /mcp error:", err);
      if (!res.headersSent) res.status(500).end();
    });
  });

  // POST /mcp → StreamableHTTP transport only
  app.post("/mcp", async (req, res) => {
    try {
      if (process.env.DEBUG === "true") {
        console.log(`[DEBUG] POST /mcp - Method: ${req.body?.method}`);
        const names = Object.keys((server as any)._registeredTools ?? {});
        console.log("[DEBUG] visible tools:", names);
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

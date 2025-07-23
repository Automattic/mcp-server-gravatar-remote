/**
 * Unified MCP transport: Streamable HTTP + SSE on same app/port/session.
 * - POST /mcp: JSON-RPC (single or chunked JSON)
 * - GET /mcp: SSE stream (server-initiated notifications)
 * - DELETE /mcp: Session termination
 * - GET /health: Health check endpoint
 *
 * Based on the CircleCI MCP server implementation:
 * https://github.com/CircleCI-Public/mcp-server-circleci
 * Licensed under Apache License 2.0
 */

import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// Debug subclass that logs every payload sent over SSE
class DebugSSETransport extends SSEServerTransport {
  override async send(payload: any) {
    if (process.env.DEBUG === "true") {
      console.log("[DEBUG] SSE out ->", JSON.stringify(payload));
    }
    return super.send(payload);
  }
}

export const createUnifiedTransport = (server: McpServer) => {
  const app = express();
  app.use(express.json());

  // Stateless: No in-memory session or transport store

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "gravatar-mcp-server",
      version: "0.1.0",
    });
  });

  // GET /mcp → open SSE stream, assign session if needed (stateless)
  app.get("/mcp", (req, res) => {
    (async () => {
      if (process.env.DEBUG === "true") {
        const sessionId =
          req.header("Mcp-Session-Id") ||
          req.header("mcp-session-id") ||
          (req.query.sessionId as string);
        console.log("[DEBUG] [GET /mcp] Incoming session:", sessionId);
      }
      // Create SSE transport (stateless)
      const transport = new DebugSSETransport("/mcp", res);
      if (process.env.DEBUG === "true") {
        console.log("[DEBUG] [GET /mcp] Created SSE transport.");
      }
      await server.connect(transport);
      // Notify newly connected client of current tool catalogue
      await server.sendToolListChanged();
      // SSE connection will be closed by client or on disconnect
    })().catch((err) => {
      console.error("GET /mcp error:", err);
      if (!res.headersSent) res.status(500).end();
    });
  });

  // POST /mcp → Streamable HTTP, session-aware
  app.post("/mcp", (req, res) => {
    (async () => {
      try {
        if (process.env.DEBUG === "true") {
          const names = Object.keys((server as any)._registeredTools ?? {});
          console.log("[DEBUG] visible tools:", names);
          console.log("[DEBUG] incoming request body:", JSON.stringify(req.body));
        }

        // For each POST, create a temporary, stateless transport to handle the request/response cycle.
        const httpTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Ensures stateless operation
        });

        // Connect the server to the transport. This wires the server's internal `_handleRequest`
        // method to the transport's `onmessage` event.
        await server.connect(httpTransport);

        // Handle the request. The transport will receive the request, pass it to the server via
        // `onmessage`, receive the response from the server via its `send` method, and then
        // write the response back to the client over the HTTP connection.
        await httpTransport.handleRequest(req, res, req.body);

        // After responding to initialize, send tool catalogue again so the freshly initialised
        // client is guaranteed to see it (the first notification may have been sent before it
        // started listening on the SSE stream).
        if (req.body?.method === "initialize") {
          if (process.env.DEBUG === "true") {
            console.log("[DEBUG] initialize handled -> sending tools/list_changed again");
          }
          await server.sendToolListChanged();
        }
      } catch (error: any) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
              data: error.message,
            },
            id: req.body?.id || null,
          });
        }
      }
    })().catch((err) => {
      console.error("POST /mcp error:", err);
      if (!res.headersSent) res.status(500).end();
    });
  });

  // DELETE /mcp → stateless: acknowledge only
  app.delete("/mcp", (req, res) => {
    const sessionId =
      req.header("Mcp-Session-Id") ||
      req.header("mcp-session-id") ||
      (req.query.sessionId as string);
    if (process.env.DEBUG === "true") {
      console.log("[DEBUG] [DELETE /mcp] Incoming sessionId:", sessionId);
    }
    res.status(204).end();
  });

  const port = process.env.PORT || 8787;
  app.listen(port, () => {
    console.log(`🚀 Gravatar MCP Server listening on port ${port}`);
    console.log(`📡 SSE endpoint: http://localhost:${port}/mcp`);
    console.log(`🩺 Health check: http://localhost:${port}/health`);
  });
};

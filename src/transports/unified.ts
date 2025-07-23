/**
 * Unified MCP transport: Supports both StreamableHTTP and HTTP+SSE transports
 * - POST /mcp: Auto-detects transport type based on Accept header and sessionId
 * - GET /mcp: Establishes SSE stream for HTTP+SSE transport
 * - DELETE /mcp: Session termination
 * - GET /health: Health check endpoint
 *
 * Implements MCP backwards compatibility as per:
 * https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#backwards-compatibility
 */

import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// Debug subclass that logs every payload sent over SSE with security protections
class DebugSSETransport extends SSEServerTransport {
  constructor(endpoint: string, res: express.Response, serverPort: number) {
    super(endpoint, res, {
      enableDnsRebindingProtection: process.env.DISABLE_DNS_REBINDING_PROTECTION !== "true",
      allowedHosts:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWED_HOSTS?.split(",") || []
          : ["localhost", "127.0.0.1", "[::1]"], // Allow localhost in development
      allowedOrigins:
        process.env.NODE_ENV === "production"
          ? process.env.ALLOWED_ORIGINS?.split(",") || []
          : [
              // Only allow the actual server port in development
              `http://localhost:${serverPort}`,
              `http://127.0.0.1:${serverPort}`,
              "null", // For local file:// origins in development
            ],
    });
  }

  override async send(payload: any) {
    if (process.env.DEBUG === "true") {
      console.log("[DEBUG] SSE out ->", JSON.stringify(payload));
    }
    return super.send(payload);
  }
}

// Session storage for SSE transports
const sseTransports = new Map<string, DebugSSETransport>();

export const createUnifiedTransport = (server: McpServer) => {
  const app = express();
  app.use(express.json());

  // Get server configuration for dynamic origin allowlist
  const serverPort = Number.parseInt(process.env.PORT || "8787", 10);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "gravatar-mcp-server",
      version: "0.1.0",
      transports: ["streamable-http", "http+sse"],
      activeSessions: {
        sse: sseTransports.size,
      },
    });
  });

  // GET /mcp → Establish SSE stream for HTTP+SSE transport
  app.get("/mcp", async (req, res) => {
    try {
      const acceptHeader = req.headers.accept || "";

      if (!acceptHeader.includes("text/event-stream")) {
        res.status(406).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Not Acceptable: GET /mcp requires Accept: text/event-stream",
          },
          id: null,
        });
        return;
      }

      if (process.env.DEBUG === "true") {
        console.log("[DEBUG] Establishing HTTP+SSE connection via GET /mcp");
      }

      // Create SSE transport - it will generate its own sessionId
      const transport = new DebugSSETransport("/mcp", res, serverPort);

      // Store the transport by its sessionId for POST request routing
      sseTransports.set(transport.sessionId, transport);

      if (process.env.DEBUG === "true") {
        console.log(`[DEBUG] Created SSE transport with sessionId: ${transport.sessionId}`);
      }

      // Set up cleanup when connection closes
      res.on("close", () => {
        sseTransports.delete(transport.sessionId);
        if (process.env.DEBUG === "true") {
          console.log(`[DEBUG] Cleaned up SSE transport: ${transport.sessionId}`);
        }
      });

      // Connect server to transport (this automatically calls transport.start())
      await server.connect(transport);

      // Send initial tool list
      server.sendToolListChanged();

      if (process.env.DEBUG === "true") {
        console.log("[DEBUG] HTTP+SSE connection established and ready");
      }
    } catch (error) {
      console.error("Error in GET /mcp:", error);
      if (!res.headersSent) res.status(500).end();
    }
  });

  // POST /mcp → Handle both StreamableHTTP and HTTP+SSE POST requests
  app.post("/mcp", async (req, res) => {
    try {
      const acceptHeader = req.headers.accept || "";
      const sessionId = req.query.sessionId as string; // SSE uses query param
      const mcpSessionId = req.headers["mcp-session-id"] as string; // StreamableHTTP uses header
      const isInitialize = req.body?.method === "initialize";

      if (process.env.DEBUG === "true") {
        console.log(
          `[DEBUG] POST /mcp - Accept: ${acceptHeader}, SessionId: ${sessionId}, MCP-Session-Id: ${mcpSessionId}, Method: ${req.body?.method}`,
        );
      }

      // Check if this is an SSE transport POST (has sessionId query param)
      if (sessionId) {
        // This is an HTTP+SSE transport POST request
        const transport = sseTransports.get(sessionId);
        if (!transport) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: `Invalid or expired SSE session: ${sessionId}`,
            },
            id: req.body?.id || null,
          });
          return;
        }

        if (process.env.DEBUG === "true") {
          console.log(`[DEBUG] Routing POST to SSE transport: ${sessionId}`);
        }

        // Route to the SSE transport's handlePostMessage method
        await transport.handlePostMessage(req, res, req.body);
      } else {
        // This is a StreamableHTTP transport request
        if (process.env.DEBUG === "true") {
          console.log("[DEBUG] Handling StreamableHTTP POST request");
        }

        const httpTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless operation
        });

        await server.connect(httpTransport);

        // Set response headers
        res.setHeader("Content-Type", "application/json");

        await httpTransport.handleRequest(req, res, req.body);

        if (isInitialize) {
          server.sendToolListChanged();
        }
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

  // DELETE /mcp → Session termination for SSE transports
  app.delete("/mcp", (req, res) => {
    const sessionId = req.query.sessionId as string; // SSE

    if (sessionId) {
      // Terminate SSE transport
      const transport = sseTransports.get(sessionId);
      if (transport) {
        transport.close();
        sseTransports.delete(sessionId);
        if (process.env.DEBUG === "true") {
          console.log(`[DEBUG] Terminated SSE session: ${sessionId}`);
        }
      }
    }

    res.status(204).end();
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
    console.log("✨ Supports: StreamableHTTP + HTTP+SSE (backwards compatible)");
    console.log(
      `🔒 Security: DNS rebinding protection ${process.env.DISABLE_DNS_REBINDING_PROTECTION === "true" ? "disabled" : "enabled"}`,
    );
  });
};

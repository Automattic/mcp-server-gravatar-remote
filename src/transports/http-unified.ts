/**
 * Unified MCP HTTP Transport with Backwards Compatibility
 *
 * This transport implements the MCP backwards compatibility fallback mechanism:
 * https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#backwards-compatibility
 *
 * ENDPOINTS:
 * - POST /mcp: Modern StreamableHTTP requests + Legacy fallback detection
 * - GET /mcp: SSE stream for both modern and legacy clients
 * - POST /mcp/messages: Legacy client messages (HTTP+SSE transport)
 * - GET /health: Health check endpoint
 *
 * BACKWARDS COMPATIBILITY FALLBACK:
 *
 * Modern clients (StreamableHTTP):
 * 1. POST InitializeRequest to /mcp
 * 2. Server responds with StreamableHTTP transport
 * 3. Subsequent communication uses POST /mcp for bidirectional JSON-RPC
 *
 * Legacy clients (HTTP+SSE fallback):
 * 1. POST InitializeRequest to /mcp fails (not implemented for legacy protocol)
 * 2. Client falls back to GET /mcp expecting SSE stream
 * 3. Server sends "endpoint" event pointing to /mcp/messages?sessionId=...
 * 4. Client uses POST /mcp/messages for subsequent requests
 * 5. Server responses sent via SSE stream from GET /mcp
 *
 * UNIFIED ENDPOINT DESIGN:
 *
 * GET /mcp:
 * - Creates SSE transport with endpoint event for legacy clients
 * - Modern StreamableHTTP clients typically don't use this endpoint
 * - Session management via auto-generated sessionId
 *
 * POST /mcp:
 * - Handles modern StreamableHTTP requests (primary use case)
 * - Legacy clients that attempt this will fail, triggering fallback
 * - Stateless operation with per-request transport instances
 *
 * POST /mcp/messages:
 * - Routes legacy client messages to correct SSE transport by sessionId
 * - Only used after successful GET /mcp connection establishment
 * - Validates session exists before processing messages
 *
 * This design allows seamless communication between newer and older protocol
 * versions without requiring immediate universal upgrades, as recommended by
 * the MCP specification.
 *
 * Environment Variables:
 * - ENABLE_DNS_REBINDING_PROTECTION: Enable/disable DNS rebinding protection
 * - ALLOWED_HOSTS: Comma-separated allowed Host header values (production)
 * - ALLOWED_ORIGINS: Comma-separated allowed Origin header values (production)
 * - NODE_ENV: When not "production", uses localhost defaults for development
 * - DEBUG: Enable debug logging for transport operations
 *
 * Based on the CircleCI MCP server implementation:
 * https://github.com/CircleCI-Public/mcp-server-circleci
 * Licensed under Apache License 2.0
 */

import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { getServerInfo } from "../config/server-config.js";
import { getEnv, type Env } from "../common/env.js";
// Debug subclass that logs every payload sent over SSE
class DebugSSETransport extends SSEServerTransport {
  constructor(
    path: string,
    response: any,
    private debugEnabled: boolean,
  ) {
    super(path, response);
  }

  override async send(payload: any) {
    if (this.debugEnabled) {
      console.log("[DEBUG] SSE out ->", JSON.stringify(payload));
    }
    return super.send(payload);
  }
}

export const createHttpTransport = (server: McpServer) => {
  const env = getEnv<Env>();
  const app = express();
  app.use(express.json());

  // DNS rebinding protection configuration (shared across requests)
  const isDevelopment = env.NODE_ENV !== "production";
  const enableDnsRebinding = env.ENABLE_DNS_REBINDING_PROTECTION === "true"; // Default: false (matches SDK)

  const defaultHosts = isDevelopment ? ["localhost:8787", "127.0.0.1:8787"] : [];
  const defaultOrigins = isDevelopment ? ["http://localhost:8787", "http://127.0.0.1:8787"] : [];

  // Health check endpoint
  app.get("/health", (_req, res) => {
    const serverInfo = getServerInfo();
    res.json({
      status: "ok",
      server: serverInfo.name,
      version: serverInfo.version,
      transports: ["streamable-http", "http-sse"],
    });
  });

  // Store SSE transports by session ID for backward compatibility
  const sseTransports = new Map<string, SSEServerTransport>();

  // GET /mcp → Unified endpoint for both StreamableHTTP SSE and HTTP+SSE fallback
  app.get("/mcp", (_req, res) => {
    (async () => {
      if (env.DEBUG === "true") {
        console.log("[DEBUG] GET /mcp - StreamableHTTP SSE or HTTP+SSE fallback");
      }

      // Create SSE transport - will send endpoint event pointing to /mcp/messages for HTTP+SSE clients
      // StreamableHTTP clients will ignore the endpoint event
      const transport = new DebugSSETransport("/mcp/messages", res, env.DEBUG === "true");

      if (env.DEBUG === "true") {
        console.log(`[DEBUG] Created SSE transport, session: ${transport.sessionId}`);
      }

      // Connect to server first - this sends the endpoint event
      await server.connect(transport);

      // Store transport by session ID for POST message routing
      transport.onclose = () => {
        if (env.DEBUG === "true") {
          console.log(`[DEBUG] SSE client disconnected, session: ${transport.sessionId}`);
        }
        sseTransports.delete(transport.sessionId);
      };

      sseTransports.set(transport.sessionId, transport);

      if (env.DEBUG === "true") {
        console.log(`[DEBUG] SSE transport connected and stored, session: ${transport.sessionId}`);
      }

      // Notify newly connected client of current tool catalogue
      server.sendToolListChanged();
    })().catch((err) => {
      console.error("GET /mcp error:", err);
      if (!res.headersSent) res.status(500).end();
    });
  });

  // POST /mcp/messages → HTTP endpoint for HTTP+SSE client messages
  app.post("/mcp/messages", async (req, res) => {
    try {
      if (env.DEBUG === "true") {
        console.log("[DEBUG] POST /mcp/messages - Query params:", req.query);
        console.log(
          "[DEBUG] POST /mcp/messages - Available sessions:",
          Array.from(sseTransports.keys()),
        );
      }

      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        console.error("Missing session ID in POST /mcp/messages");
        console.log("Query params:", req.query);
        console.log("Available sessions:", Array.from(sseTransports.keys()));
        return res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32600, message: "Missing session ID" },
          id: null,
        });
      }

      const transport = sseTransports.get(sessionId);
      if (!transport) {
        return res.status(404).json({
          jsonrpc: "2.0",
          error: { code: -32600, message: "Session not found" },
          id: null,
        });
      }

      if (env.DEBUG === "true") {
        console.log(
          `[DEBUG] POST /mcp/messages - Session: ${sessionId}, Method: ${req.body?.method}`,
        );
      }

      await transport.handleMessage(req.body);

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Error in POST /mcp/messages:", error);
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

  // POST /mcp → StreamableHTTP transport only
  app.post("/mcp", async (req, res) => {
    try {
      if (env.DEBUG === "true") {
        console.log(`[DEBUG] POST /mcp - Method: ${req.body?.method}`);
        console.log("[DEBUG] Request headers:", {
          host: req.headers.host,
          origin: req.headers.origin,
          referer: req.headers.referer,
          "user-agent": req.headers["user-agent"],
        });
        const names = Object.keys((server as any)._registeredTools ?? {});
        console.log("[DEBUG] visible tools:", names);
      }

      const httpTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless operation
        enableDnsRebindingProtection: enableDnsRebinding,
        allowedHosts: env.ALLOWED_HOSTS?.split(",") || defaultHosts,
        allowedOrigins: env.ALLOWED_ORIGINS?.split(",") || defaultOrigins,
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

  const port = Number.parseInt(env.PORT || "8787", 10);
  const host = env.HOST || (env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  app.listen(port, host, () => {
    if (env.DEBUG === "true") {
      console.log("🐞 Debug Logging: Enabled");
    }
    console.log(`🚀 Gravatar MCP Server listening on ${host}:${port}`);
    console.log(
      `🔒 DNS Rebinding Protection: ${enableDnsRebinding ? "✅ Enabled" : "❌ Disabled"}`,
    );
    console.log(
      `📡 MCP endpoint: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/mcp`,
    );
    console.log(
      `🔄 Legacy SSE: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/mcp (backward compatibility)`,
    );
    console.log(
      `🩺 Health check: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/health`,
    );
    console.log("✨ Supports: StreamableHTTP (modern), HTTP+SSE (legacy)");
  });
};

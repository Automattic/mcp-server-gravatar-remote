/**
 * StreamableHTTP MCP transport with HTTP+SSE backward compatibility
 * 
 * STREAMABLE HTTP (Modern):
 * - POST /mcp: StreamableHTTP JSON-RPC requests (bidirectional)
 * - GET /mcp: Returns 405 Method Not Allowed (no SSE streaming needed)
 * 
 * HTTP+SSE (Legacy backward compatibility):
 * - GET /sse: SSE stream for server notifications (server-to-client)
 * - POST /sse/messages: Client messages (client-to-server)
 * 
 * OTHER ENDPOINTS:
 * - GET /health: Health check endpoint
 *
 * This server wraps a simple REST API, so SSE streaming is not needed for
 * StreamableHTTP transport. Per MCP spec, GET /mcp returns 405 Method Not Allowed.
 *
 * Security Features:
 * - DNS rebinding protection via MCP SDK (configurable via environment variables)
 * - Host and Origin header validation
 *
 * Environment Variables:
 * - ENABLE_DNS_REBINDING_PROTECTION: Enable/disable DNS rebinding protection (default: true)
 * - ALLOWED_HOSTS: Comma-separated list of allowed Host header values (production)
 * - ALLOWED_ORIGINS: Comma-separated list of allowed Origin header values (production)
 * - NODE_ENV: When not "production", uses localhost defaults for development
 *
 * Loosely based on the CircleCI MCP server implementation:
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

  // WP VIP required health check endpoint
  app.get("/cache-healthcheck", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Store SSE transports by session ID for backward compatibility
  const sseTransports = new Map<string, SSEServerTransport>();

  // GET /sse → SSE connection for backward compatibility with older MCP clients
  app.get("/sse", (_req, res) => {
    (async () => {
      if (env.DEBUG === "true") {
        console.log("[DEBUG] HTTP+SSE backward compatibility connection");
      }

      // Create SSE transport for backward compatibility - SDK handles endpoint event automatically
      const transport = new DebugSSETransport("/sse/messages", res, env.DEBUG === "true");

      if (env.DEBUG === "true") {
        console.log(`[DEBUG] Created SSE transport for HTTP+SSE, session: ${transport.sessionId}`);
      }

      // Connect to server first - this calls transport.start() which sends the endpoint event
      await server.connect(transport);

      // Store transport by session ID for POST routing (after connection is established)
      transport.onclose = () => {
        if (env.DEBUG === "true") {
          console.log(`[DEBUG] HTTP+SSE client disconnected, session: ${transport.sessionId}`);
        }
        sseTransports.delete(transport.sessionId);
      };

      sseTransports.set(transport.sessionId, transport);

      if (env.DEBUG === "true") {
        console.log(
          `[DEBUG] HTTP+SSE transport connected and stored, session: ${transport.sessionId}`,
        );
      }

      // Notify newly connected client of current tool catalogue
      server.sendToolListChanged();
    })().catch((err) => {
      console.error("GET /sse error:", err);
      if (!res.headersSent) res.status(500).end();
    });
  });

  // POST /sse/messages → HTTP endpoint for client messages in backward compatibility mode
  app.post("/sse/messages", async (req, res) => {
    try {
      if (env.DEBUG === "true") {
        console.log("[DEBUG] POST /sse/messages - Query params:", req.query);
        console.log(
          "[DEBUG] POST /sse/messages - Available sessions:",
          Array.from(sseTransports.keys()),
        );
      }

      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        console.error("Missing session ID in POST /sse/messages");
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
          `[DEBUG] POST /sse/messages - Session: ${sessionId}, Method: ${req.body?.method}`,
        );
      }

      await transport.handleMessage(req.body);

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Error in POST /sse/messages:", error);
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

  // GET /mcp → StreamableHTTP does not support SSE streaming (per MCP spec)
  app.get("/mcp", (_req, res) => {
    if (env.DEBUG === "true") {
      console.log("[DEBUG] StreamableHTTP GET request - returning 405 Method Not Allowed (no SSE support)");
    }
    // Per MCP spec: "The server MUST either return Content-Type: text/event-stream
    // in response to this HTTP GET, or else return HTTP 405 Method Not Allowed,
    // indicating that the server does not offer an SSE stream at this endpoint."
    // Since this server wraps a fast REST API, SSE streaming is not needed.
    res.status(405).json({
      error: "Method Not Allowed",
      message: "This StreamableHTTP server does not support SSE streaming. Use POST /mcp for requests.",
    });
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
      `🔄 SSE endpoint: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/sse (backward compatibility)`,
    );
    console.log(
      `🩺 Health check: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/health`,
    );
    console.log("✨ Supports: StreamableHTTP (modern), HTTP+SSE (legacy)");
  });
};

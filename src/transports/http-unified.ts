/**
 * StreamableHTTP MCP transport
 * - POST /mcp: StreamableHTTP JSON-RPC requests (client-to-server)
 * - GET /mcp: SSE stream for server notifications (server-to-client)
 * - GET /health: Health check endpoint
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
      transports: ["streamable-http"],
    });
  });

  // GET /mcp → SSE stream for StreamableHTTP server-to-client notifications
  app.get("/mcp", (_req, res) => {
    (async () => {
      if (env.DEBUG === "true") {
        console.log("[DEBUG] StreamableHTTP SSE stream request");
      }
      // Create SSE transport for server-to-client notifications
      const transport = new DebugSSETransport("/mcp", res, env.DEBUG === "true");
      if (env.DEBUG === "true") {
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
      `🩺 Health check: http://${host === "0.0.0.0" ? "your-domain.com" : "localhost"}:${port}/health`,
    );
    console.log("✨ Supports: StreamableHTTP (modern MCP transport)");
  });
};

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getServerInfo, setClientInfo } from "./config/server-config.js";
import { getGravatarIntegrationGuide } from "./resources/integration-guide.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerAvatarImageTools } from "./tools/avatar-images.js";
import { registerExperimentalTools } from "./tools/experimental.js";

import { createOAuthProvider } from "./auth/oauth-config.js";
import type { Env as ConfigEnv } from "./common/env.js";

// Re-export the Env interface from common/env.ts
export type Env = ConfigEnv;

// Define the MCP agent with Gravatar tools
export class GravatarMcpServer extends McpAgent<Env> {
  server = new McpServer(getServerInfo());

  async init() {
    // Set up callback to store client information after client initialization
    this.server.server.oninitialized = () => {
      const clientInfo = this.server.server.getClientVersion();
      const clientCapabilities = this.server.server.getClientCapabilities();
      setClientInfo(clientInfo, clientCapabilities);
    };

    // Get optional API key from environment
    const apiKey = this.env.GRAVATAR_API_KEY;

    // Register Gravatar API Integration Guide prompt
    this.server.registerPrompt(
      "api-integration-prompt",
      {
        title: "Gravatar API Integration Guide",
        description:
          "Comprehensive API guide for Gravatar v3.0.0, detailing how developers can integrate avatar and profile services using email hash-based identification, API key authentication, and various endpoints across web, Android, and iOS platforms.",
      },
      async () => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: await getGravatarIntegrationGuide(this.env.ASSETS),
            },
          },
        ],
      }),
    );

    // Register all tools using the new modular approach
    registerProfileTools(this, apiKey);
    registerAvatarImageTools(this);
    registerExperimentalTools(this, apiKey);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Handle OAuth routes if OAuth is configured
    const oauthProvider = createOAuthProvider(env);
    if (oauthProvider) {
      // OAuth authorization endpoint
      if (pathname.startsWith("/oauth/authorize")) {
        return await oauthProvider.authorize(request);
      }

      // OAuth callback endpoint
      if (pathname.startsWith("/oauth/callback")) {
        return await oauthProvider.callback(request);
      }

      // OAuth token endpoint
      if (pathname.startsWith("/oauth/token")) {
        return await oauthProvider.token(request);
      }
    }

    // MCP Server-Sent Events endpoint
    if (pathname.startsWith("/sse")) {
      return GravatarMcpServer.serveSSE("/sse").fetch(request, env, ctx);
    }

    // MCP WebSocket/HTTP endpoint
    if (pathname.startsWith("/mcp")) {
      return GravatarMcpServer.serve("/mcp").fetch(request, env, ctx);
    }

    // Root path - provide basic information
    if (pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Gravatar MCP Server",
          version: "0.1.0",
          endpoints: {
            mcp: "/mcp",
            sse: "/sse",
            ...(oauthProvider
              ? {
                  oauth_authorize: "/oauth/authorize",
                  oauth_callback: "/oauth/callback",
                  oauth_token: "/oauth/token",
                }
              : {}),
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};

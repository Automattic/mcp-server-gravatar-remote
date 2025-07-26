import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getServerInfo, setClientInfo } from "./config/server-config.js";
import { getGravatarIntegrationGuide } from "./resources/integration-guide.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerAvatarImageTools } from "./tools/avatar-images.js";
import { registerExperimentalTools } from "./tools/experimental.js";

import type { Env as ConfigEnv } from "./common/env.js";
import {
  authorize,
  callback,
  confirmConsent,
  tokenExchangeCallback,
  registerClient,
} from "./auth.js";
import { Hono } from "hono";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

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

// Initialize the Hono app with routes for the OAuth Provider
const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: any } }>();
app.get("/authorize", authorize);
app.post("/authorize/consent", confirmConsent);
app.get("/callback", callback);
app.post("/register", registerClient);

// Root endpoint for basic server info
app.get("/", (c) => {
  const serverInfo = getServerInfo();
  return c.json({
    name: serverInfo.name,
    version: serverInfo.version,
    endpoints: {
      mcp: "/mcp",
      sse: "/sse",
      oauth_authorize: "/authorize",
      oauth_callback: "/callback",
      oauth_token: "/token",
    },
  });
});

function createOAuthProviderIfConfigured(env: Env) {
  // Only create OAuth provider if all required variables are set
  if (!env.OAUTH_CLIENT_ID || !env.OAUTH_CLIENT_SECRET || !env.OAUTH_AUTHORIZATION_ENDPOINT) {
    return null;
  }

  return new OAuthProvider({
    // @ts-expect-error - Type issues with the OAuth provider library
    apiHandler: GravatarMcpServer.mount("/sse"),
    apiRoute: "/sse",
    authorizeEndpoint: "/authorize",
    clientRegistrationEndpoint: "/register",
    tokenEndpoint: "/token",
    // @ts-expect-error - Type issues with the OAuth provider library
    defaultHandler: app,
    tokenExchangeCallback: (options: any) => tokenExchangeCallback(options),
  });
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const oauthProvider = createOAuthProviderIfConfigured(env);

    if (oauthProvider) {
      return oauthProvider.fetch(request, env, ctx);
    }

    // Fallback to basic MCP server without OAuth
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/sse")) {
      return GravatarMcpServer.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (pathname.startsWith("/mcp")) {
      return GravatarMcpServer.serve("/mcp").fetch(request, env, ctx);
    }

    return app.fetch(request, env, ctx);
  },
};

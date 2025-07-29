import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getServerInfo, setClientInfo } from "./config/server-config.js";
import { getGravatarIntegrationGuide } from "./resources/integration-guide.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerAvatarImageTools } from "./tools/avatar-images.js";
import { registerExperimentalTools } from "./tools/experimental.js";

// Environment interface for Cloudflare Workers
export interface Env {
  GRAVATAR_API_KEY?: string;
  ASSETS: Fetcher;
}

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
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/sse")) {
      return GravatarMcpServer.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (pathname.startsWith("/mcp")) {
      return GravatarMcpServer.serve("/mcp").fetch(request, env, ctx);
    }

    // Optional: Handle root path or other routes
    return new Response("Not Found", { status: 404 });
  },
};

/**
 * MCP Server Implementation with Tool Registration
 * Contains all Gravatar-specific tools and prompt registration
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getServerInfo, setClientInfo } from "./config/server-config.js";
import { getEnv, type Env } from "./common/env.js";
import { getGravatarIntegrationGuide } from "./resources/integration-guide.js";
import { registerProfileTools } from "./tools/profiles.js";
import { registerAvatarImageTools } from "./tools/avatar-images.js";
import { registerExperimentalTools } from "./tools/experimental.js";

export function createServer(): McpServer {
  const server = new McpServer(getServerInfo());

  // Capture client info after initialization for User-Agent generation
  // Note: This callback only fires when clients follow the full MCP initialization flow.
  // Some clients (like MCP Inspector making direct tool calls) may bypass initialization,
  // resulting in "unknown/unknown" client info in User-Agent headers.
  server.server.oninitialized = () => {
    const clientInfo = server.server.getClientVersion();
    const clientCapabilities = server.server.getClientCapabilities();

    setClientInfo(clientInfo, clientCapabilities);

    const env = getEnv<Env>();
    if (env.DEBUG === "true") {
      console.log("[DEBUG] Client info:", {
        name: clientInfo?.name ?? "unknown",
        version: clientInfo?.version ?? "unknown",
      });
    }
  };

  // Get API key from environment
  const apiKey = process.env.GRAVATAR_API_KEY;

  // Register Gravatar API Integration Guide prompt
  server.registerPrompt(
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
            text: await getGravatarIntegrationGuide(),
          },
        },
      ],
    }),
  );

  // Register all tools using the new modular approach
  registerProfileTools(server, apiKey);
  registerAvatarImageTools(server);
  registerExperimentalTools(server, apiKey);

  return server;
}

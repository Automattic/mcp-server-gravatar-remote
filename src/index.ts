import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getServerInfo, setClientInfo, setConnectingIP } from "./config/server-config.js";
import {
  mcpProfileOutputSchema,
  mcpInterestsOutputSchema,
  mcpProfileInputShape,
  mcpEmailInputShape,
} from "./schemas/mcp-schemas.js";
import { generateIdentifier } from "./common/utils.js";
import { getProfile } from "./tools/profile-utils.js";
import { getInferredInterests } from "./tools/experimental-utils.js";
import { fetchAvatar, avatarParams } from "./tools/avatar-utils.js";
import { getGravatarIntegrationGuide } from "./resources/integration-guide.js";

// Environment interface for Cloudflare Workers
export interface Env {
  GRAVATAR_API_KEY?: string;
  ASSETS: Fetcher;
  CONNECTING_IP?: string;
}

// Define the MCP agent with Gravatar tools
export class GravatarMcpServer extends McpAgent<Env> {
  server = new McpServer(getServerInfo());

  async init() {
    // Store the connecting IP from isolated environment
    const connectingIP = this.env?.CONNECTING_IP;
    if (connectingIP) {
      setConnectingIP(connectingIP);
    }
    // Set up callback to store client information after client initialization
    this.server.server.oninitialized = () => {
      const clientInfo = this.server.server.getClientVersion();
      const clientCapabilities = this.server.server.getClientCapabilities();
      setClientInfo(clientInfo, clientCapabilities);
    };
    // Get optional API key from environment
    const apiKey = this.env?.GRAVATAR_API_KEY;

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

    // Register get_profile_by_email tool
    this.server.registerTool(
      "get_profile_by_email",
      {
        title: "Get Gravatar Profile by Email",
        description:
          "Retrieve comprehensive Gravatar profile information using an email address. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Show me the Gravatar profile for john.doe@example.com' or 'Get profile info for user@company.com.'</examples>",
        inputSchema: mcpEmailInputShape,
        outputSchema: mcpProfileOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ email }) => {
        try {
          const identifier = await generateIdentifier(email);
          const profile = await getProfile(identifier, apiKey);
          return {
            content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
            structuredContent: { ...profile },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to get profile for email "${email}": ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Register get_profile_by_id tool
    this.server.registerTool(
      "get_profile_by_id",
      {
        title: "Get Gravatar Profile by ID",
        description:
          "Retrieve comprehensive Gravatar profile information using a profile identifier. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Get the profile for Gravatar user with ID abc123...' or 'Show me the profile for username johndoe.'</examples>",
        inputSchema: mcpProfileInputShape,
        outputSchema: mcpProfileOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ profileIdentifier }) => {
        try {
          const profile = await getProfile(profileIdentifier, apiKey);
          return {
            content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
            structuredContent: { ...profile },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to get profile for ID "${profileIdentifier}": ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Register get_inferred_interests_by_email tool
    this.server.registerTool(
      "get_inferred_interests_by_email",
      {
        title: "Get Inferred Interests by Email",
        description:
          "Retrieve AI-inferred interests for a Gravatar profile using an email address. Returns experimental machine learning-generated interest data based on public profile information. <hint>When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.</hint> <examples>'Get the inferred interests for user@example.com' or 'Show me inferred interests for john.doe@company.com.'</examples>",
        inputSchema: mcpEmailInputShape,
        outputSchema: mcpInterestsOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: false,
        },
      },
      async ({ email }) => {
        try {
          const identifier = await generateIdentifier(email);
          const interests = await getInferredInterests(identifier, apiKey);
          const structuredInterests = { interests };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(structuredInterests, null, 2),
              },
            ],
            structuredContent: structuredInterests,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to get interests for email "${email}": ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Register get_inferred_interests_by_id tool
    this.server.registerTool(
      "get_inferred_interests_by_id",
      {
        title: "Get Inferred Interests by ID",
        description:
          "Retrieve AI-inferred interests for a Gravatar profile using a profile identifier. Returns experimental machine learning-generated interest data based on public profile information. <hint>When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.</hint> <examples>'Get the inferred interests for user ID abc123...' or 'Show me inferred interests for username johndoe.'</examples>",
        inputSchema: mcpProfileInputShape,
        outputSchema: mcpInterestsOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: false,
        },
      },
      async ({ profileIdentifier }) => {
        try {
          const interests = await getInferredInterests(profileIdentifier, apiKey);
          const structuredInterests = { interests };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(structuredInterests, null, 2),
              },
            ],
            structuredContent: structuredInterests,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to get interests for ID "${profileIdentifier}": ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Register get_avatar_by_email tool
    this.server.registerTool(
      "get_avatar_by_email",
      {
        title: "Get Avatar Image by Email",
        description:
          "Retrieve the avatar image for a Gravatar profile using an email address. The email is automatically normalized and hashed before querying the Gravatar API. <examples>'Get the avatar image for user@example.com' or 'Show me a 200px avatar for john.doe@company.com.'</examples>",
        inputSchema: {
          email: z
            .string()
            .email()
            .describe(
              "The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup. The email is processed securely and not stored.",
            ),
          size: z
            .number()
            .min(1)
            .max(2048)
            .optional()
            .describe(
              "Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays). Gravatar will scale the image appropriately.",
            ),
          defaultOption: z
            .enum(["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"])
            .optional()
            .describe(
              "Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent). If not specified, Gravatar's default image is returned when no avatar exists.",
            ),
          forceDefault: z
            .boolean()
            .optional()
            .describe(
              "When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.",
            ),
          rating: z
            .enum(["G", "PG", "R", "X", "g", "pg", "r", "x"])
            .optional()
            .describe(
              "Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.",
            ),
        },
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ email, size, defaultOption, forceDefault, rating }) => {
        try {
          const identifier = await generateIdentifier(email);

          const avatarResult = await fetchAvatar(
            avatarParams(identifier, size, defaultOption, forceDefault, rating),
          );

          return {
            content: [
              {
                type: "image",
                data: avatarResult.base64Data,
                mimeType: avatarResult.mimeType,
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to get avatar for email "${email}": ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Register get_avatar_by_id tool
    this.server.registerTool(
      "get_avatar_by_id",
      {
        title: "Get Avatar Image by ID",
        description:
          "Retrieve the avatar image for a Gravatar profile using an avatar identifier. More efficient when you already have the hashed identifier. <examples>'Get the avatar image for this Gravatar ID' or 'Show me a 150px avatar for user ID abc123...'</examples>",
        inputSchema: {
          avatarIdentifier: z
            .string()
            .min(1)
            .describe(
              "Avatar identifier for the Gravatar profile. An Avatar Identifier is an email address that has been normalized (e.g. lower-cased and trimmed) and then hashed with either SHA256 (preferred) or MD5 (deprecated). Note: Unlike profile identifiers, avatar identifiers cannot use URL slugs - only email hashes are supported.",
            ),
          size: z
            .number()
            .min(1)
            .max(2048)
            .optional()
            .describe(
              "Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays). Gravatar will scale the image appropriately.",
            ),
          defaultOption: z
            .enum(["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"])
            .optional()
            .describe(
              "Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent). If not specified, Gravatar's default image is returned when no avatar exists.",
            ),
          forceDefault: z
            .boolean()
            .optional()
            .describe(
              "When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.",
            ),
          rating: z
            .enum(["G", "PG", "R", "X", "g", "pg", "r", "x"])
            .optional()
            .describe(
              "Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.",
            ),
        },
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ avatarIdentifier, size, defaultOption, forceDefault, rating }) => {
        try {
          const avatarResult = await fetchAvatar(
            avatarParams(avatarIdentifier, size, defaultOption, forceDefault, rating),
          );

          return {
            content: [
              {
                type: "image",
                data: avatarResult.base64Data,
                mimeType: avatarResult.mimeType,
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to get avatar for ID "${avatarIdentifier}": ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);

    // Capture the connecting IP from Cloudflare for forwarding to Gravatar API
    const connectingIP = request.headers.get("CF-Connecting-IP");

    // Add connecting IP to env - safe due to per-client isolation
    const envWithIP = { ...env, CONNECTING_IP: connectingIP || undefined };

    if (pathname.startsWith("/sse")) {
      return GravatarMcpServer.serveSSE("/sse").fetch(request, envWithIP, ctx);
    }

    if (pathname.startsWith("/mcp")) {
      return GravatarMcpServer.serve("/mcp").fetch(request, envWithIP, ctx);
    }

    // Optional: Handle root path or other routes
    return new Response("Not Found", { status: 404 });
  },
};

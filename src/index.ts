import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getServerInfo } from "./config/server-config.js";

// Define the MCP agent with Gravatar tools
export class GravatarMcpServer extends McpAgent {
  server = new McpServer(getServerInfo());

  async init() {
    // Import utilities
    const { generateIdentifier } = await import("./common/utils.js");
    const { getProfile } = await import("./tools/profile-utils.js");
    const { getInferredInterests } = await import("./tools/experimental-utils.js");
    const { fetchAvatar, avatarParams } = await import("./tools/avatar-utils.js");

    // Register get_profile_by_email tool
    this.server.tool("get_profile_by_email", { email: z.string().email() }, async ({ email }) => {
      try {
        const identifier = await generateIdentifier(email);
        const profile = await getProfile(identifier);
        return {
          content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
          structuredContent: { profile },
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
    });

    // Register get_profile_by_id tool
    this.server.tool(
      "get_profile_by_id",
      { profileIdentifier: z.string().min(1) },
      async ({ profileIdentifier }) => {
        try {
          const profile = await getProfile(profileIdentifier);
          return {
            content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
            structuredContent: { profile },
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
    this.server.tool(
      "get_inferred_interests_by_email",
      { email: z.string().email() },
      async ({ email }) => {
        try {
          const identifier = await generateIdentifier(email);
          const interests = await getInferredInterests(identifier);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(interests, null, 2),
              },
            ],
            structuredContent: { interests },
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
    this.server.tool(
      "get_inferred_interests_by_id",
      { profileIdentifier: z.string().min(1) },
      async ({ profileIdentifier }) => {
        try {
          const interests = await getInferredInterests(profileIdentifier);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(interests, null, 2),
              },
            ],
            structuredContent: { interests },
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
    this.server.tool(
      "get_avatar_by_email",
      {
        email: z.string().email(),
        size: z.number().min(1).max(2048).optional(),
        defaultOption: z
          .enum(["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"])
          .optional(),
        forceDefault: z.boolean().optional(),
        rating: z.enum(["G", "PG", "R", "X", "g", "pg", "r", "x"]).optional(),
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
                data: avatarResult.buffer.toString("base64"),
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
    this.server.tool(
      "get_avatar_by_id",
      {
        avatarIdentifier: z.string().min(1),
        size: z.number().min(1).max(2048).optional(),
        defaultOption: z
          .enum(["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"])
          .optional(),
        forceDefault: z.boolean().optional(),
        rating: z.enum(["G", "PG", "R", "X", "g", "pg", "r", "x"]).optional(),
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
                data: avatarResult.buffer.toString("base64"),
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

export default GravatarMcpServer.mount("/mcp");

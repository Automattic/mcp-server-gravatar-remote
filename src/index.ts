import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getServerInfo } from "./config/server-config.js";
import { profileOutputSchema } from "./generated/schemas/profile-output-schema.js";
import { interestsOutputSchema } from "./generated/schemas/interests-output-schema.js";
import { profileInputSchema } from "./generated/schemas/profile-input-schema.js";
import { emailInputSchema } from "./generated/schemas/email-input-schema.js";

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
    this.server.registerTool(
      "get_profile_by_email",
      {
        title: "Get Gravatar Profile by Email",
        description:
          "Retrieve comprehensive Gravatar profile information using an email address. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Show me the Gravatar profile for john.doe@example.com' or 'Get profile info for user@company.com.'</examples>",
        inputSchema: emailInputSchema.shape,
        outputSchema: profileOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ email }) => {
        try {
          const identifier = await generateIdentifier(email);
          const profile = await getProfile(identifier);
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
        inputSchema: profileInputSchema.shape,
        outputSchema: profileOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ profileIdentifier }) => {
        try {
          const profile = await getProfile(profileIdentifier);
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
        inputSchema: emailInputSchema.shape,
        outputSchema: interestsOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: false,
        },
      },
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
            structuredContent: { inferredInterests: interests },
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
        inputSchema: profileInputSchema.shape,
        outputSchema: interestsOutputSchema.shape,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
          idempotentHint: false,
        },
      },
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
            structuredContent: { inferredInterests: interests },
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
          email: z.string().email(),
          size: z.number().min(1).max(2048).optional(),
          defaultOption: z
            .enum(["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"])
            .optional(),
          forceDefault: z.boolean().optional(),
          rating: z.enum(["G", "PG", "R", "X", "g", "pg", "r", "x"]).optional(),
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
    this.server.registerTool(
      "get_avatar_by_id",
      {
        title: "Get Avatar Image by ID",
        description:
          "Retrieve the avatar image for a Gravatar profile using an avatar identifier. More efficient when you already have the hashed identifier. <examples>'Get the avatar image for this Gravatar ID' or 'Show me a 150px avatar for user ID abc123...'</examples>",
        inputSchema: {
          avatarIdentifier: z.string().min(1),
          size: z.number().min(1).max(2048).optional(),
          defaultOption: z
            .enum(["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash", "blank"])
            .optional(),
          forceDefault: z.boolean().optional(),
          rating: z.enum(["G", "PG", "R", "X", "g", "pg", "r", "x"]).optional(),
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

export default GravatarMcpServer.mount("/sse");

import { z } from "zod";
import { fetchAvatar, avatarParams } from "./avatar-image-api.js";
import { generateIdentifier } from "../common/utils.js";
import type { GravatarMcpServer } from "../index.js";

export function registerAvatarImageTools(agent: GravatarMcpServer) {
  // Register get_avatar_by_email tool
  agent.server.registerTool(
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
              type: "image" as const,
              data: avatarResult.base64Data,
              mimeType: avatarResult.mimeType,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get avatar for email "${email}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register get_avatar_by_id tool
  agent.server.registerTool(
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
              type: "image" as const,
              data: avatarResult.base64Data,
              mimeType: avatarResult.mimeType,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get avatar for ID "${avatarIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

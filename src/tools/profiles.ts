import { getProfileById, createApiKeyOptions } from "./shared/api-client.js";
import { generateIdentifier } from "../common/utils.js";
import { emailInputShape, profileOutputShape, profileInputShape } from "./schemas.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerProfileTools(server: McpServer, apiKey?: string) {
  // Register get_profile_by_email tool
  server.registerTool(
    "get_profile_by_email",
    {
      title: "Get Gravatar Profile by Email",
      description:
        "Retrieve comprehensive Gravatar profile information using an email address. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Show me the Gravatar profile for john.doe@example.com' or 'Get profile info for user@company.com.'</examples>",
      inputSchema: emailInputShape,
      outputSchema: profileOutputShape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        idempotentHint: true,
      },
    },
    async ({ email }) => {
      try {
        const identifier = await generateIdentifier(email);
        const profile = await getProfileById(identifier, createApiKeyOptions(apiKey));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(profile, null, 2),
            },
          ],
          structuredContent: { ...profile },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get profile for email "${email}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register get_profile_by_id tool
  server.registerTool(
    "get_profile_by_id",
    {
      title: "Get Gravatar Profile by ID",
      description:
        "Retrieve comprehensive Gravatar profile information using a profile identifier. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Get the profile for Gravatar user with ID abc123...' or 'Show me the profile for username johndoe.'</examples>",
      inputSchema: profileInputShape,
      outputSchema: profileOutputShape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        idempotentHint: true,
      },
    },
    async ({ profileIdentifier }) => {
      try {
        const profile = await getProfileById(profileIdentifier, createApiKeyOptions(apiKey));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(profile, null, 2),
            },
          ],
          structuredContent: { ...profile },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get profile for ID "${profileIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

import { z } from "zod";
import {
  getProfileById,
  getProfile,
  updateProfile,
  createApiKeyOptions,
  createOAuthTokenOptions,
} from "./shared/api-client.js";
import { requireAuth } from "./shared/auth-utils.js";
import { generateIdentifier } from "../common/utils.js";
import {
  emailInputShape,
  profileOutputShape,
  profileInputShape,
  updateProfileInputShape,
} from "./schemas.js";
import type { GravatarMcpServer } from "../index.js";

export function registerProfileTools(agent: GravatarMcpServer, apiKey?: string) {
  // Register get_profile_by_email tool
  agent.server.registerTool(
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
  agent.server.registerTool(
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

  // Register get_my_profile tool (OAuth authenticated)
  agent.server.registerTool(
    "get_my_profile",
    {
      title: "Get My Gravatar Profile (OAuth)",
      description:
        "Retrieve the Gravatar profile for the authenticated user. <examples>'Get my Gravatar profile' or 'Show my profile information.'</examples>",
      inputSchema: z.object({}).shape,
      outputSchema: profileOutputShape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        idempotentHint: true,
      },
    },
    async () => {
      try {
        // Check if user is authenticated
        if (!agent.props || !agent.props.tokenSet || !agent.props.tokenSet.access_token) {
          throw new Error("OAuth authentication required. Please authenticate first.");
        }

        // Get the authenticated user's profile using their OAuth access token
        const profile = await getProfile(
          createOAuthTokenOptions(agent.props.tokenSet.access_token),
        );

        return {
          content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
          structuredContent: { ...profile },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get authenticated user profile: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register update_my_profile tool (OAuth)
  agent.server.registerTool(
    "update_my_profile",
    {
      title: "Update My Gravatar Profile (OAuth)",
      description:
        "Update the Gravatar profile for the authenticated user. Supports partial updates - only provided fields will be updated. To unset a field, set it to an empty string. <examples>'Update my display name to John Smith' or 'Set my job title to Software Engineer and location to San Francisco, CA'</examples>",
      inputSchema: updateProfileInputShape,
      outputSchema: profileOutputShape,
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        idempotentHint: false,
      },
    },
    async (updateData) => {
      try {
        const accessToken = requireAuth(agent.props);
        const updatedProfile = await updateProfile(updateData, createOAuthTokenOptions(accessToken));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(updatedProfile, null, 2),
            },
          ],
          structuredContent: { ...updatedProfile },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

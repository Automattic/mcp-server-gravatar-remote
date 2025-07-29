import { getProfileInferredInterestsById, createApiKeyOptions } from "./shared/api-client.js";
import { generateIdentifier } from "../common/utils.js";
import { emailInputShape, interestsOutputShape, profileInputShape } from "./schemas.js";
import type { GravatarMcpServer } from "../index.js";

export function registerExperimentalTools(agent: GravatarMcpServer, apiKey?: string) {
  // Register get_inferred_interests_by_email tool
  agent.server.registerTool(
    "get_inferred_interests_by_email",
    {
      title: "Get Inferred Interests by Email",
      description:
        "Retrieve AI-inferred interests for a Gravatar profile using an email address. Returns experimental machine learning-generated interest data based on public profile information. <hint>When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.</hint> <examples>'Get the inferred interests for user@example.com' or 'Show me inferred interests for john.doe@company.com.'</examples>",
      inputSchema: emailInputShape,
      outputSchema: interestsOutputShape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        idempotentHint: false,
      },
    },
    async ({ email }) => {
      try {
        const identifier = await generateIdentifier(email);
        const interests = await getProfileInferredInterestsById(
          identifier,
          createApiKeyOptions(apiKey),
        );
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
        return {
          content: [
            {
              type: "text",
              text: `Failed to get interests for email "${email}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register get_inferred_interests_by_id tool
  agent.server.registerTool(
    "get_inferred_interests_by_id",
    {
      title: "Get Inferred Interests by ID",
      description:
        "Retrieve AI-inferred interests for a Gravatar profile using a profile identifier. Returns experimental machine learning-generated interest data based on public profile information. <hint>When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.</hint> <examples>'Get the inferred interests for user ID abc123...' or 'Show me inferred interests for username johndoe.'</examples>",
      inputSchema: profileInputShape,
      outputSchema: interestsOutputShape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        idempotentHint: false,
      },
    },
    async ({ profileIdentifier }) => {
      try {
        const interests = await getProfileInferredInterestsById(
          profileIdentifier,
          createApiKeyOptions(apiKey),
        );
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
        return {
          content: [
            {
              type: "text",
              text: `Failed to get interests for ID "${profileIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Gravatar API Integration Guide Prompt
 *
 * Provides access to the comprehensive Gravatar API integration documentation
 * using Cloudflare Workers static assets for MCP prompt functionality.
 */

/**
 * Fetches the Gravatar API integration guide markdown content from static assets
 * @param assetsFetcher The ASSETS binding from Cloudflare Workers environment
 * @returns Promise<string> The markdown content of the integration guide
 */
export async function getGravatarIntegrationGuide(assetsFetcher: Fetcher): Promise<string> {
  try {
    const response = await assetsFetcher.fetch(
      // TODO: Replace this with a request from the live gravatar.com site
      new Request("https://assets/gravatar-api-integration-guide.md"),
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch integration guide: ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Gravatar integration guide: ${errorMessage}`);
  }
}

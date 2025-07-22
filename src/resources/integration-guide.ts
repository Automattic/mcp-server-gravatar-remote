/**
 * Gravatar API Integration Guide Prompt
 *
 * Provides access to the comprehensive Gravatar API integration documentation
 * using local file system for Node.js environment.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Reads the Gravatar API integration guide markdown content from local file
 * @returns Promise<string> The markdown content of the integration guide
 */
export async function getGravatarIntegrationGuide(): Promise<string> {
  try {
    const { readFile } = await import("node:fs/promises");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, "../../docs/gravatar-api-integration-guide.md");

    return await readFile(filePath, "utf-8");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Gravatar integration guide: ${errorMessage}`);
  }
}

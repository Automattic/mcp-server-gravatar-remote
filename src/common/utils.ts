/**
 * Shared utilities for Gravatar MCP server
 */

// Custom error types
export class EmptyStringError extends Error {
  constructor(message = "String parameter is empty") {
    super(message);
    this.name = "EmptyStringError";
  }
}

/**
 * Assert that a string is not empty
 * @param input - The string to check
 * @throws {EmptyStringError} If the string is empty or only whitespace
 */
export function assertNonEmpty(input: string): void {
  if (!input || input.trim().length === 0) {
    throw new EmptyStringError();
  }
}

/**
 * Normalize an email address for consistent processing
 * @param input - The email address to normalize
 * @returns The normalized email address (trimmed and lowercase)
 * @throws {EmptyStringError} If the input is empty
 */
export function normalize(input: string): string {
  assertNonEmpty(input);
  return String(input).trim().toLowerCase();
}

/**
 * Generate a SHA256 identifier from an email address
 * Uses Web Crypto API (Cloudflare Workers compatible)
 * @param input - The email address to hash
 * @returns Promise resolving to the SHA256 hash as a hex string
 * @throws {EmptyStringError} If the input is empty
 */
export async function generateIdentifier(input: string): Promise<string> {
  const normalizedInput = normalize(input);

  // Use Web Crypto API instead of Node.js crypto
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to hex string
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Map HTTP status codes to meaningful error messages
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param identifier - The identifier (email hash or ID) that was used
 * @returns Error message string
 */
export function mapHttpError(status: number, statusText: string, identifier: string): string {
  switch (status) {
    case 404:
      return `No profile found for identifier: ${identifier}`;
    case 400:
      return `Invalid identifier format: ${identifier}`;
    case 403:
      return "Profile is private or access denied";
    case 429:
      return "Rate limit exceeded. Please try again later";
    case 500:
      return "Gravatar service is temporarily unavailable";
    case 502:
    case 503:
    case 504:
      return "Gravatar service is experiencing issues. Please try again later";
    default:
      return `Gravatar API error (${status}): ${statusText}`;
  }
}

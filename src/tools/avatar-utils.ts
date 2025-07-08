/**
 * Shared utilities for avatar API calls
 * Uses direct HTTP calls to Gravatar avatar endpoints
 * Following STDIO implementation pattern
 */

import { config } from "../config/server-config.js";

export interface AvatarParams {
  avatarIdentifier: string;
  size?: number;
  defaultOption?: string;
  forceDefault?: boolean;
  rating?: string;
}

export interface AvatarResult {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Detect MIME type from HTTP response headers
 */
function detectMimeType(response: Response): string {
  const contentType = response.headers.get("content-type");

  // Validate it's an image MIME type
  if (contentType?.startsWith("image/")) {
    return contentType;
  }

  // Fallback to PNG for safety, since Gravatar defaults to returning PNG images
  return "image/png";
}

/**
 * Fetch avatar image by identifier
 * Following STDIO implementation pattern
 */
export async function fetchAvatar(params: AvatarParams): Promise<AvatarResult> {
  // Build avatar URL
  let url = `${config.avatarApiBase}/${params.avatarIdentifier}`;
  const queryParams = new URLSearchParams();

  if (params.size) {
    queryParams.append("s", params.size.toString());
  }

  if (params.defaultOption) {
    queryParams.append("d", params.defaultOption);
  }

  if (params.forceDefault) {
    queryParams.append("f", "y");
  }

  if (params.rating) {
    queryParams.append("r", params.rating);
  }

  // Add query string to URL if there are any parameters
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  // Fetch the image
  const response = await fetch(url, {
    headers: {
      "User-Agent": config.userAgent,
    },
    signal: AbortSignal.timeout(config.requestTimeout),
  });

  if (!response.ok) {
    // Provide specific error messages for common cases
    let message: string;
    switch (response.status) {
      case 404:
        message = `No avatar found for identifier: ${params.avatarIdentifier}.`;
        break;
      case 400:
        message = `Invalid avatar request parameters for identifier: ${params.avatarIdentifier}. Check the identifier format and parameters.`;
        break;
      case 403:
        message = `Avatar access denied for identifier: ${params.avatarIdentifier}`;
        break;
      case 429:
        message = "Rate limit exceeded. Please try again later.";
        break;
      default:
        message = `Failed to fetch avatar (${response.status}): ${response.statusText}`;
    }
    throw new Error(message);
  }

  // Detect MIME type from response headers
  const mimeType = detectMimeType(response);

  // Convert the response to a buffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    mimeType,
  };
}

/**
 * Create AvatarParams object from parameters
 * Only includes parameters that are explicitly provided
 * @param avatarIdentifier - The avatar identifier
 * @param size - Optional avatar size in pixels
 * @param defaultOption - Optional fallback image style
 * @param forceDefault - Optional flag to force default image
 * @param rating - Optional content rating filter
 * @returns AvatarParams object with only specified parameters
 */
export function avatarParams(
  avatarIdentifier: string,
  size?: number,
  defaultOption?: string,
  forceDefault?: boolean,
  rating?: string,
): AvatarParams {
  return {
    avatarIdentifier,
    ...(size !== undefined && { size }),
    ...(defaultOption !== undefined && { defaultOption }),
    ...(forceDefault !== undefined && { forceDefault }),
    ...(rating !== undefined && { rating }),
  };
}

/**
 * Validate avatar identifier format
 * @param identifier - The identifier to validate
 * @returns True if the identifier appears valid
 */
export function isValidAvatarIdentifier(identifier: string): boolean {
  // Avatar identifiers can be:
  // - 64-character hex strings (email hashes)
  // - Shorter alphanumeric strings (avatar IDs)
  return /^[a-f0-9]{64}$|^[a-zA-Z0-9]+$/i.test(identifier);
}

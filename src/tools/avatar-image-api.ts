/**
 * Shared utilities for avatar API calls
 * Uses direct HTTP calls to Gravatar avatar endpoints
 */

import { config, generateUserAgent } from "../config/server-config.js";

// Import shared image utilities
import { arrayBufferToBase64, detectMimeType } from "../common/image-utils.js";

export interface AvatarParams {
  avatarIdentifier: string;
  size?: number;
  defaultOption?: string;
  forceDefault?: boolean;
  rating?: string;
}

export interface AvatarResult {
  base64Data: string;
  mimeType: string;
}

/**
 * Fetch avatar image by identifier
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
      "User-Agent": generateUserAgent(),
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

  // Convert the response to base64
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);

  return {
    base64Data,
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

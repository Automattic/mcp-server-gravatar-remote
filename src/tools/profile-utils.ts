/**
 * Shared utilities for profile-related API calls
 * Uses the Kubb-generated functional API client
 */

import { getProfileById } from "../generated/clients/index.js";
import { getRequestConfig } from "../config/server-config.js";
import { mapHttpError } from "../common/utils.js";

/**
 * Get profile by identifier with error handling
 * @param identifier - The profile identifier (email hash or profile ID)
 * @param apiKey - Optional API key for authenticated requests
 * @returns Profile data or throws error with meaningful message
 */
export async function getProfile(identifier: string, apiKey?: string) {
  try {
    const response = await getProfileById(identifier, getRequestConfig(apiKey));
    return response;
  } catch (error: any) {
    // Handle HTTP errors with meaningful messages
    if (error.response) {
      const { status, statusText } = error.response;
      throw new Error(mapHttpError(status, statusText, identifier));
    }

    // Handle network or other errors
    throw new Error(`Network error while fetching profile: ${error.message}`);
  }
}

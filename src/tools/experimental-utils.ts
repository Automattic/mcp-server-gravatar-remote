/**
 * Shared utilities for experimental/interests API calls
 * Uses the generated Gravatar API client
 */

import { getProfileInferredInterestsById } from "../generated/clients/index.js";
import { getRequestConfig } from "../config/server-config.js";
import { mapHttpError } from "../common/utils.js";

/**
 * Get inferred interests by identifier with error handling
 * @param identifier - The profile identifier (email hash or profile ID)
 * @param apiKey - Optional API key for authenticated requests
 * @returns Interests data or throws error with meaningful message
 */
export async function getInferredInterests(identifier: string, apiKey?: string) {
  try {
    const response = await getProfileInferredInterestsById(identifier, getRequestConfig(apiKey));
    return response;
  } catch (error: any) {
    // Handle HTTP errors with meaningful messages
    if (error.response) {
      const { status, statusText } = error.response;
      throw new Error(mapHttpError(status, statusText, identifier));
    }

    // Handle network or other errors
    throw new Error(`Network error while fetching interests: ${error.message}`);
  }
}

/**
 * Shared utilities for experimental/interests API calls
 * Uses the generated Gravatar API client
 */

import { ExperimentalApi, Configuration } from "../generated/gravatar-api/index.js";
import { getApiHeaders } from "../config/server-config.js";
import { mapHttpError } from "../common/utils.js";

/**
 * Create a configured ExperimentalApi instance
 * @returns Configured ExperimentalApi instance
 */
export function createExperimentalApi(): ExperimentalApi {
  const configuration = new Configuration({
    fetchApi: fetch,
    headers: getApiHeaders(),
  });

  return new ExperimentalApi(configuration);
}

/**
 * Get inferred interests by identifier with error handling
 * @param identifier - The profile identifier (email hash or profile ID)
 * @returns Interests data or throws error with meaningful message
 */
export async function getInferredInterests(identifier: string) {
  const api = createExperimentalApi();

  try {
    const response = await api.getProfileInferredInterestsById({
      profileIdentifier: identifier,
    });
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

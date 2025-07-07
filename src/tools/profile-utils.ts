/**
 * Shared utilities for profile-related API calls
 * Uses the generated Gravatar API client
 */

import { ProfilesApi, Configuration } from '../generated/gravatar-api/index.js';
import { getApiHeaders } from '../config/server-config.js';
import { mapHttpError } from '../common/utils.js';

/**
 * Create a configured ProfilesApi instance
 * @returns Configured ProfilesApi instance
 */
export function createProfilesApi(): ProfilesApi {
  const configuration = new Configuration({
    fetchApi: fetch,
    headers: getApiHeaders(),
  });
  
  return new ProfilesApi(configuration);
}

/**
 * Get profile by identifier with error handling
 * @param identifier - The profile identifier (email hash or profile ID)
 * @returns Profile data or throws error with meaningful message
 */
export async function getProfile(identifier: string) {
  const api = createProfilesApi();
  
  try {
    const response = await api.getProfileById({ profileIdentifier: identifier });
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

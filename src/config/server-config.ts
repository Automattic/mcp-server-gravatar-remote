/**
 * Centralized configuration for Gravatar MCP server
 * Adapted for Cloudflare Workers environment
 */

import { getEnv, type Env } from "../common/env.js";
import { VERSION } from "../common/version.js";

const env = getEnv<Env>();

/**
 * Server configuration object
 * Handles environment variables and API endpoints
 */
export const config = {
  // Gravatar API endpoints
  avatarApiBase: "https://gravatar.com/avatar",
  restApiBase: "https://api.gravatar.com/v3",

  // User agent for API requests
  userAgent: `${env.MCP_SERVER_NAME}/${VERSION}`,

  // Request timeout (in milliseconds)
  requestTimeout: 30000,
};

/**
 * Get server information for MCP server initialization
 */
export function getServerInfo() {
  return {
    name: `${env.MCP_SERVER_NAME}`,
    version: VERSION,
  };
}

/**
 * Get API headers for Gravatar REST API requests
 * @param apiKey - Optional API key for authenticated requests
 * @returns Headers object for fetch requests
 */
export function getApiHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": config.userAgent,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (apiKey && apiKey.trim() !== "") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

/**
 * Get request configuration for Kubb client functions
 * @param apiKey - Optional API key for authenticated requests
 * @returns RequestConfig object for Kubb API calls
 */
export function getRequestConfig(apiKey?: string) {
  return {
    baseURL: config.restApiBase,
    headers: getApiHeaders(apiKey),
    timeout: config.requestTimeout,
  };
}

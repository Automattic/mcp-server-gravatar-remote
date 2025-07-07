/**
 * Centralized configuration for Gravatar MCP server
 * Adapted for Cloudflare Workers environment
 */

import { VERSION } from '../common/version.js';

/**
 * Server configuration object
 * Handles environment variables and API endpoints
 */
export const config = {
  // Gravatar API endpoint
  avatarApiBase: 'https://gravatar.com/avatar',
  
  // User agent for API requests
  userAgent: `Remote-Gravatar-MCP-Server/${VERSION}`,
  
  // Request timeout (in milliseconds)
  requestTimeout: 30000,
};

/**
 * Get server information for MCP server initialization
 */
export function getServerInfo() {
  return {
    name: 'Gravatar MCP Server',
    version: VERSION,
  };
}

/**
 * Get API headers for Gravatar REST API requests
 * @returns Headers object for fetch requests
 */
export function getApiHeaders(): Record<string, string> {
  return {
    'User-Agent': config.userAgent,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * Centralized configuration for Gravatar MCP server
 * Adapted for Cloudflare Workers environment
 */

import { getEnv, type Env } from "../common/env.js";
import { VERSION } from "../common/version.js";
import type { Implementation, ClientCapabilities } from "@modelcontextprotocol/sdk/types.js";

const env = getEnv<Env>();

// Store client information for client-aware User-Agent generation
let _clientInfo: Implementation | undefined;
let _clientCapabilities: ClientCapabilities | undefined;

// Store connecting IP for API request forwarding
let _connectingIP: string | undefined;

/**
 * Server configuration object
 * Handles environment variables and API endpoints
 */
export const config = {
  // Gravatar API endpoints
  avatarApiBase: "https://gravatar.com/avatar",
  restApiBase: "https://api.gravatar.com/v3",

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
 * Set the client information for client-aware User-Agent generation
 * Should be called after client initialization
 */
export function setClientInfo(
  clientInfo: Implementation | undefined,
  clientCapabilities: ClientCapabilities | undefined,
) {
  _clientInfo = clientInfo;
  _clientCapabilities = clientCapabilities;
}

/**
 * Set the connecting IP for API requests
 * Should be called during McpAgent initialization
 */
export function setConnectingIP(ip: string | null) {
  _connectingIP = ip || undefined;
}

/**
 * Get the stored connecting IP
 */
export function getConnectingIP(): string | undefined {
  return _connectingIP;
}

/**
 * Generate a User-Agent header that encodes MCP client information
 * Format: Server-name/version MCP-client-name/version (capability_1; capability_2)
 */
export function generateUserAgent(): string {
  const serverInfo = getServerInfo();

  // Server portion - make RFC-compliant by replacing spaces with hyphens
  const serverName = serverInfo.name.replace(/\s+/g, "-");
  let userAgent = `${serverName}/${serverInfo.version}`;

  // Client portion - use stored client info
  if (_clientInfo) {
    const clientName = (_clientInfo.name || "unknown").replace(/\s+/g, "-");
    const clientVer = _clientInfo.version || "unknown";
    userAgent += ` ${clientName}/${clientVer}`;
  } else {
    userAgent += " unknown/unknown";
  }

  // Capabilities portion
  const capabilities = [];
  if (_clientCapabilities) {
    if (_clientCapabilities.sampling) capabilities.push("sampling");
    if (_clientCapabilities.elicitation) capabilities.push("elicitation");
    if (_clientCapabilities.roots) capabilities.push("roots");
    if (_clientCapabilities.experimental) capabilities.push("experimental");
  }

  const capabilitiesString = capabilities.length > 0 ? capabilities.join("; ") : "none";
  userAgent += ` (${capabilitiesString})`;

  return userAgent;
}

/**
 * Get API headers for Gravatar REST API requests
 * @param apiKey - Optional API key for authenticated requests
 * @returns Headers object for fetch requests
 */
export function getApiHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": generateUserAgent(),
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (apiKey && apiKey.trim() !== "") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  // Forward the connecting IP as GR-Connecting-IP for Gravatar API
  if (_connectingIP) {
    headers["GR-Connecting-IP"] = _connectingIP;
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

/**
 * Version information for Gravatar MCP server
 */

import packageJson from "../../package.json" with { type: "json" };

export const VERSION = packageJson.version;

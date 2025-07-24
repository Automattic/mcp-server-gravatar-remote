// Helper to get environment variables for Node.js
export function getEnv<T>(): T {
  return process.env as T;
}

export interface Env {
  NODE_ENV?: "development" | "staging" | "production";
  MCP_SERVER_NAME?: string;
  GRAVATAR_API_KEY?: string;
  PORT?: string;
  HOST?: string;
  DEBUG?: string;
  // Security configuration
  ENABLE_DNS_REBINDING_PROTECTION?: string;
  ALLOWED_HOSTS?: string;
  ALLOWED_ORIGINS?: string;
}

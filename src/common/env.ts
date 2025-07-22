// Helper to get environment variables for Node.js
export function getEnv<T>(): T {
  return process.env as T;
}

export interface Env {
  ENVIRONMENT?: "development" | "staging" | "production";
  MCP_SERVER_NAME?: string;
  GRAVATAR_API_KEY?: string;
  PORT?: string;
}

import { env } from "cloudflare:workers";

// Helper to cast env as any generic Env type
export function getEnv<Env>() {
  return env as Env;
}

export interface Env {
  ENVIRONMENT: "development" | "staging" | "production";
  MCP_SERVER_NAME: string;
}

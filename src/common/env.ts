import { env } from "cloudflare:workers";

// Helper to cast env as any generic Env type
export function getEnv<Env>() {
  return env as Env;
}

export interface Env {
  ENVIRONMENT: "development" | "staging" | "production";
  MCP_SERVER_NAME: string;
  GRAVATAR_API_KEY?: string;
  ASSETS: Fetcher;
  NODE_ENV: string;
  // OAuth2 configuration
  OAUTH_PROVIDER: string;
  OAUTH_DOMAIN: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OAUTH_REDIRECT_URI?: string;
  OAUTH_AUTHORIZATION_ENDPOINT?: string;
  OAUTH_TOKEN_ENDPOINT?: string;
  OAUTH_USERINFO_ENDPOINT?: string;
  OAUTH_SCOPES?: string;
  OAUTH_AUDIENCE?: string;
  // OAuth provider configuration
  OAUTH_SIGNING_SECRET?: string;
  OAUTH_COOKIE_SECRET?: string;
}

import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import type { Env } from "../common/env.js";

export function createOAuthProvider(env: Env): OAuthProvider | null {
  // Check if all required OAuth environment variables are present
  if (
    !env.OAUTH_CLIENT_ID ||
    !env.OAUTH_CLIENT_SECRET ||
    !env.OAUTH_REDIRECT_URI ||
    !env.OAUTH_SIGNING_SECRET ||
    !env.OAUTH_COOKIE_SECRET ||
    !env.OAUTH_AUTHORIZATION_ENDPOINT ||
    !env.OAUTH_TOKEN_ENDPOINT ||
    !env.OAUTH_USERINFO_ENDPOINT
  ) {
    return null; // OAuth not configured
  }

  // Parse scopes (comma-separated string to array)
  const scopes = env.OAUTH_SCOPES ? env.OAUTH_SCOPES.split(",").map((s) => s.trim()) : ["auth"];

  return new OAuthProvider({
    // OAuth provider configuration from environment
    signingSecret: env.OAUTH_SIGNING_SECRET,
    cookieSecret: env.OAUTH_COOKIE_SECRET,

    // OAuth2 endpoints from environment
    authorizationEndpoint: env.OAUTH_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: env.OAUTH_TOKEN_ENDPOINT,
    userinfoEndpoint: env.OAUTH_USERINFO_ENDPOINT,

    // Client configuration from environment
    clientId: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
    redirectUri: env.OAUTH_REDIRECT_URI,

    // Scopes from environment
    scopes: scopes,

    // PKCE configuration (recommended for security)
    pkce: true,
  });
}

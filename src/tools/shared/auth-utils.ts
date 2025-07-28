import type { UserProps } from "../../auth/types.js";

export function requireAuth(props?: UserProps): string {
  if (!props?.tokenSet?.access_token) {
    throw new Error("OAuth authentication required. Please authenticate first.");
  }
  return props.tokenSet.access_token;
}

export function hasAuth(props?: UserProps): boolean {
  return !!props?.tokenSet?.access_token;
}

export function getTokenExpirationInfo(props?: UserProps): {
  hasExpiration: boolean;
  expiresInSeconds?: number;
  expiresInMinutes?: number;
} {
  if (!props?.tokenSet?.expires_in) {
    return { hasExpiration: false };
  }

  return {
    hasExpiration: true,
    expiresInSeconds: props.tokenSet.expires_in,
    expiresInMinutes: Math.round(props.tokenSet.expires_in / 60),
  };
}

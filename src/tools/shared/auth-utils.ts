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

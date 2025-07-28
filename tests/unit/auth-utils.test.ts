import { describe, it, expect } from "vitest";
import { requireAuth, hasAuth } from "../../src/tools/shared/auth-utils.js";
import type { UserProps } from "../../src/auth/types.js";

describe("Auth Utilities", () => {
  describe("requireAuth", () => {
    it("should return access token when valid props provided", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: "valid-access-token",
          refresh_token: "refresh-token",
          expires_at: Date.now() + 3600000,
          token_type: "Bearer",
        },
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      const result = requireAuth(props);
      expect(result).toBe("valid-access-token");
    });

    it("should throw error when props is undefined", () => {
      expect(() => requireAuth(undefined)).toThrow(
        "OAuth authentication required. Please authenticate first.",
      );
    });

    it("should throw error when props is null", () => {
      expect(() => requireAuth(null as any)).toThrow(
        "OAuth authentication required. Please authenticate first.",
      );
    });

    it("should throw error when tokenSet is undefined", () => {
      const props: UserProps = {
        tokenSet: undefined as any,
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(() => requireAuth(props)).toThrow(
        "OAuth authentication required. Please authenticate first.",
      );
    });

    it("should throw error when access_token is undefined", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: undefined as any,
          refresh_token: "refresh-token",
          expires_at: Date.now() + 3600000,
          token_type: "Bearer",
        },
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(() => requireAuth(props)).toThrow(
        "OAuth authentication required. Please authenticate first.",
      );
    });

    it("should throw error when access_token is empty string", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: "",
          refresh_token: "refresh-token",
          expires_at: Date.now() + 3600000,
          token_type: "Bearer",
        },
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(() => requireAuth(props)).toThrow(
        "OAuth authentication required. Please authenticate first.",
      );
    });
  });

  describe("hasAuth", () => {
    it("should return true when valid props with access token provided", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: "valid-access-token",
          refresh_token: "refresh-token",
          expires_at: Date.now() + 3600000,
          token_type: "Bearer",
        },
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(hasAuth(props)).toBe(true);
    });

    it("should return false when props is undefined", () => {
      expect(hasAuth(undefined)).toBe(false);
    });

    it("should return false when props is null", () => {
      expect(hasAuth(null as any)).toBe(false);
    });

    it("should return false when tokenSet is undefined", () => {
      const props: UserProps = {
        tokenSet: undefined as any,
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(hasAuth(props)).toBe(false);
    });

    it("should return false when access_token is undefined", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: undefined as any,
          refresh_token: "refresh-token",
          expires_at: Date.now() + 3600000,
          token_type: "Bearer",
        },
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(hasAuth(props)).toBe(false);
    });

    it("should return false when access_token is empty string", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: "",
          refresh_token: "refresh-token",
          expires_at: Date.now() + 3600000,
          token_type: "Bearer",
        },
        userInfo: {
          sub: "user123",
          name: "Test User",
          email: "test@example.com",
        },
      };

      expect(hasAuth(props)).toBe(false);
    });

    it("should return true for minimal valid props", () => {
      const props: UserProps = {
        tokenSet: {
          access_token: "token",
          refresh_token: "",
          expires_at: 0,
          token_type: "",
        },
        userInfo: {
          sub: "",
          name: "",
          email: "",
        },
      };

      expect(hasAuth(props)).toBe(true);
    });
  });
});

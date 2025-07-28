import { describe, it, expect } from "vitest";
import { createApiKeyOptions, createOAuthTokenOptions } from "../../src/tools/shared/api-client.js";

describe("API Client Utilities", () => {
  describe("createApiKeyOptions", () => {
    it("should create basic options without API key", () => {
      const result = createApiKeyOptions();

      expect(result).toEqual({
        headers: {},
        baseURL: "https://api.gravatar.com/v3",
      });
    });

    it("should create basic options with undefined API key", () => {
      const result = createApiKeyOptions(undefined);

      expect(result).toEqual({
        headers: {},
        baseURL: "https://api.gravatar.com/v3",
      });
    });

    it("should add Authorization header when API key is provided", () => {
      const apiKey = "test-api-key-123";
      const result = createApiKeyOptions(apiKey);

      expect(result).toEqual({
        headers: {
          Authorization: "Bearer test-api-key-123",
        },
        baseURL: "https://api.gravatar.com/v3",
      });
    });

    it("should not add Authorization header for empty string API key", () => {
      const result = createApiKeyOptions("");

      expect(result).toEqual({
        headers: {},
        baseURL: "https://api.gravatar.com/v3",
      });
    });

    it("should return correct baseURL", () => {
      const result = createApiKeyOptions("test-key");

      expect(result.baseURL).toBe("https://api.gravatar.com/v3");
    });
  });

  describe("createOAuthTokenOptions", () => {
    it("should create OAuth options with access token", () => {
      const accessToken = "oauth-token-xyz";
      const result = createOAuthTokenOptions(accessToken);

      expect(result).toEqual({
        headers: {
          Authorization: "Bearer oauth-token-xyz",
        },
        baseURL: "https://api.gravatar.com/v3",
      });
    });

    it("should work with different token formats", () => {
      const tokens = [
        "simple-token",
        "token.with.dots",
        "token-with-dashes",
        "token_with_underscores",
        "UPPERCASE_TOKEN",
      ];

      tokens.forEach((token) => {
        const result = createOAuthTokenOptions(token);
        expect(result.headers.Authorization).toBe(`Bearer ${token}`);
        expect(result.baseURL).toBe("https://api.gravatar.com/v3");
      });
    });

    it("should handle empty token", () => {
      const result = createOAuthTokenOptions("");

      expect(result).toEqual({
        headers: {
          Authorization: "Bearer ",
        },
        baseURL: "https://api.gravatar.com/v3",
      });
    });
  });
});

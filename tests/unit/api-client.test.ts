import { describe, it, expect } from "vitest";
import { createApiKeyOptions } from "../../src/tools/shared/api-client.js";

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
});

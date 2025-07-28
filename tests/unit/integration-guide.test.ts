import { describe, it, expect, vi } from "vitest";
import { getGravatarIntegrationGuide } from "../../src/resources/integration-guide.js";

describe("Integration Guide", () => {
  describe("getGravatarIntegrationGuide", () => {
    it("should return guide content when fetch succeeds", async () => {
      const mockContent = "# Gravatar API Integration Guide\n\nThis is the guide content.";
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(mockContent),
      };

      const mockFetcher = {
        fetch: vi.fn().mockResolvedValue(mockResponse),
      };

      const result = await getGravatarIntegrationGuide(mockFetcher as any);

      expect(result).toBe(mockContent);
      expect(mockFetcher.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://assets/gravatar-api-integration-guide.md",
        }),
      );
      expect(mockResponse.text).toHaveBeenCalledOnce();
    });

    it("should throw error when fetch response is not ok", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: vi.fn(),
      };

      const mockFetcher = {
        fetch: vi.fn().mockResolvedValue(mockResponse),
      };

      await expect(getGravatarIntegrationGuide(mockFetcher as any)).rejects.toThrow(
        "Failed to load Gravatar integration guide: Failed to fetch integration guide: 404 Not Found",
      );

      expect(mockFetcher.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://assets/gravatar-api-integration-guide.md",
        }),
      );
      expect(mockResponse.text).not.toHaveBeenCalled();
    });

    it("should handle different HTTP error statuses", async () => {
      const testCases = [
        { status: 403, statusText: "Forbidden" },
        { status: 500, statusText: "Internal Server Error" },
        { status: 503, statusText: "Service Unavailable" },
      ];

      for (const { status, statusText } of testCases) {
        const mockResponse = {
          ok: false,
          status,
          statusText,
          text: vi.fn(),
        };

        const mockFetcher = {
          fetch: vi.fn().mockResolvedValue(mockResponse),
        };

        await expect(getGravatarIntegrationGuide(mockFetcher as any)).rejects.toThrow(
          `Failed to load Gravatar integration guide: Failed to fetch integration guide: ${status} ${statusText}`,
        );
      }
    });

    it("should throw error when fetch throws", async () => {
      const fetchError = new Error("Network connection failed");
      const mockFetcher = {
        fetch: vi.fn().mockRejectedValue(fetchError),
      };

      await expect(getGravatarIntegrationGuide(mockFetcher as any)).rejects.toThrow(
        "Failed to load Gravatar integration guide: Network connection failed",
      );

      expect(mockFetcher.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://assets/gravatar-api-integration-guide.md",
        }),
      );
    });

    it("should handle non-Error exceptions from fetch", async () => {
      const mockFetcher = {
        fetch: vi.fn().mockRejectedValue("String error"),
      };

      await expect(getGravatarIntegrationGuide(mockFetcher as any)).rejects.toThrow(
        "Failed to load Gravatar integration guide: String error",
      );
    });

    it("should throw error when response.text() throws", async () => {
      const textError = new Error("Failed to read response body");
      const mockResponse = {
        ok: true,
        text: vi.fn().mockRejectedValue(textError),
      };

      const mockFetcher = {
        fetch: vi.fn().mockResolvedValue(mockResponse),
      };

      await expect(getGravatarIntegrationGuide(mockFetcher as any)).rejects.toThrow(
        "Failed to load Gravatar integration guide: Failed to read response body",
      );

      expect(mockResponse.text).toHaveBeenCalledOnce();
    });

    it("should return empty string content", async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue(""),
      };

      const mockFetcher = {
        fetch: vi.fn().mockResolvedValue(mockResponse),
      };

      const result = await getGravatarIntegrationGuide(mockFetcher as any);

      expect(result).toBe("");
    });
  });
});

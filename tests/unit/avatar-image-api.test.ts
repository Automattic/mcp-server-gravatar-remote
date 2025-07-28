import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAvatar, avatarParams, type AvatarParams } from "../../src/tools/avatar-image-api.js";
import { arrayBufferToBase64 } from "../../src/common/image-utils.js";

// Mock the config module
vi.mock("../../src/config/server-config.js", () => ({
  config: {
    avatarApiBase: "https://gravatar.com/avatar",
    requestTimeout: 5000,
  },
  generateUserAgent: vi.fn().mockReturnValue("test-user-agent/1.0"),
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock AbortSignal.timeout
const mockAbortSignal = { signal: "mock-abort-signal" };
vi.stubGlobal("AbortSignal", {
  timeout: vi.fn().mockReturnValue(mockAbortSignal),
});

describe("Avatar Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAvatar", () => {
    const mockIdentifier = "abc123def456";
    const mockImageBuffer = new ArrayBuffer(8);
    const mockUint8Array = new Uint8Array(mockImageBuffer);
    mockUint8Array.set([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header

    it("should fetch avatar successfully with minimal parameters", async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/png"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const params: AvatarParams = { avatarIdentifier: mockIdentifier };
      const result = await fetchAvatar(params);

      expect(mockFetch).toHaveBeenCalledWith("https://gravatar.com/avatar/abc123def456", {
        headers: {
          "User-Agent": "test-user-agent/1.0",
        },
        signal: mockAbortSignal,
      });

      expect(result).toEqual({
        base64Data: "iVBORw0KGgo=",
        mimeType: "image/png",
      });
    });

    it("should build URL with all query parameters", async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/jpeg"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const params: AvatarParams = {
        avatarIdentifier: mockIdentifier,
        size: 200,
        defaultOption: "identicon",
        forceDefault: true,
        rating: "PG",
      };

      await fetchAvatar(params);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://gravatar.com/avatar/abc123def456?s=200&d=identicon&f=y&r=PG",
        expect.any(Object),
      );
    });

    it("should build URL with partial parameters", async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/png"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const params: AvatarParams = {
        avatarIdentifier: mockIdentifier,
        size: 150,
        rating: "G",
      };

      await fetchAvatar(params);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://gravatar.com/avatar/abc123def456?s=150&r=G",
        expect.any(Object),
      );
    });

    it("should detect MIME type from content-type header", async () => {
      const testCases = [
        { contentType: "image/jpeg", expected: "image/jpeg" },
        { contentType: "image/png", expected: "image/png" },
        { contentType: "image/gif", expected: "image/gif" },
        { contentType: "image/webp", expected: "image/webp" },
      ];

      for (const { contentType, expected } of testCases) {
        const mockResponse = {
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue(contentType),
          },
          arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const result = await fetchAvatar({ avatarIdentifier: mockIdentifier });
        expect(result.mimeType).toBe(expected);
      }
    });

    it("should fallback to image/png for invalid content-type", async () => {
      const testCases = [null, undefined, "text/html", "application/json", "invalid/type"];

      for (const contentType of testCases) {
        const mockResponse = {
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue(contentType),
          },
          arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const result = await fetchAvatar({ avatarIdentifier: mockIdentifier });
        expect(result.mimeType).toBe("image/png");
      }
    });

    it("should handle 404 error with specific message", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchAvatar({ avatarIdentifier: mockIdentifier })).rejects.toThrow(
        `No avatar found for identifier: ${mockIdentifier}.`,
      );
    });

    it("should handle 400 error with specific message", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchAvatar({ avatarIdentifier: mockIdentifier })).rejects.toThrow(
        `Invalid avatar request parameters for identifier: ${mockIdentifier}. Check the identifier format and parameters.`,
      );
    });

    it("should handle 403 error with specific message", async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchAvatar({ avatarIdentifier: mockIdentifier })).rejects.toThrow(
        `Avatar access denied for identifier: ${mockIdentifier}`,
      );
    });

    it("should handle 429 rate limit error", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(fetchAvatar({ avatarIdentifier: mockIdentifier })).rejects.toThrow(
        "Rate limit exceeded. Please try again later.",
      );
    });

    it("should handle generic HTTP errors", async () => {
      const testCases = [
        { status: 500, statusText: "Internal Server Error" },
        { status: 502, statusText: "Bad Gateway" },
        { status: 503, statusText: "Service Unavailable" },
        { status: 418, statusText: "I'm a teapot" },
      ];

      for (const { status, statusText } of testCases) {
        const mockResponse = {
          ok: false,
          status,
          statusText,
        };
        mockFetch.mockResolvedValue(mockResponse);

        await expect(fetchAvatar({ avatarIdentifier: mockIdentifier })).rejects.toThrow(
          `Failed to fetch avatar (${status}): ${statusText}`,
        );
      }
    });
  });

  describe("avatarParams", () => {
    const testIdentifier = "test123";

    it("should create params with only identifier", () => {
      const result = avatarParams(testIdentifier);
      expect(result).toEqual({
        avatarIdentifier: testIdentifier,
      });
    });

    it("should include all defined parameters", () => {
      const result = avatarParams(testIdentifier, 200, "identicon", true, "PG");
      expect(result).toEqual({
        avatarIdentifier: testIdentifier,
        size: 200,
        defaultOption: "identicon",
        forceDefault: true,
        rating: "PG",
      });
    });

    it("should exclude undefined parameters", () => {
      const result = avatarParams(testIdentifier, 150, undefined, false, undefined);
      expect(result).toEqual({
        avatarIdentifier: testIdentifier,
        size: 150,
        forceDefault: false,
      });
    });

    it("should handle size parameter only", () => {
      const result = avatarParams(testIdentifier, 100);
      expect(result).toEqual({
        avatarIdentifier: testIdentifier,
        size: 100,
      });
    });

    it("should handle boolean parameters correctly", () => {
      const resultTrue = avatarParams(testIdentifier, undefined, undefined, true);
      expect(resultTrue).toEqual({
        avatarIdentifier: testIdentifier,
        forceDefault: true,
      });

      const resultFalse = avatarParams(testIdentifier, undefined, undefined, false);
      expect(resultFalse).toEqual({
        avatarIdentifier: testIdentifier,
        forceDefault: false,
      });
    });
  });

  describe("arrayBufferToBase64", () => {
    it("should convert small ArrayBuffer to base64", () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 1;
      view[1] = 2;
      view[2] = 3;
      view[3] = 4;

      const result = arrayBufferToBase64(buffer);

      expect(result).toBe("AQIDBA==");
    });

    it("should handle large ArrayBuffer without stack overflow", () => {
      // Create a large buffer that would cause stack overflow with the old approach
      const largeBuffer = new ArrayBuffer(100000);
      const view = new Uint8Array(largeBuffer);

      // Fill with some pattern
      for (let i = 0; i < largeBuffer.byteLength; i++) {
        view[i] = i % 256;
      }

      const result = arrayBufferToBase64(largeBuffer);

      // Should not throw and should return a valid base64 string
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Base64 should be roughly 4/3 the size of the original
      expect(result.length).toBeGreaterThan(((100000 * 4) / 3) * 0.9);
    });

    it("should handle empty ArrayBuffer", () => {
      const emptyBuffer = new ArrayBuffer(0);
      const result = arrayBufferToBase64(emptyBuffer);

      expect(result).toBe("");
    });
  });
});

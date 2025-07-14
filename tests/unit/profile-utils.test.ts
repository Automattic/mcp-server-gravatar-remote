import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfile } from "../../src/tools/profile-utils.js";

// Mock the generated API module
vi.mock("../../src/generated/clients/index.js", () => {
  const mockGetProfileById = vi.fn();

  return {
    getProfileById: mockGetProfileById,
  };
});

// Mock the config module
vi.mock("../../src/config/server-config.js", () => ({
  getApiHeaders: vi.fn().mockReturnValue({
    "User-Agent": "test-user-agent/1.0",
    Accept: "application/json",
  }),
  getRequestConfig: vi.fn().mockReturnValue({
    headers: {
      "User-Agent": "test-user-agent/1.0",
      Accept: "application/json",
    },
  }),
}));

// Mock the utils module
vi.mock("../../src/common/utils.js", () => ({
  mapHttpError: vi.fn(),
}));

describe("Profile Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    const testIdentifier = "test-profile-id";
    const mockProfileData = {
      id: "12345",
      hash: "abc123",
      displayName: "Test User",
      profileUrl: "https://gravatar.com/test-user",
      avatarUrl: "https://gravatar.com/avatar/abc123",
    };

    it("should return profile data on successful API call", async () => {
      const { getProfileById } = await import("../../src/generated/clients/index.js");

      (getProfileById as any).mockResolvedValue(mockProfileData);

      const result = await getProfile(testIdentifier);

      expect(getProfileById).toHaveBeenCalledWith(testIdentifier, expect.any(Object));
      expect(result).toEqual(mockProfileData);
    });

    it("should call getRequestConfig with API key when provided", async () => {
      const { getProfileById } = await import("../../src/generated/clients/index.js");
      const { getRequestConfig } = await import("../../src/config/server-config.js");

      (getProfileById as any).mockResolvedValue(mockProfileData);

      const apiKey = "test-api-key-123";
      const result = await getProfile(testIdentifier, apiKey);

      expect(getRequestConfig).toHaveBeenCalledWith(apiKey);
      expect(getProfileById).toHaveBeenCalledWith(testIdentifier, expect.any(Object));
      expect(result).toEqual(mockProfileData);
    });

    it("should call getRequestConfig without API key when not provided", async () => {
      const { getProfileById } = await import("../../src/generated/clients/index.js");
      const { getRequestConfig } = await import("../../src/config/server-config.js");

      (getProfileById as any).mockResolvedValue(mockProfileData);

      const result = await getProfile(testIdentifier);

      expect(getRequestConfig).toHaveBeenCalledWith(undefined);
      expect(getProfileById).toHaveBeenCalledWith(testIdentifier, expect.any(Object));
      expect(result).toEqual(mockProfileData);
    });

    it("should call getRequestConfig with undefined when API key is undefined", async () => {
      const { getProfileById } = await import("../../src/generated/clients/index.js");
      const { getRequestConfig } = await import("../../src/config/server-config.js");

      (getProfileById as any).mockResolvedValue(mockProfileData);

      const result = await getProfile(testIdentifier, undefined);

      expect(getRequestConfig).toHaveBeenCalledWith(undefined);
      expect(getProfileById).toHaveBeenCalledWith(testIdentifier, expect.any(Object));
      expect(result).toEqual(mockProfileData);
    });

    it("should handle HTTP errors", async () => {
      const { getProfileById } = await import("../../src/generated/clients/index.js");
      const { mapHttpError } = await import("../../src/common/utils.js");

      const mockError = {
        response: {
          status: 404,
          statusText: "Not Found",
        },
      };
      const mappedErrorMessage = "No profile found for identifier: test-profile-id";

      (getProfileById as any).mockRejectedValue(mockError);
      (mapHttpError as any).mockReturnValue(mappedErrorMessage);

      await expect(getProfile(testIdentifier)).rejects.toThrow(mappedErrorMessage);

      expect(mapHttpError).toHaveBeenCalledWith(404, "Not Found", testIdentifier);
    });

    it("should handle network errors", async () => {
      const { getProfileById } = await import("../../src/generated/clients/index.js");

      const networkError = new Error("Network connection failed");
      (getProfileById as any).mockRejectedValue(networkError);

      await expect(getProfile(testIdentifier)).rejects.toThrow(
        "Network error while fetching profile: Network connection failed",
      );
    });
  });
});

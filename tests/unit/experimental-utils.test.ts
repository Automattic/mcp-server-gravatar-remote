import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInferredInterests } from "../../src/tools/experimental-utils.js";

// Mock the generated API module
vi.mock("../../src/generated/clients/index.js", () => {
  const mockGetProfileInferredInterestsById = vi.fn();

  return {
    getProfileInferredInterestsById: mockGetProfileInferredInterestsById,
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

describe("Experimental Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInferredInterests", () => {
    const testIdentifier = "test-profile-id";
    const mockInterestsData = [
      {
        id: 1,
        name: "Programming",
      },
      {
        id: 2,
        name: "Web Development",
      },
    ];

    it("should return interests data on successful API call", async () => {
      const { getProfileInferredInterestsById } = await import(
        "../../src/generated/clients/index.js"
      );

      (getProfileInferredInterestsById as any).mockResolvedValue(mockInterestsData);

      const result = await getInferredInterests(testIdentifier);

      expect(getProfileInferredInterestsById).toHaveBeenCalledWith(
        testIdentifier,
        expect.any(Object),
      );
      expect(result).toEqual(mockInterestsData);
    });

    it("should call getRequestConfig with API key when provided", async () => {
      const { getProfileInferredInterestsById } = await import(
        "../../src/generated/clients/index.js"
      );
      const { getRequestConfig } = await import("../../src/config/server-config.js");

      (getProfileInferredInterestsById as any).mockResolvedValue(mockInterestsData);

      const apiKey = "test-api-key-123";
      const result = await getInferredInterests(testIdentifier, apiKey);

      expect(getRequestConfig).toHaveBeenCalledWith(apiKey);
      expect(getProfileInferredInterestsById).toHaveBeenCalledWith(
        testIdentifier,
        expect.any(Object),
      );
      expect(result).toEqual(mockInterestsData);
    });

    it("should call getRequestConfig without API key when not provided", async () => {
      const { getProfileInferredInterestsById } = await import(
        "../../src/generated/clients/index.js"
      );
      const { getRequestConfig } = await import("../../src/config/server-config.js");

      (getProfileInferredInterestsById as any).mockResolvedValue(mockInterestsData);

      const result = await getInferredInterests(testIdentifier);

      expect(getRequestConfig).toHaveBeenCalledWith(undefined);
      expect(getProfileInferredInterestsById).toHaveBeenCalledWith(
        testIdentifier,
        expect.any(Object),
      );
      expect(result).toEqual(mockInterestsData);
    });

    it("should call getRequestConfig with undefined when API key is undefined", async () => {
      const { getProfileInferredInterestsById } = await import(
        "../../src/generated/clients/index.js"
      );
      const { getRequestConfig } = await import("../../src/config/server-config.js");

      (getProfileInferredInterestsById as any).mockResolvedValue(mockInterestsData);

      const result = await getInferredInterests(testIdentifier, undefined);

      expect(getRequestConfig).toHaveBeenCalledWith(undefined);
      expect(getProfileInferredInterestsById).toHaveBeenCalledWith(
        testIdentifier,
        expect.any(Object),
      );
      expect(result).toEqual(mockInterestsData);
    });

    it("should handle HTTP errors", async () => {
      const { getProfileInferredInterestsById } = await import(
        "../../src/generated/clients/index.js"
      );
      const { mapHttpError } = await import("../../src/common/utils.js");

      const mockError = {
        response: {
          status: 404,
          statusText: "Not Found",
        },
      };
      const mappedErrorMessage = "No profile found for identifier: test-profile-id";

      (getProfileInferredInterestsById as any).mockRejectedValue(mockError);
      (mapHttpError as any).mockReturnValue(mappedErrorMessage);

      await expect(getInferredInterests(testIdentifier)).rejects.toThrow(mappedErrorMessage);

      expect(mapHttpError).toHaveBeenCalledWith(404, "Not Found", testIdentifier);
    });

    it("should handle network errors", async () => {
      const { getProfileInferredInterestsById } = await import(
        "../../src/generated/clients/index.js"
      );

      const networkError = new Error("Network connection failed");
      (getProfileInferredInterestsById as any).mockRejectedValue(networkError);

      await expect(getInferredInterests(testIdentifier)).rejects.toThrow(
        "Network error while fetching interests: Network connection failed",
      );
    });
  });
});

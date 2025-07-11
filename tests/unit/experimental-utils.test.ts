import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInferredInterests } from "../../src/tools/experimental-utils.js";

// Mock the generated API module
vi.mock("../../src/generated/gravatar-api/index.js", () => {
  const mockGetProfileInferredInterestsById = vi.fn();
  const mockConfiguration = vi.fn();

  return {
    ExperimentalApi: vi.fn(() => ({
      getProfileInferredInterestsById: mockGetProfileInferredInterestsById,
    })),
    Configuration: mockConfiguration,
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
      const { ExperimentalApi } = await import("../../src/generated/gravatar-api/index.js");

      const mockInstance = new (ExperimentalApi as any)();
      const mockGetProfileInferredInterestsById = mockInstance.getProfileInferredInterestsById;

      mockGetProfileInferredInterestsById.mockResolvedValue(mockInterestsData);

      const result = await getInferredInterests(testIdentifier);

      expect(mockGetProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: testIdentifier,
      });
      expect(result).toEqual(mockInterestsData);
    });

    it("should handle HTTP errors", async () => {
      const { ExperimentalApi } = await import("../../src/generated/gravatar-api/index.js");
      const { mapHttpError } = await import("../../src/common/utils.js");

      const mockInstance = new (ExperimentalApi as any)();
      const mockGetProfileInferredInterestsById = mockInstance.getProfileInferredInterestsById;

      const mockError = {
        response: {
          status: 404,
          statusText: "Not Found",
        },
      };
      const mappedErrorMessage = "No profile found for identifier: test-profile-id";

      mockGetProfileInferredInterestsById.mockRejectedValue(mockError);
      (mapHttpError as any).mockReturnValue(mappedErrorMessage);

      await expect(getInferredInterests(testIdentifier)).rejects.toThrow(mappedErrorMessage);

      expect(mapHttpError).toHaveBeenCalledWith(404, "Not Found", testIdentifier);
    });

    it("should handle network errors", async () => {
      const { ExperimentalApi } = await import("../../src/generated/gravatar-api/index.js");

      const mockInstance = new (ExperimentalApi as any)();
      const mockGetProfileInferredInterestsById = mockInstance.getProfileInferredInterestsById;

      const networkError = new Error("Network connection failed");
      mockGetProfileInferredInterestsById.mockRejectedValue(networkError);

      await expect(getInferredInterests(testIdentifier)).rejects.toThrow(
        "Network error while fetching interests: Network connection failed",
      );
    });
  });
});

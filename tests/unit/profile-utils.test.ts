import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfile } from "../../src/tools/profile-utils.js";

// Mock the generated API module
vi.mock("../../src/generated/gravatar-api/index.js", () => {
  const mockGetProfileById = vi.fn();
  const mockConfiguration = vi.fn();

  return {
    ProfilesApi: vi.fn(() => ({
      getProfileById: mockGetProfileById,
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
      const { ProfilesApi } = await import("../../src/generated/gravatar-api/index.js");

      const mockInstance = new (ProfilesApi as any)();
      const mockGetProfileById = mockInstance.getProfileById;

      mockGetProfileById.mockResolvedValue(mockProfileData);

      const result = await getProfile(testIdentifier);

      expect(mockGetProfileById).toHaveBeenCalledWith({
        profileIdentifier: testIdentifier,
      });
      expect(result).toEqual(mockProfileData);
    });

    it("should handle HTTP errors", async () => {
      const { ProfilesApi } = await import("../../src/generated/gravatar-api/index.js");
      const { mapHttpError } = await import("../../src/common/utils.js");

      const mockInstance = new (ProfilesApi as any)();
      const mockGetProfileById = mockInstance.getProfileById;

      const mockError = {
        response: {
          status: 404,
          statusText: "Not Found",
        },
      };
      const mappedErrorMessage = "No profile found for identifier: test-profile-id";

      mockGetProfileById.mockRejectedValue(mockError);
      (mapHttpError as any).mockReturnValue(mappedErrorMessage);

      await expect(getProfile(testIdentifier)).rejects.toThrow(mappedErrorMessage);

      expect(mapHttpError).toHaveBeenCalledWith(404, "Not Found", testIdentifier);
    });

    it("should handle network errors", async () => {
      const { ProfilesApi } = await import("../../src/generated/gravatar-api/index.js");

      const mockInstance = new (ProfilesApi as any)();
      const mockGetProfileById = mockInstance.getProfileById;

      const networkError = new Error("Network connection failed");
      mockGetProfileById.mockRejectedValue(networkError);

      await expect(getProfile(testIdentifier)).rejects.toThrow(
        "Network error while fetching profile: Network connection failed",
      );
    });
  });
});

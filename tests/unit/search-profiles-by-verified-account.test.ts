import { describe, it, expect, vi } from "vitest";
import {
  searchProfilesByVerifiedAccount,
  createApiKeyOptions,
} from "../../src/tools/shared/api-client.js";
import type { SearchProfilesByVerifiedAccountInput } from "../../src/tools/schemas.js";

// Mock the API client functions
vi.mock("../../src/tools/shared/api-client.js", async () => {
  const actual = await vi.importActual("../../src/tools/shared/api-client.js");
  return {
    ...actual,
    searchProfilesByVerifiedAccount: vi.fn(),
  };
});

describe("Search Profiles by Verified Account Tool", () => {
  const mockSearchResults = {
    profiles: [
      {
        id: "profile1",
        hash: "abc123",
        display_name: "John Doe",
        username: "johndoe",
        verified_accounts: [
          {
            service_type: "github",
            service_label: "GitHub",
            service_icon: "https://gravatar.com/icons/github.png",
            username: "johndoe",
            url: "https://github.com/johndoe",
          },
        ],
      },
      {
        id: "profile2",
        hash: "def456",
        display_name: "Jane Smith",
        username: "janesmith",
        verified_accounts: [
          {
            service_type: "github",
            service_label: "GitHub",
            service_icon: "https://gravatar.com/icons/github.png",
            username: "janesmith",
            url: "https://github.com/janesmith",
          },
        ],
      },
    ],
    total_pages: 1,
  };

  it("should search profiles by username only", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "johndoe",
    };

    (searchProfilesByVerifiedAccount as any).mockResolvedValue(mockSearchResults);

    const result = await searchProfilesByVerifiedAccount(
      searchParams,
      createApiKeyOptions("test-api-key"),
    );

    expect(searchProfilesByVerifiedAccount).toHaveBeenCalledWith(searchParams, {
      headers: { Authorization: "Bearer test-api-key" },
      baseURL: "https://api.gravatar.com/v3",
    });
    expect(result).toEqual(mockSearchResults);
  });

  it("should search profiles by username and service", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "johndoe",
      service: "github",
    };

    const filteredResults = {
      profiles: [mockSearchResults.profiles[0]],
      total_pages: 1,
    };

    (searchProfilesByVerifiedAccount as any).mockResolvedValue(filteredResults);

    const result = await searchProfilesByVerifiedAccount(
      searchParams,
      createApiKeyOptions("test-api-key"),
    );

    expect(searchProfilesByVerifiedAccount).toHaveBeenCalledWith(
      searchParams,
      expect.objectContaining({
        headers: { Authorization: "Bearer test-api-key" },
        baseURL: "https://api.gravatar.com/v3",
      }),
    );
    expect(result).toEqual(filteredResults);
  });

  it("should handle pagination parameters", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "testuser",
      page: 2,
      per_page: 10,
    };

    const paginatedResults = {
      profiles: [],
      total_pages: 5,
    };

    (searchProfilesByVerifiedAccount as any).mockResolvedValue(paginatedResults);

    const result = await searchProfilesByVerifiedAccount(
      searchParams,
      createApiKeyOptions("test-api-key"),
    );

    expect(searchProfilesByVerifiedAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "testuser",
        page: 2,
        per_page: 10,
      }),
      expect.any(Object),
    );
    expect(result).toEqual(paginatedResults);
  });

  it("should handle API errors", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "nonexistent",
    };

    (searchProfilesByVerifiedAccount as any).mockRejectedValue(
      new Error("API Error: No profiles found"),
    );

    await expect(
      searchProfilesByVerifiedAccount(searchParams, createApiKeyOptions("test-api-key")),
    ).rejects.toThrow("API Error: No profiles found");
  });

  it("should work without optional parameters", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "simple-test",
    };

    const simpleResults = {
      profiles: [mockSearchResults.profiles[0]],
      total_pages: 1,
    };

    (searchProfilesByVerifiedAccount as any).mockResolvedValue(simpleResults);

    const result = await searchProfilesByVerifiedAccount(
      searchParams,
      createApiKeyOptions("test-api-key"),
    );

    expect(searchProfilesByVerifiedAccount).toHaveBeenCalledWith(
      { username: "simple-test" },
      expect.any(Object),
    );
    expect(result).toEqual(simpleResults);
  });

  it("should handle empty results", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "nobody",
      service: "nonexistent",
    };

    const emptyResults = {
      profiles: [],
      total_pages: 0,
    };

    (searchProfilesByVerifiedAccount as any).mockResolvedValue(emptyResults);

    const result = await searchProfilesByVerifiedAccount(
      searchParams,
      createApiKeyOptions("test-api-key"),
    );

    expect(result).toEqual(emptyResults);
    expect(result.profiles).toHaveLength(0);
    expect(result.total_pages).toBe(0);
  });

  it("should handle maximum pagination limits", async () => {
    const searchParams: SearchProfilesByVerifiedAccountInput = {
      username: "popular-user",
      page: 1,
      per_page: 50, // Maximum allowed
    };

    const maxResults = {
      profiles: new Array(50).fill(null).map((_, i) => ({
        id: `profile${i}`,
        hash: `hash${i}`,
        display_name: `User ${i}`,
        username: `user${i}`,
        verified_accounts: [],
      })),
      total_pages: 10,
    };

    (searchProfilesByVerifiedAccount as any).mockResolvedValue(maxResults);

    const result = await searchProfilesByVerifiedAccount(
      searchParams,
      createApiKeyOptions("test-api-key"),
    );

    expect(result.profiles).toHaveLength(50);
    expect(result.total_pages).toBe(10);
  });
});

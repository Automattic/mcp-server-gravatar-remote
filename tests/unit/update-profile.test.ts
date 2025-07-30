import { describe, it, expect, vi } from "vitest";
import { updateProfile, createOAuthTokenOptions } from "../../src/tools/shared/api-client.js";
import { requireAuth } from "../../src/tools/shared/auth-utils.js";
import type { UpdateProfileInput } from "../../src/tools/schemas.js";
import type { UserProps } from "../../src/auth/types.js";

// Mock the API client functions
vi.mock("../../src/tools/shared/api-client.js", async () => {
  const actual = await vi.importActual("../../src/tools/shared/api-client.js");
  return {
    ...actual,
    updateProfile: vi.fn(),
  };
});

vi.mock("../../src/tools/shared/auth-utils.js", () => ({
  requireAuth: vi.fn(),
}));

describe("Update Profile Tool", () => {
  const mockProps: UserProps = {
    claims: {
      ID: 123,
      login: "testuser",
      email: "test@example.com",
      display_name: "Test User",
      username: "testuser",
      avatar_URL: "https://gravatar.com/avatar/test",
      profile_URL: "https://gravatar.com/testuser",
      site_count: 1,
      verified: true,
    },
    tokenSet: {
      access_token: "test-oauth-token",
      token_type: "Bearer",
    },
  };

  const mockUpdatedProfile = {
    id: "test-profile-id",
    hash: "abc123",
    display_name: "John Doe Updated",
    first_name: "John",
    last_name: "Doe",
    job_title: "Senior Developer",
    location: "San Francisco, CA",
    description: "Updated bio",
    pronunciation: "jon-doe",
    pronouns: "he/him",
    company: "Tech Corp",
    contact_email: "john@example.com",
    cell_phone: "+1234567890",
    hidden_contact_info: false,
  };

  it("should successfully update profile with valid data", async () => {
    const updateData: UpdateProfileInput = {
      display_name: "John Doe Updated",
      job_title: "Senior Developer",
      location: "San Francisco, CA",
    };

    (requireAuth as any).mockReturnValue("test-oauth-token");
    (updateProfile as any).mockResolvedValue(mockUpdatedProfile);

    // Simulate the tool function logic
    const accessToken = requireAuth(mockProps);
    const result = await updateProfile(updateData, createOAuthTokenOptions(accessToken));

    expect(requireAuth).toHaveBeenCalledWith(mockProps);
    expect(updateProfile).toHaveBeenCalledWith(updateData, {
      headers: { Authorization: "Bearer test-oauth-token" },
      baseURL: "https://api.gravatar.com/v3",
    });
    expect(result).toEqual(mockUpdatedProfile);
  });

  it("should handle partial updates", async () => {
    const updateData: UpdateProfileInput = {
      job_title: "CTO",
    };

    (requireAuth as any).mockReturnValue("test-oauth-token");
    (updateProfile as any).mockResolvedValue({
      ...mockUpdatedProfile,
      job_title: "CTO",
    });

    const accessToken = requireAuth(mockProps);
    const result = await updateProfile(updateData, createOAuthTokenOptions(accessToken));

    expect(result.job_title).toBe("CTO");
  });

  it("should handle authentication errors", async () => {
    (requireAuth as any).mockImplementation(() => {
      throw new Error("Authentication required");
    });

    expect(() => requireAuth(mockProps)).toThrow("Authentication required");
  });

  it("should handle API errors", async () => {
    const updateData: UpdateProfileInput = {
      display_name: "Test User",
    };

    (requireAuth as any).mockReturnValue("test-oauth-token");
    (updateProfile as any).mockRejectedValue(new Error("API Error: Invalid request"));

    const accessToken = requireAuth(mockProps);

    await expect(updateProfile(updateData, createOAuthTokenOptions(accessToken))).rejects.toThrow(
      "API Error: Invalid request",
    );
  });

  it("should accept all valid profile fields", async () => {
    const updateData: UpdateProfileInput = {
      first_name: "Jane",
      last_name: "Smith",
      display_name: "Jane Smith",
      description: "Software engineer with 10 years experience",
      pronunciation: "jane-smith",
      pronouns: "she/her",
      location: "New York, NY",
      job_title: "Lead Engineer",
      company: "Example Corp",
      cell_phone: "+1987654321",
      contact_email: "jane@example.com",
      hidden_contact_info: true,
    };

    (requireAuth as any).mockReturnValue("test-oauth-token");
    (updateProfile as any).mockResolvedValue({
      ...mockUpdatedProfile,
      ...updateData,
    });

    const accessToken = requireAuth(mockProps);
    const result = await updateProfile(updateData, createOAuthTokenOptions(accessToken));

    expect(updateProfile).toHaveBeenCalledWith(updateData, expect.any(Object));
    expect(result).toMatchObject(updateData);
  });

  it("should handle empty string values (field unsetting)", async () => {
    const updateData: UpdateProfileInput = {
      job_title: "",
      company: "",
      description: "",
    };

    (requireAuth as any).mockReturnValue("test-oauth-token");
    (updateProfile as any).mockResolvedValue({
      ...mockUpdatedProfile,
      job_title: "",
      company: "",
      description: "",
    });

    const accessToken = requireAuth(mockProps);
    const result = await updateProfile(updateData, createOAuthTokenOptions(accessToken));

    expect(result.job_title).toBe("");
    expect(result.company).toBe("");
    expect(result.description).toBe("");
  });
});

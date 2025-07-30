import { describe, it, expect } from "vitest";

describe("Schema Passthrough Behavior", () => {
  it("should handle API evolution gracefully by accepting extra fields", async () => {
    const { profileOutputSchema, interestsOutputSchema } = await import(
      "../../src/tools/schemas.js"
    );

    // Test profile schema resilience to future API changes
    const profileWithNewFields = {
      hash: "abc123",
      display_name: "Test User",
      profile_url: "https://gravatar.com/test",
      avatar_url: "https://gravatar.com/avatar/abc123",
      avatar_alt_text: "Test avatar",
      location: "Test City",
      description: "Test description",
      job_title: "Test Job",
      company: "Test Company",
      verified_accounts: [],
      pronunciation: "Test",
      pronouns: "they/them",
      // Simulated future API fields that should not break validation
      new_social_platform: "threads",
      ai_generated_bio: true,
      premium_features: { verified: true, priority_support: false },
    };

    const profileResult = profileOutputSchema.safeParse(profileWithNewFields);
    expect(profileResult.success).toBe(true);

    if (profileResult.success) {
      // Core fields should remain accessible
      expect(profileResult.data.hash).toBe("abc123");
      expect(profileResult.data.display_name).toBe("Test User");
      // New fields should be preserved
      expect(profileResult.data.new_social_platform).toBe("threads");
      expect(profileResult.data.premium_features).toEqual({
        verified: true,
        priority_support: false,
      });
    }

    // Test interests schema resilience
    const interestsWithNewFields = {
      interests: [
        {
          id: 7,
          name: "adventure travel",
          // Simulated future fields
          slug: "adventure-travel",
          popularity_score: 85,
          trending: true,
          metadata: { source: "ai-inference", confidence: 0.92 },
        },
      ],
    };

    const interestsResult = interestsOutputSchema.safeParse(interestsWithNewFields);
    expect(interestsResult.success).toBe(true);

    if (interestsResult.success) {
      expect(interestsResult.data.interests[0].name).toBe("adventure travel");
      expect(interestsResult.data.interests[0].slug).toBe("adventure-travel");
      expect(interestsResult.data.interests[0].metadata).toEqual({
        source: "ai-inference",
        confidence: 0.92,
      });
    }
  });

  it("should still enforce required fields despite passthrough", async () => {
    const { profileOutputSchema, interestsOutputSchema } = await import(
      "../../src/tools/schemas.js"
    );

    // Profile missing required fields should fail
    const incompleteProfile = {
      hash: "abc123",
      display_name: "Test User",
      // Missing profile_url, avatar_url, etc.
      future_field: "this won't help",
    };

    const profileResult = profileOutputSchema.safeParse(incompleteProfile);
    expect(profileResult.success).toBe(false);

    // Interests with invalid structure should fail
    const invalidInterests = {
      interests: [
        {
          id: 7,
          // Missing required 'name' field
          future_field: "this won't help either",
        },
      ],
    };

    const interestsResult = interestsOutputSchema.safeParse(invalidInterests);
    expect(interestsResult.success).toBe(false);
  });
});
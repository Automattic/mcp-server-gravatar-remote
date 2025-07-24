import { describe, it, expect } from "vitest";

describe("MCP Schema Integration Tests", () => {
  describe("Schema Integration", () => {
    it("should import and use generated schemas", async () => {
      const { profileOutputSchema, interestsOutputSchema, profileInputShape, emailInputShape } =
        await import("../../src/schemas.js");

      // Test that schemas are properly structured for MCP tool registration
      expect(profileOutputSchema.shape).toBeDefined();
      expect(interestsOutputSchema.shape).toBeDefined();
      expect(profileInputShape).toBeDefined();
      expect(emailInputShape).toBeDefined();

      // Shapes contain the individual field validators
      expect(emailInputShape.email).toBeDefined();
      expect(profileInputShape.profileIdentifier).toBeDefined();

      // Test that the field validators work
      expect(emailInputShape.email.safeParse("test@example.com").success).toBe(true);
      expect(profileInputShape.profileIdentifier.safeParse("test-id").success).toBe(true);
    });

    it("should handle schema validation in tool context", async () => {
      const { emailInputShape } = await import("../../src/schemas.js");

      // Test email validation that would be used by MCP tools
      const validEmail = "test@example.com";
      const invalidEmail = "not-an-email";

      const validResult = emailInputShape.email.safeParse(validEmail);
      const invalidResult = emailInputShape.email.safeParse(invalidEmail);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);

      if (validResult.success) {
        expect(validResult.data).toBe(validEmail);
      }

      if (!invalidResult.success) {
        expect(invalidResult.error).toBeDefined();
      }
    });
  });

  describe("Schema Passthrough Behavior", () => {
    it("should allow extra properties in profile output schema", async () => {
      const { profileOutputSchema } = await import("../../src/schemas.js");

      // Mock profile data with required fields
      const baseProfile = {
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
      };

      // Test with extra fields that might come from API updates
      const profileWithExtraFields = {
        ...baseProfile,
        new_field: "new_value", // This would break without passthrough
        experimental_feature: { nested: "data" },
      };

      const result = profileOutputSchema.safeParse(profileWithExtraFields);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify known fields are preserved
        expect(result.data.hash).toBe("abc123");
        expect(result.data.display_name).toBe("Test User");
        // Verify extra fields are preserved
        expect(result.data.new_field).toBe("new_value");
        expect(result.data.experimental_feature).toEqual({ nested: "data" });
      }
    });

    it("should allow extra properties in interests output schema", async () => {
      const { interestsOutputSchema } = await import("../../src/schemas.js");

      // Mock interests data with extra fields (like the real 'slug' field)
      const interestsWithExtraFields = {
        interests: [
          {
            id: 7,
            name: "adventure travel",
            slug: "7-adventure-travel", // This would break without passthrough
            category: "travel", // Another hypothetical future field
            popularity: 85,
          },
          {
            id: 88,
            name: "comedy movies",
            slug: "88-comedy-movies",
            category: "entertainment",
            popularity: 92,
          },
        ],
      };

      const result = interestsOutputSchema.safeParse(interestsWithExtraFields);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify known fields are preserved
        expect(result.data.interests[0].id).toBe(7);
        expect(result.data.interests[0].name).toBe("adventure travel");
        // Verify extra fields are preserved
        expect(result.data.interests[0].slug).toBe("7-adventure-travel");
        expect(result.data.interests[0].category).toBe("travel");
        expect(result.data.interests[0].popularity).toBe(85);
      }
    });

    it("should still validate required fields in profile schema", async () => {
      const { profileOutputSchema } = await import("../../src/schemas.js");

      // Test that required fields are still enforced
      const incompleteProfile = {
        hash: "abc123",
        display_name: "Test User",
        // Missing required fields
        extra_field: "should_be_ignored",
      };

      const result = profileOutputSchema.safeParse(incompleteProfile);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("should still validate required fields in interests schema", async () => {
      const { interestsOutputSchema } = await import("../../src/schemas.js");

      // Test that required fields are still enforced
      const incompleteInterests = {
        interests: [
          {
            id: 7,
            // Missing required 'name' field
            slug: "7-adventure-travel",
            extra_field: "should_be_ignored",
          },
        ],
      };

      const result = interestsOutputSchema.safeParse(incompleteInterests);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});

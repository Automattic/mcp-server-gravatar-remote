import { describe, it, expect } from "vitest";

describe("MCP Schema Integration Tests", () => {
  describe("Schema Integration", () => {
    it("should import and use generated schemas", async () => {
      const { profileOutputSchema } = await import(
        "../../src/generated/schemas/profile-output-schema.js"
      );
      const { interestsOutputSchema } = await import(
        "../../src/generated/schemas/interests-output-schema.js"
      );
      const { profileInputSchema } = await import(
        "../../src/generated/schemas/profile-input-schema.js"
      );
      const { emailInputSchema } = await import(
        "../../src/generated/schemas/email-input-schema.js"
      );

      // Test that schemas are properly structured for MCP tool registration
      expect(profileOutputSchema.shape).toBeDefined();
      expect(interestsOutputSchema.shape).toBeDefined();
      expect(profileInputSchema.shape).toBeDefined();
      expect(emailInputSchema.shape).toBeDefined();

      // Test that schemas can validate data
      const validEmail = { email: "test@example.com" };
      const validProfile = { profileIdentifier: "test-id" };

      expect(emailInputSchema.safeParse(validEmail).success).toBe(true);
      expect(profileInputSchema.safeParse(validProfile).success).toBe(true);
    });

    it("should handle schema validation in tool context", async () => {
      const { emailInputSchema } = await import(
        "../../src/generated/schemas/email-input-schema.js"
      );

      // Test email validation that would be used by MCP tools
      const validEmail = "test@example.com";
      const invalidEmail = "not-an-email";

      const validResult = emailInputSchema.safeParse({ email: validEmail });
      const invalidResult = emailInputSchema.safeParse({ email: invalidEmail });

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);

      if (validResult.success) {
        expect(validResult.data.email).toBe(validEmail);
      }

      if (!invalidResult.success) {
        expect(invalidResult.error).toBeDefined();
      }
    });
  });
});

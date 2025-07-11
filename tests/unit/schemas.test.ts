import { describe, it, expect } from "vitest";

describe("MCP Schema Integration Tests", () => {
  describe("Schema Integration", () => {
    it("should import and use generated schemas", async () => {
      const {
        mcpProfileOutputSchema,
        mcpInterestsOutputSchema,
        mcpProfileInputSchema,
        mcpEmailInputSchema,
      } = await import("../../src/schemas/mcp-schemas.js");

      // Test that schemas are properly structured for MCP tool registration
      expect(mcpProfileOutputSchema.shape).toBeDefined();
      expect(mcpInterestsOutputSchema.shape).toBeDefined();
      expect(mcpProfileInputSchema.shape).toBeDefined();
      expect(mcpEmailInputSchema.shape).toBeDefined();

      // Test that schemas can validate data
      const validEmail = { email: "test@example.com" };
      const validProfile = { profileIdentifier: "test-id" };

      expect(mcpEmailInputSchema.safeParse(validEmail).success).toBe(true);
      expect(mcpProfileInputSchema.safeParse(validProfile).success).toBe(true);
    });

    it("should handle schema validation in tool context", async () => {
      const { mcpEmailInputSchema } = await import("../../src/schemas/mcp-schemas.js");

      // Test email validation that would be used by MCP tools
      const validEmail = "test@example.com";
      const invalidEmail = "not-an-email";

      const validResult = mcpEmailInputSchema.safeParse({ email: validEmail });
      const invalidResult = mcpEmailInputSchema.safeParse({ email: invalidEmail });

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

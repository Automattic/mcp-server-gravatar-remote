import { z } from "zod";

/**
 * Zod schema for Input schema for email-based lookups
 * Generated from OpenAPI specification
 */
export const emailInputSchema = z.object({
  email: z.string().email().describe("The email address to look up")
});

export type EmailInputSchemaType = z.infer<typeof emailInputSchema>;

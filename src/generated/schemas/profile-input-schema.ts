import { z } from "zod";

/**
 * Zod schema for Input schema for profile lookup by identifier
 * Generated from OpenAPI specification
 */
export const profileInputSchema = z.object({
  profileIdentifier: z.string().describe("This can either be an SHA256 hash of an email address or profile URL slug.")
});

export type ProfileInputSchemaType = z.infer<typeof profileInputSchema>;

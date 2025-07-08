import { z } from "zod";

/**
 * Zod schema for Input schema for interests lookup by identifier
 * Generated from OpenAPI specification
 */
export const interestsInputSchema = z.object({
  profileIdentifier: z.string().describe("This can either be an SHA256 hash of an email address or profile URL slug.")
});

export type InterestsInputSchemaType = z.infer<typeof interestsInputSchema>;

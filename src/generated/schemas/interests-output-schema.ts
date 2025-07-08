import { z } from "zod";

/**
 * Zod schema for Interest output
 * Generated from OpenAPI specification
 */
export const interestsOutputSchema = z.object({
  inferredInterests: z.array(z.object({
  id: z.number().describe("The unique identifier for the interest."),
  name: z.string().describe("The name of the interest as originally defined (most often in English).")
})).describe("A list of AI-inferred interests")
});

export type InterestsOutputSchemaType = z.infer<typeof interestsOutputSchema>;

import { z } from "zod";

/**
 * Zod schema for Interest output
 * Generated from OpenAPI specification
 */
export const interestsOutputSchema = z.object({
  inferredInterests: z.array(z.object({
  id: z.number(),
  name: z.string()
}))
});

export type InterestsOutputSchemaType = z.infer<typeof interestsOutputSchema>;

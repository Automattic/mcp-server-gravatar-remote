/**
 * Tool schemas for MCP tool registration
 *
 * Maps Kubb-generated schemas to MCP requirements.
 * Uses consistent naming with .shape access for both input and output schemas.
 */

import { profileSchema } from "../generated/schemas/profileSchema.js";
import { interestSchema } from "../generated/schemas/interestSchema.js";
import {
  getProfileByIdPathParamsSchema,
  getProfileInferredInterestsByIdPathParamsSchema,
} from "../generated/schemas/index.js";
import { updateProfileMutationRequestSchema } from "../generated/schemas/profilesSchemas/updateProfileSchema.js";
import { z } from "zod";

// Output schemas for tools
// NOTE: .passthrough() allows extra properties when the API evolves ahead of the OpenAPI spec
// Without this, new API fields cause validation errors until the spec is updated
// Trade-off: less strict validation but more resilient to API changes
export const profileOutputSchema = (profileSchema as z.ZodObject<any>).passthrough();
export const profileOutputShape = profileOutputSchema.shape;

export const interestsOutputSchema = z.object({
  interests: z.array(
    // NOTE: .passthrough() allows extra properties when the API evolves ahead of the OpenAPI spec
    // Without this, new API fields cause validation errors until the spec is updated
    // Trade-off: less strict validation but more resilient to API changes
    (interestSchema as z.ZodObject<any>).passthrough(),
  ),
});
export const interestsOutputShape = interestsOutputSchema.shape;

// Input shapes for tools (ZodRawShape format)
// Now that typed: false is set, we can directly access .shape without casting
export const profileInputShape = getProfileByIdPathParamsSchema.shape;
export const interestsInputShape = getProfileInferredInterestsByIdPathParamsSchema.shape;

// Email input schema (for email-based tools)
export const emailInputSchema = z.object({
  email: z.string().email().describe("The email address to look up"),
});
export const emailInputShape = emailInputSchema.shape;

// Update profile input schema (for updating user's own profile)
export const updateProfileInputShape = updateProfileMutationRequestSchema.shape;

// Type exports for TypeScript usage
export type ProfileOutput = z.infer<typeof profileOutputSchema>;
export type InterestsOutput = z.infer<typeof interestsOutputSchema>;
export type ProfileInput = z.infer<typeof getProfileByIdPathParamsSchema>;
export type InterestsInput = z.infer<typeof getProfileInferredInterestsByIdPathParamsSchema>;
export type EmailInput = z.infer<typeof emailInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileMutationRequestSchema>;

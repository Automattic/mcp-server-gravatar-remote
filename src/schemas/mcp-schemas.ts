/**
 * MCP-compatible schemas for tool registration
 *
 * Maps Kubb-generated schemas to MCP requirements.
 * Uses type assertion to restore .shape access for MCP tool registration.
 */

import { profileSchema } from "../generated/schemas/profileSchema.js";
import { interestSchema } from "../generated/schemas/interestSchema.js";
import {
  getProfileByIdPathParamsSchema,
  getProfileInferredInterestsByIdPathParamsSchema,
} from "../generated/schemas/index.js";
import { z } from "zod";

// Output schemas for MCP tools (cast to restore .shape access)
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

// Input shapes for MCP tools (ZodRawShape format)
// Now that typed: false is set, we can directly access .shape without casting
export const profileInputShape = getProfileByIdPathParamsSchema.shape;
export const interestsInputShape = getProfileInferredInterestsByIdPathParamsSchema.shape;

// Email input schema (for email-based tools)
export const emailInputSchema = z.object({
  email: z.string().email().describe("The email address to look up"),
});
export const emailInputShape = emailInputSchema.shape;

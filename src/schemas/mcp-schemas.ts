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
export const mcpProfileOutputSchema = (profileSchema as z.ZodObject<any>).passthrough();

export const mcpInterestsOutputSchema = z.object({
  interests: z.array(
    // NOTE: .passthrough() allows extra properties when the API evolves ahead of the OpenAPI spec
    // Without this, new API fields cause validation errors until the spec is updated
    // Trade-off: less strict validation but more resilient to API changes
    (interestSchema as z.ZodObject<any>).passthrough(),
  ),
});

// Input schemas for MCP tools (cast to restore .shape access)
export const mcpProfileInputSchema = getProfileByIdPathParamsSchema as z.ZodObject<any>;
export const mcpInterestsInputSchema =
  getProfileInferredInterestsByIdPathParamsSchema as z.ZodObject<any>;

// Email input schema (for email-based tools)
export const mcpEmailInputSchema = z.object({
  email: z.string().email().describe("The email address to look up"),
});

// Type exports for TypeScript usage
export type McpProfileOutput = z.infer<typeof mcpProfileOutputSchema>;
export type McpInterestsOutput = z.infer<typeof mcpInterestsOutputSchema>;
export type McpProfileInput = z.infer<typeof mcpProfileInputSchema>;
export type McpInterestsInput = z.infer<typeof mcpInterestsInputSchema>;
export type McpEmailInput = z.infer<typeof mcpEmailInputSchema>;

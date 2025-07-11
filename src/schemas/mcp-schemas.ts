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
export const mcpProfileOutputSchema = profileSchema as z.ZodObject<any>;

export const mcpInterestsOutputSchema = z.object({
  interests: z.array(interestSchema as z.ZodObject<any>),
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

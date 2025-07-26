import type { ToolResponse } from "./types.js";

export function createErrorResponse(message: string, error: unknown): ToolResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: "text",
        text: `${message}: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

export function createSuccessResponse(data: any, textOverride?: string): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text: textOverride || JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  };
}

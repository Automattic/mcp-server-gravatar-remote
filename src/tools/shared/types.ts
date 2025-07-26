import type { UserProps } from "../../auth/types.js";

export interface ToolDefinition {
  name: string;
  config: ToolConfig;
  handler: ToolHandler;
}

export interface ToolConfig {
  title: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  annotations?: {
    readOnlyHint?: boolean;
    openWorldHint?: boolean;
    idempotentHint?: boolean;
  };
}

export interface ToolContext {
  props?: UserProps;
  apiKey?: string;
}

export type ToolHandler = (params: any, context: ToolContext) => Promise<ToolResponse>;

export interface ToolResponse {
  content: Array<{
    type: "text" | "image";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  structuredContent?: any;
  isError?: boolean;
}

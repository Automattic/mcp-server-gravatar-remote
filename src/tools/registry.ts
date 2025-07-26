import type { McpAgent } from "agents/mcp";
import type { ToolDefinition, ToolContext } from "./shared/types.js";
import type { UserProps } from "../auth/types.js";

export interface ToolRegistryOptions {
  apiKey?: string;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private apiKey?: string;

  constructor(options: ToolRegistryOptions = {}) {
    this.apiKey = options.apiKey;
  }

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  async registerAll(agent: McpAgent<Env, unknown, UserProps>) {
    // Import and register all tool modules
    const toolModules = await Promise.all([
      // Profiles
      import("./profiles/get-profile-by-email.js"),
      import("./profiles/get-profile-by-id.js"),
      import("./profiles/get-my-profile.js"),

      // Avatars
      import("./avatars/get-avatar-by-email.js"),
      import("./avatars/get-avatar-by-id.js"),

      // Experimental
      import("./experimental/get-inferred-interests-by-email.js"),
      import("./experimental/get-inferred-interests-by-id.js"),
    ]);

    for (const toolModule of toolModules) {
      const tool = toolModule.default;
      this.register(tool);

      // Register with MCP agent
      agent.server.registerTool(tool.name, tool.config, async (params: any) => {
        const context: ToolContext = {
          props: agent.props,
          apiKey: this.apiKey,
        };
        return tool.handler(params, context);
      });
    }
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
}

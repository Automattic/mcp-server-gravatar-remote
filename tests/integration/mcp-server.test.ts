import { describe, it, expect, vi, beforeEach } from "vitest";
import { GravatarMcpServer } from "../../src/index.js";

// Mock the agents module to avoid complex MCP agent initialization
vi.mock("agents/mcp", () => ({
  McpAgent: class MockMcpAgent {
    server: any;
    constructor() {
      this.server = {
        registerTool: vi.fn(),
        name: "mock-server",
        version: "1.0.0",
      };
    }
    async init() {
      // Mock init method
    }
    static mount(path: string) {
      // Mock mount method for Cloudflare Workers
      return {
        path,
        handler: "mocked-handler",
      };
    }
  },
}));

// Mock the MCP SDK
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn().mockImplementation((serverInfo) => ({
    registerTool: vi.fn(),
    name: serverInfo.name,
    version: serverInfo.version,
  })),
}));

// Mock the config module
vi.mock("../../src/config/server-config.js", () => ({
  getServerInfo: vi.fn().mockReturnValue({
    name: "Test Gravatar MCP Server",
    version: "1.0.0",
  }),
}));

// Mock the utility modules
vi.mock("../../src/common/utils.js", () => ({
  generateIdentifier: vi.fn().mockResolvedValue("mocked-hash-123"),
}));

vi.mock("../../src/tools/profile-utils.js", () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: "test-profile",
    displayName: "Test User",
  }),
}));

vi.mock("../../src/tools/experimental-utils.js", () => ({
  getInferredInterests: vi.fn().mockResolvedValue([
    { id: 1, name: "Programming" },
    { id: 2, name: "Web Development" },
  ]),
}));

vi.mock("../../src/tools/avatar-utils.js", () => ({
  fetchAvatar: vi.fn().mockResolvedValue({
    base64Data: "AQIDBA==",
    mimeType: "image/png",
  }),
  avatarParams: vi.fn().mockImplementation((identifier, ...args) => ({
    avatarIdentifier: identifier,
    ...args.reduce((acc, arg, index) => {
      if (arg !== undefined) {
        const keys = ["size", "defaultOption", "forceDefault", "rating"];
        if (keys[index]) acc[keys[index]] = arg;
      }
      return acc;
    }, {}),
  })),
}));

describe("MCP Server Integration Tests", () => {
  let server: any; // Use any to avoid protected constructor issues

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Server Initialization", () => {
    it("should create a GravatarMcpServer instance", async () => {
      // Test basic instantiation - use any to bypass protected constructor
      expect(() => {
        server = new (GravatarMcpServer as any)();
      }).not.toThrow();

      expect(server).toBeInstanceOf(GravatarMcpServer);
    });

    it("should initialize the server with proper configuration", async () => {
      server = new (GravatarMcpServer as any)();

      // Check if server has the expected properties
      expect(server.server).toBeDefined();
      // Remove specific property checks that don't exist on McpServer
    });

    it("should register all 6 MCP tools during initialization", async () => {
      server = new (GravatarMcpServer as any)();

      // Initialize the server
      await server.init();

      // Check that registerTool was called 6 times (for each tool)
      expect(server.server.registerTool).toHaveBeenCalledTimes(6);

      // Check that specific tools were registered
      const registerToolCalls = (server.server.registerTool as any).mock.calls;
      const toolNames = registerToolCalls.map((call: any) => call[0]);

      expect(toolNames).toContain("get_profile_by_email");
      expect(toolNames).toContain("get_profile_by_id");
      expect(toolNames).toContain("get_inferred_interests_by_email");
      expect(toolNames).toContain("get_inferred_interests_by_id");
      expect(toolNames).toContain("get_avatar_by_email");
      expect(toolNames).toContain("get_avatar_by_id");
    });
  });

  describe("Tool Registration Details", () => {
    beforeEach(async () => {
      server = new (GravatarMcpServer as any)();
      await server.init();
    });

    it("should register profile tools with correct schemas", async () => {
      const registerToolCalls = (server.server.registerTool as any).mock.calls;

      // Find the get_profile_by_email tool registration
      const profileByEmailCall = registerToolCalls.find(
        (call: any) => call[0] === "get_profile_by_email",
      );
      expect(profileByEmailCall).toBeDefined();

      // Check the tool configuration
      const [toolName, toolConfig] = profileByEmailCall;
      expect(toolName).toBe("get_profile_by_email");
      expect(toolConfig.title).toBe("Get Gravatar Profile by Email");
      expect(toolConfig.description).toContain(
        "Retrieve comprehensive Gravatar profile information",
      );
      expect(toolConfig.inputSchema).toBeDefined();
      expect(toolConfig.outputSchema).toBeDefined();
      expect(toolConfig.annotations).toBeDefined();
    });

    it("should register avatar tools with correct schemas", async () => {
      const registerToolCalls = (server.server.registerTool as any).mock.calls;

      // Find the get_avatar_by_email tool registration
      const avatarByEmailCall = registerToolCalls.find(
        (call: any) => call[0] === "get_avatar_by_email",
      );
      expect(avatarByEmailCall).toBeDefined();

      // Check the tool configuration
      const [toolName, toolConfig] = avatarByEmailCall;
      expect(toolName).toBe("get_avatar_by_email");
      expect(toolConfig.title).toBe("Get Avatar Image by Email");
      expect(toolConfig.inputSchema).toBeDefined();
      expect(toolConfig.inputSchema.email).toBeDefined();
      expect(toolConfig.inputSchema.size).toBeDefined();
      expect(toolConfig.annotations).toBeDefined();
    });

    it("should register interests tools with correct schemas", async () => {
      const registerToolCalls = (server.server.registerTool as any).mock.calls;

      // Find the get_inferred_interests_by_email tool registration
      const interestsCall = registerToolCalls.find(
        (call: any) => call[0] === "get_inferred_interests_by_email",
      );
      expect(interestsCall).toBeDefined();

      // Check the tool configuration
      const [toolName, toolConfig] = interestsCall;
      expect(toolName).toBe("get_inferred_interests_by_email");
      expect(toolConfig.title).toBe("Get Inferred Interests by Email");
      expect(toolConfig.description).toContain("AI-inferred interests");
      expect(toolConfig.inputSchema).toBeDefined();
      expect(toolConfig.outputSchema).toBeDefined();
    });
  });

  describe("End-to-End Tool Execution", () => {
    beforeEach(async () => {
      server = new (GravatarMcpServer as any)();
      await server.init();
    });

    it("should execute get_profile_by_email tool successfully", async () => {
      const registerToolCalls = (server.server.registerTool as any).mock.calls;

      // Find the get_profile_by_email tool registration
      const profileByEmailCall = registerToolCalls.find(
        (call: any) => call[0] === "get_profile_by_email",
      );
      expect(profileByEmailCall).toBeDefined();

      // Get the tool handler function
      const [, , toolHandler] = profileByEmailCall;

      // Execute the tool with test data
      const result = await toolHandler({ email: "test@example.com" });

      // Check the result structure
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe("text");
      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent.id).toBe("test-profile");
      expect(result.structuredContent.displayName).toBe("Test User");
    });

    it("should execute get_avatar_by_email tool successfully", async () => {
      const registerToolCalls = (server.server.registerTool as any).mock.calls;

      // Find the get_avatar_by_email tool registration
      const avatarByEmailCall = registerToolCalls.find(
        (call: any) => call[0] === "get_avatar_by_email",
      );
      expect(avatarByEmailCall).toBeDefined();

      // Get the tool handler function
      const [, , toolHandler] = avatarByEmailCall;

      // Execute the tool with test data
      const result = await toolHandler({
        email: "test@example.com",
        size: 200,
        defaultOption: "identicon",
      });

      // Check the result structure
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe("image");
      expect(result.content[0].data).toBeDefined();
      expect(result.content[0].mimeType).toBe("image/png");
    });

    it("should execute get_inferred_interests_by_email tool successfully", async () => {
      const registerToolCalls = (server.server.registerTool as any).mock.calls;

      // Find the get_inferred_interests_by_email tool registration
      const interestsCall = registerToolCalls.find(
        (call: any) => call[0] === "get_inferred_interests_by_email",
      );
      expect(interestsCall).toBeDefined();

      // Get the tool handler function
      const [, , toolHandler] = interestsCall;

      // Execute the tool with test data
      const result = await toolHandler({ email: "test@example.com" });

      // Check the result structure
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe("text");
      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent.interests).toBeDefined();
      expect(Array.isArray(result.structuredContent.interests)).toBe(true);
      expect(result.structuredContent.interests.length).toBe(2);
    });

    it("should handle large avatar images without stack overflow", async () => {
      // Mock fetchAvatar to return a large avatar (simulating 2048x2048 avatar)
      // The API supports images up to 2048x2048, which can be 500KB-2MB+ as PNG
      // This test would have caught the original bug in src/index.ts where large avatars
      // caused "Maximum call stack size exceeded" when converting to base64
      const { fetchAvatar } = await import("../../src/tools/avatar-utils.js");
      const largeBase64Data = "A".repeat(666000); // Large base64 string (~500KB decoded)
      (fetchAvatar as any).mockResolvedValueOnce({
        base64Data: largeBase64Data,
        mimeType: "image/png",
      });

      const registerToolCalls = (server.server.registerTool as any).mock.calls;
      const avatarByIdCall = registerToolCalls.find((call: any) => call[0] === "get_avatar_by_id");
      expect(avatarByIdCall).toBeDefined();

      const [, , toolHandler] = avatarByIdCall;

      // Execute the tool with maximum avatar size - should not throw stack overflow
      const result = await toolHandler({
        avatarIdentifier: "20e74a1399c883caeeba81b57007bcaa058940dcdffca01babfddbaefa5c3c4a",
        size: 2048,
      });

      // Should handle large avatar without errors
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe("image");
      expect(result.content[0].data).toBe(largeBase64Data);
      expect(result.content[0].mimeType).toBe("image/png");
    });

    it("should handle tool execution errors gracefully", async () => {
      // Mock an error in the profile utility
      const { getProfile } = await import("../../src/tools/profile-utils.js");
      (getProfile as any).mockRejectedValueOnce(new Error("API Error"));

      const registerToolCalls = (server.server.registerTool as any).mock.calls;
      const profileByEmailCall = registerToolCalls.find(
        (call: any) => call[0] === "get_profile_by_email",
      );
      const [, , toolHandler] = profileByEmailCall;

      // Execute the tool and expect error handling
      const result = await toolHandler({ email: "test@example.com" });

      // Check that error was handled gracefully
      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Failed to get profile");
      expect(result.content[0].text).toContain("API Error");
    });
  });
});

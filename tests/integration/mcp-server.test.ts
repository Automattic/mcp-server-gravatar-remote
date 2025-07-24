import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the version to avoid test dependency on real version
vi.mock("../../src/common/version.js", () => ({
  VERSION: "1.0.0",
}));

// Mock Node.js environment
vi.mock("../../src/common/env.js", () => ({
  getEnv: () => ({
    MCP_SERVER_NAME: "Test-Gravatar-MCP-Server",
    DEBUG: "false",
  }),
}));

// Create a proper mock server that matches the expected nested structure
const mockInnerServer = {
  oninitialized: undefined, // This will be set by the production code
  getClientVersion: vi.fn(),
  getClientCapabilities: vi.fn(),
};

const mockMcpServer = {
  registerTool: vi.fn(),
  registerPrompt: vi.fn(),
  name: "test-server",
  version: "1.0.0",
  server: mockInnerServer, // This provides the nested structure that production code expects
};

// Mock the MCP SDK - single, comprehensive mock
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn().mockImplementation((_serverInfo) => mockMcpServer),
}));

// Use real server config to test actual User-Agent functionality
// The version is mocked above to ensure test independence

// Mock the createServer function that creates our MCP server
vi.mock("../../src/server.js", () => ({
  createServer: vi.fn().mockImplementation(() => {
    return {
      server: mockMcpServer,
      registerTool: mockMcpServer.registerTool,
      init: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock("../../src/resources/integration-guide.js", () => ({
  getGravatarIntegrationGuide: vi
    .fn()
    .mockResolvedValue(
      "# Mock Gravatar Integration Guide\n\nThis is a mock integration guide for testing.",
    ),
}));

// Import the server creation function
const { createServer } = await import("../../src/server.js");

describe("MCP Server Integration Tests", () => {
  let server: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Server Creation", () => {
    it("should create a server instance", async () => {
      // Test server creation
      expect(() => {
        server = createServer();
      }).not.toThrow();

      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
    });

    it("should initialize the server with proper configuration", async () => {
      server = createServer();

      // Check if server has the expected properties
      expect(server.server).toBeDefined();
      expect(server.init).toBeDefined();
    });

    it("should register all 6 MCP tools during initialization", async () => {
      server = createServer();

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

  describe("User-Agent Integration", () => {
    beforeEach(async () => {
      server = new (GravatarMcpServer as any)();
    });

    it("should use generated User-Agent in HTTP requests", async () => {
      const { getApiHeaders, setClientInfo } = await import("../../src/config/server-config.js");

      // Set up client info to test real User-Agent generation
      setClientInfo({ name: "Test-Client", version: "1.0.0" }, { sampling: {}, elicitation: {} });

      // Get headers using the real function
      const headers = getApiHeaders("test-api-key");

      // Verify the User-Agent contains real client information
      expect(headers["User-Agent"]).toMatch(
        /Test-Gravatar-MCP-Server\/1\.0\.0 Test-Client\/1\.0\.0 \(sampling; elicitation\)/,
      );
      expect(headers.Authorization).toBe("Bearer test-api-key");
      expect(headers.Accept).toBe("application/json");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should handle missing client info gracefully in HTTP requests", async () => {
      const { getApiHeaders, setClientInfo } = await import("../../src/config/server-config.js");

      // Clear client info
      setClientInfo(undefined, undefined);

      // Get headers using the real function
      const headers = getApiHeaders();

      // Verify the User-Agent handles missing client info
      expect(headers["User-Agent"]).toMatch(
        /Test-Gravatar-MCP-Server\/1\.0\.0 unknown\/unknown \(none\)/,
      );
      expect(headers).not.toHaveProperty("Authorization");
    });
  });
});

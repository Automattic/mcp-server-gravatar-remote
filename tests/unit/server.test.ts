import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServer } from "../../src/server.js";

// Mock the version to avoid test dependency on real version
vi.mock("../../src/common/version.js", () => ({
  VERSION: "1.0.0",
}));

// Mock Node.js environment
vi.mock("../../src/common/env.js", () => ({
  getEnv: () => ({
    MCP_SERVER_NAME: "test-gravatar-mcp-server",
    DEBUG: "false",
  }),
}));

// Mock the tool utility functions to avoid external API calls
vi.mock("../../src/tools/profile-utils.js", () => ({
  getProfile: vi.fn().mockResolvedValue({
    name: "Test User",
    email: "test@example.com",
    profile: { id: "123", displayName: "Test User" },
  }),
}));

vi.mock("../../src/tools/experimental-utils.js", () => ({
  getInferredInterests: vi.fn().mockResolvedValue([{ name: "Technology", probability: 0.9 }]),
}));

vi.mock("../../src/tools/avatar-utils.js", () => ({
  fetchAvatar: vi.fn().mockResolvedValue({
    base64Data:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    mimeType: "image/png",
  }),
  avatarParams: vi.fn().mockReturnValue({
    identifier: "test-hash",
    size: 80,
  }),
}));

vi.mock("../../src/common/utils.js", () => ({
  generateIdentifier: vi.fn().mockResolvedValue("test-sha256-hash"),
}));

vi.mock("../../src/resources/integration-guide.js", () => ({
  getGravatarIntegrationGuide: vi
    .fn()
    .mockResolvedValue("# Test Gravatar Integration Guide\n\nThis is a test guide."),
}));

describe("Server Creation and Configuration", () => {
  let server: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.env for API key
    delete process.env.GRAVATAR_API_KEY;
  });

  describe("createServer", () => {
    it("should create a server instance without throwing", () => {
      expect(() => {
        server = createServer();
      }).not.toThrow();

      expect(server).toBeDefined();
    });

    it("should return an McpServer with expected methods", () => {
      server = createServer();

      expect(typeof server.registerTool).toBe("function");
      expect(typeof server.registerPrompt).toBe("function");
      expect(server.server).toBeDefined();
      expect(typeof server.server.oninitialized).toBe("function");
    });

    it("should handle API key from environment", () => {
      process.env.GRAVATAR_API_KEY = "test-api-key-123";

      expect(() => {
        server = createServer();
      }).not.toThrow();

      expect(server).toBeDefined();
    });

    it("should work without API key", () => {
      delete process.env.GRAVATAR_API_KEY;

      expect(() => {
        server = createServer();
      }).not.toThrow();

      expect(server).toBeDefined();
    });
  });

  describe("Client Initialization Callback", () => {
    it("should set up oninitialized callback", () => {
      server = createServer();

      expect(server.server.oninitialized).toBeDefined();
      expect(typeof server.server.oninitialized).toBe("function");
    });

    it("should handle client initialization gracefully", () => {
      server = createServer();

      // Mock client version and capabilities
      server.server.getClientVersion = vi.fn().mockReturnValue({
        name: "Test-Client",
        version: "1.0.0",
      });
      server.server.getClientCapabilities = vi.fn().mockReturnValue({
        sampling: {},
        elicitation: {},
      });

      expect(() => {
        server.server.oninitialized();
      }).not.toThrow();
    });
  });
});

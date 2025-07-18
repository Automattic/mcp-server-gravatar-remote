import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  config,
  getServerInfo,
  getApiHeaders,
  getRequestConfig,
  generateUserAgent,
  setClientInfo,
} from "../../src/config/server-config.js";

// Mock with obviously fake version to make it clear this is test data
vi.mock("../../src/common/version.js", () => ({
  VERSION: "99.99.99",
}));

// Mock Cloudflare Workers environment
vi.mock("cloudflare:workers", () => ({
  env: {
    ENVIRONMENT: "development",
    MCP_SERVER_NAME: "Gravatar-MCP-Server",
  },
}));

describe("config", () => {
  it("should have correct avatar API base URL", () => {
    expect(config.avatarApiBase).toBe("https://gravatar.com/avatar");
  });

  it("should have reasonable request timeout", () => {
    expect(config.requestTimeout).toBe(30000);
    expect(typeof config.requestTimeout).toBe("number");
    expect(config.requestTimeout).toBeGreaterThan(0);
  });

  it("should have all required configuration properties", () => {
    expect(config).toHaveProperty("avatarApiBase");
    expect(config).toHaveProperty("requestTimeout");
  });

  it("should have valid URL format for avatar API base", () => {
    expect(() => new URL(config.avatarApiBase)).not.toThrow();
    expect(config.avatarApiBase).toMatch(/^https?:\/\//);
  });
});

describe("getServerInfo", () => {
  it("should return server info with name and version", () => {
    const serverInfo = getServerInfo();

    expect(serverInfo).toEqual({
      name: "Gravatar-MCP-Server",
      version: "99.99.99",
    });
  });

  it("should have required properties", () => {
    const serverInfo = getServerInfo();

    expect(serverInfo).toHaveProperty("name");
    expect(serverInfo).toHaveProperty("version");
    expect(typeof serverInfo.name).toBe("string");
    expect(typeof serverInfo.version).toBe("string");
  });

  it("should have non-empty name and version", () => {
    const serverInfo = getServerInfo();

    expect(serverInfo.name.length).toBeGreaterThan(0);
    expect(serverInfo.version.length).toBeGreaterThan(0);
  });
});

describe("getApiHeaders", () => {
  beforeEach(() => {
    // Reset client info before each test
    setClientInfo(undefined, undefined);
  });

  it("should return headers with User-Agent", () => {
    const headers = getApiHeaders();

    expect(headers).toHaveProperty("User-Agent");
    expect(headers["User-Agent"]).toBe("Gravatar-MCP-Server/99.99.99 unknown/unknown (none)");
  });

  it("should return headers with Accept application/json", () => {
    const headers = getApiHeaders();

    expect(headers).toHaveProperty("Accept");
    expect(headers.Accept).toBe("application/json");
  });

  it("should return headers with Content-Type application/json", () => {
    const headers = getApiHeaders();

    expect(headers).toHaveProperty("Content-Type");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("should return all required headers without API key", () => {
    const headers = getApiHeaders();

    expect(headers).toEqual({
      "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("should include Authorization header when API key is provided", () => {
    const apiKey = "test-api-key-123";
    const headers = getApiHeaders(apiKey);

    expect(headers).toHaveProperty("Authorization");
    expect(headers.Authorization).toBe(`Bearer ${apiKey}`);
  });

  it("should return all headers with API key", () => {
    const apiKey = "test-api-key-123";
    const headers = getApiHeaders(apiKey);

    expect(headers).toEqual({
      "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    });
  });

  it("should not include Authorization header when API key is undefined", () => {
    const headers = getApiHeaders(undefined);

    expect(headers).not.toHaveProperty("Authorization");
    expect(headers).toEqual({
      "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("should not include Authorization header when API key is empty string", () => {
    const headers = getApiHeaders("");

    expect(headers).not.toHaveProperty("Authorization");
    expect(headers).toEqual({
      "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("should return headers as Record<string, string>", () => {
    const headers = getApiHeaders();

    expect(typeof headers).toBe("object");
    expect(headers).not.toBeNull();

    // Verify all values are strings
    Object.values(headers).forEach((value) => {
      expect(typeof value).toBe("string");
    });

    // Verify all keys are strings
    Object.keys(headers).forEach((key) => {
      expect(typeof key).toBe("string");
    });
  });

  it("should have proper HTTP header format", () => {
    const headers = getApiHeaders();

    // User-Agent should not be empty and follow general format
    expect(headers["User-Agent"]).toMatch(/^[\w\s\-/.()]+$/);

    // Accept should be valid MIME type
    expect(headers.Accept).toMatch(/^application\/json$/);

    // Content-Type should be valid MIME type
    expect(headers["Content-Type"]).toMatch(/^application\/json$/);
  });

  it("should have proper Authorization header format when API key is provided", () => {
    const apiKey = "test-api-key-123";
    const headers = getApiHeaders(apiKey);

    expect(headers.Authorization).toMatch(/^Bearer .+$/);
    expect(headers.Authorization).toBe(`Bearer ${apiKey}`);
  });
});

describe("configuration integration", () => {
  beforeEach(() => {
    // Reset client info before each test
    setClientInfo(undefined, undefined);
  });

  it("should use consistent version across config and server info", () => {
    const serverInfo = getServerInfo();
    const headers = getApiHeaders();

    // Extract version from user agent (server portion)
    const userAgentVersion = headers["User-Agent"].split("/")[1].split(" ")[0];

    expect(serverInfo.version).toBe(userAgentVersion);
    expect(serverInfo.version).toBe("99.99.99");
  });

  it("should have configuration suitable for production use", () => {
    // Avatar API base should be HTTPS
    expect(config.avatarApiBase).toMatch(/^https:/);

    // Timeout should be reasonable (not too short, not too long)
    expect(config.requestTimeout).toBeGreaterThanOrEqual(5000); // At least 5 seconds
    expect(config.requestTimeout).toBeLessThanOrEqual(60000); // At most 60 seconds

    // User agent (now generated dynamically) should identify the service
    const userAgent = generateUserAgent();
    expect(userAgent).toContain("Gravatar");
    expect(userAgent).toContain("MCP");
  });

  it("should generate User-Agent with proper format", () => {
    const userAgent = generateUserAgent();

    // Should follow: Server-name/version MCP-client-name/version (capabilities)
    expect(userAgent).toMatch(/^.+\/[\d.]+\s.+\/[\w.]+\s\(.+\)$/);
    expect(userAgent).toContain("Gravatar-MCP-Server");
    expect(userAgent).toContain("99.99.99");
  });
});

describe("generateUserAgent", () => {
  beforeEach(() => {
    // Reset client info before each test
    setClientInfo(undefined, undefined);
  });

  it("should generate User-Agent without client info", () => {
    const userAgent = generateUserAgent();

    expect(userAgent).toBe("Gravatar-MCP-Server/99.99.99 unknown/unknown (none)");
  });

  it("should generate User-Agent with client info but no capabilities", () => {
    const clientInfo = {
      name: "Claude-Code",
      version: "2.1.0",
    };

    setClientInfo(clientInfo, undefined);
    const userAgent = generateUserAgent();

    expect(userAgent).toBe("Gravatar-MCP-Server/99.99.99 Claude-Code/2.1.0 (none)");
  });

  it("should generate User-Agent with client info and capabilities", () => {
    const clientInfo = {
      name: "Claude-Code",
      version: "2.1.0",
    };
    const capabilities = {
      sampling: {},
      elicitation: {},
      roots: { listChanged: true },
    };

    setClientInfo(clientInfo, capabilities);
    const userAgent = generateUserAgent();

    expect(userAgent).toBe(
      "Gravatar-MCP-Server/99.99.99 Claude-Code/2.1.0 (sampling; elicitation; roots)",
    );
  });

  it("should generate User-Agent with partial client info", () => {
    const clientInfo = {
      name: "VSCode-MCP",
      version: "", // Empty version
    };
    const capabilities = {
      experimental: {},
    };

    setClientInfo(clientInfo, capabilities);
    const userAgent = generateUserAgent();

    expect(userAgent).toBe("Gravatar-MCP-Server/99.99.99 VSCode-MCP/unknown (experimental)");
  });

  it("should handle client info with missing name", () => {
    const clientInfo = {
      name: "",
      version: "1.0.0",
    };
    const capabilities = {
      sampling: {},
      roots: {},
    };

    setClientInfo(clientInfo, capabilities);
    const userAgent = generateUserAgent();

    expect(userAgent).toBe("Gravatar-MCP-Server/99.99.99 unknown/1.0.0 (sampling; roots)");
  });

  it("should handle all possible capabilities", () => {
    const clientInfo = {
      name: "Test-Client",
      version: "1.0.0",
    };
    const capabilities = {
      sampling: {},
      elicitation: {},
      roots: { listChanged: true },
      experimental: {},
    };

    setClientInfo(clientInfo, capabilities);
    const userAgent = generateUserAgent();

    expect(userAgent).toBe(
      "Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (sampling; elicitation; roots; experimental)",
    );
  });

  it("should handle empty capabilities object", () => {
    const clientInfo = {
      name: "Test-Client",
      version: "1.0.0",
    };
    const capabilities = {};

    setClientInfo(clientInfo, capabilities);
    const userAgent = generateUserAgent();

    expect(userAgent).toBe("Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (none)");
  });

  it("should follow correct format pattern", () => {
    const clientInfo = {
      name: "Claude-Code",
      version: "2.1.0",
    };
    const capabilities = {
      sampling: {},
      elicitation: {},
    };

    setClientInfo(clientInfo, capabilities);
    const userAgent = generateUserAgent();

    // Should match: Server-name/version MCP-client-name/version (capability_1; capability_2)
    expect(userAgent).toMatch(/^[\w-]+\/[\d.]+\s[\w-]+\/[\d.]+\s\([^)]+\)$/);
  });
});

describe("setClientInfo", () => {
  beforeEach(() => {
    // Reset client info before each test
    setClientInfo(undefined, undefined);
  });

  it("should update client info and affect User-Agent generation", () => {
    // Initially no client info
    expect(generateUserAgent()).toBe("Gravatar-MCP-Server/99.99.99 unknown/unknown (none)");

    // Set client info
    const clientInfo = {
      name: "Test-Client",
      version: "1.0.0",
    };
    const capabilities = {
      sampling: {},
    };

    setClientInfo(clientInfo, capabilities);

    // Should now include client info
    expect(generateUserAgent()).toBe("Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (sampling)");
  });

  it("should allow clearing client info", () => {
    // Set client info
    const clientInfo = {
      name: "Test-Client",
      version: "1.0.0",
    };
    setClientInfo(clientInfo, { sampling: {} });

    expect(generateUserAgent()).toBe("Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (sampling)");

    // Clear client info
    setClientInfo(undefined, undefined);

    expect(generateUserAgent()).toBe("Gravatar-MCP-Server/99.99.99 unknown/unknown (none)");
  });

  it("should handle partial updates", () => {
    // Set only client info
    const clientInfo = {
      name: "Test-Client",
      version: "1.0.0",
    };
    setClientInfo(clientInfo, undefined);

    expect(generateUserAgent()).toBe("Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (none)");

    // Update with capabilities
    const capabilities = {
      elicitation: {},
      roots: {},
    };
    setClientInfo(clientInfo, capabilities);

    expect(generateUserAgent()).toBe(
      "Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (elicitation; roots)",
    );
  });
});

describe("User-Agent integration with API headers", () => {
  beforeEach(() => {
    // Reset client info before each test
    setClientInfo(undefined, undefined);
  });

  it("should use generated User-Agent in API headers without client info", () => {
    const headers = getApiHeaders();

    expect(headers["User-Agent"]).toBe("Gravatar-MCP-Server/99.99.99 unknown/unknown (none)");
  });

  it("should use generated User-Agent in API headers with client info", () => {
    const clientInfo = {
      name: "Claude-Code",
      version: "2.1.0",
    };
    const capabilities = {
      sampling: {},
      elicitation: {},
    };

    setClientInfo(clientInfo, capabilities);
    const headers = getApiHeaders();

    expect(headers["User-Agent"]).toBe(
      "Gravatar-MCP-Server/99.99.99 Claude-Code/2.1.0 (sampling; elicitation)",
    );
  });

  it("should use generated User-Agent in request config", () => {
    const clientInfo = {
      name: "VSCode-MCP",
      version: "1.5.2",
    };
    const capabilities = {
      experimental: {},
    };

    setClientInfo(clientInfo, capabilities);
    const requestConfig = getRequestConfig();

    expect(requestConfig.headers["User-Agent"]).toBe(
      "Gravatar-MCP-Server/99.99.99 VSCode-MCP/1.5.2 (experimental)",
    );
  });

  it("should maintain User-Agent consistency across different API functions", () => {
    const clientInfo = {
      name: "Test-Client",
      version: "1.0.0",
    };
    const capabilities = {
      sampling: {},
      roots: {},
    };

    setClientInfo(clientInfo, capabilities);

    const userAgent = generateUserAgent();
    const headers = getApiHeaders();
    const requestConfig = getRequestConfig();

    expect(userAgent).toBe("Gravatar-MCP-Server/99.99.99 Test-Client/1.0.0 (sampling; roots)");
    expect(headers["User-Agent"]).toBe(userAgent);
    expect(requestConfig.headers["User-Agent"]).toBe(userAgent);
  });
});

describe("getRequestConfig", () => {
  beforeEach(() => {
    // Reset client info before each test
    setClientInfo(undefined, undefined);
  });

  it("should return configuration with baseURL", () => {
    const requestConfig = getRequestConfig();

    expect(requestConfig).toHaveProperty("baseURL");
    expect(requestConfig.baseURL).toBe("https://api.gravatar.com/v3");
  });

  it("should return configuration with timeout", () => {
    const requestConfig = getRequestConfig();

    expect(requestConfig).toHaveProperty("timeout");
    expect(requestConfig.timeout).toBe(30000);
  });

  it("should return configuration with headers without API key", () => {
    const requestConfig = getRequestConfig();

    expect(requestConfig).toHaveProperty("headers");
    expect(requestConfig.headers).toEqual({
      "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("should return configuration with headers including API key", () => {
    const apiKey = "test-api-key-123";
    const requestConfig = getRequestConfig(apiKey);

    expect(requestConfig).toHaveProperty("headers");
    expect(requestConfig.headers).toEqual({
      "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    });
  });

  it("should not include Authorization header when API key is undefined", () => {
    const requestConfig = getRequestConfig(undefined);

    expect(requestConfig.headers).not.toHaveProperty("Authorization");
  });

  it("should not include Authorization header when API key is empty string", () => {
    const requestConfig = getRequestConfig("");

    expect(requestConfig.headers).not.toHaveProperty("Authorization");
  });

  it("should return complete configuration object", () => {
    const apiKey = "test-api-key-123";
    const requestConfig = getRequestConfig(apiKey);

    expect(requestConfig).toEqual({
      baseURL: "https://api.gravatar.com/v3",
      timeout: 30000,
      headers: {
        "User-Agent": "Gravatar-MCP-Server/99.99.99 unknown/unknown (none)",
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  config,
  getServerInfo,
  getApiHeaders,
  getRequestConfig,
} from "../../src/config/server-config.js";

// Mock with obviously fake version to make it clear this is test data
vi.mock("../../src/common/version.js", () => ({
  VERSION: "99.99.99",
}));

describe("config", () => {
  it("should have correct avatar API base URL", () => {
    expect(config.avatarApiBase).toBe("https://gravatar.com/avatar");
  });

  it("should have user agent with version", () => {
    expect(config.userAgent).toBe("Remote-Gravatar-MCP-Server/99.99.99");
  });

  it("should have reasonable request timeout", () => {
    expect(config.requestTimeout).toBe(30000);
    expect(typeof config.requestTimeout).toBe("number");
    expect(config.requestTimeout).toBeGreaterThan(0);
  });

  it("should have all required configuration properties", () => {
    expect(config).toHaveProperty("avatarApiBase");
    expect(config).toHaveProperty("userAgent");
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
      name: "Gravatar MCP Server",
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
  it("should return headers with User-Agent", () => {
    const headers = getApiHeaders();

    expect(headers).toHaveProperty("User-Agent");
    expect(headers["User-Agent"]).toBe("Remote-Gravatar-MCP-Server/99.99.99");
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
      "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
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
      "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    });
  });

  it("should not include Authorization header when API key is undefined", () => {
    const headers = getApiHeaders(undefined);

    expect(headers).not.toHaveProperty("Authorization");
    expect(headers).toEqual({
      "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("should not include Authorization header when API key is empty string", () => {
    const headers = getApiHeaders("");

    expect(headers).not.toHaveProperty("Authorization");
    expect(headers).toEqual({
      "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
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
    expect(headers["User-Agent"]).toMatch(/^[\w\-/.]+$/);

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
  it("should use consistent version across config and server info", () => {
    const serverInfo = getServerInfo();
    const headers = getApiHeaders();

    // Extract version from user agent
    const userAgentVersion = headers["User-Agent"].split("/")[1];

    expect(serverInfo.version).toBe(userAgentVersion);
    expect(serverInfo.version).toBe("99.99.99");
  });

  it("should have configuration suitable for production use", () => {
    // Avatar API base should be HTTPS
    expect(config.avatarApiBase).toMatch(/^https:/);

    // Timeout should be reasonable (not too short, not too long)
    expect(config.requestTimeout).toBeGreaterThanOrEqual(5000); // At least 5 seconds
    expect(config.requestTimeout).toBeLessThanOrEqual(60000); // At most 60 seconds

    // User agent should identify the service
    expect(config.userAgent).toContain("Gravatar");
    expect(config.userAgent).toContain("MCP");
  });
});

describe("getRequestConfig", () => {
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
      "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("should return configuration with headers including API key", () => {
    const apiKey = "test-api-key-123";
    const requestConfig = getRequestConfig(apiKey);

    expect(requestConfig).toHaveProperty("headers");
    expect(requestConfig.headers).toEqual({
      "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
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
        "User-Agent": "Remote-Gravatar-MCP-Server/99.99.99",
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  });
});

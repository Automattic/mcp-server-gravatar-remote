import { describe, it, expect, vi } from "vitest";
import { getGravatarIntegrationGuide } from "../../src/resources/integration-guide.js";

// Mock fs/promises to avoid file system dependencies in tests
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue(`# Gravatar API Integration Guide

This is a comprehensive guide for integrating with the Gravatar API.

## Overview
Gravatar provides avatar and profile services.

## API Endpoints
- Avatar API: https://gravatar.com/avatar
- REST API: https://api.gravatar.com/v3

## Authentication
Use API keys for authenticated requests.
`),
}));

describe("Integration Guide Resource", () => {
  describe("getGravatarIntegrationGuide", () => {
    it("should return integration guide content", async () => {
      const guide = await getGravatarIntegrationGuide();

      expect(guide).toBeDefined();
      expect(typeof guide).toBe("string");
      expect(guide.length).toBeGreaterThan(0);
    });

    it("should return content with expected sections", async () => {
      const guide = await getGravatarIntegrationGuide();

      // Check for key sections that should be in any Gravatar integration guide
      expect(guide).toContain("Gravatar");
      expect(guide).toContain("API");
      expect(guide.includes("Integration") || guide.includes("integration")).toBe(true);
    });

    it("should return markdown-formatted content", async () => {
      const guide = await getGravatarIntegrationGuide();

      // Check for markdown formatting indicators
      expect(guide).toMatch(/^#\s/m); // Should have at least one heading
    });

    it("should handle file reading errors gracefully", async () => {
      // Mock a file read error
      const { readFile } = await import("node:fs/promises");
      (readFile as any).mockRejectedValueOnce(new Error("File not found"));

      await expect(getGravatarIntegrationGuide()).rejects.toThrow("File not found");
    });

    it("should return consistent content across multiple calls", async () => {
      const guide1 = await getGravatarIntegrationGuide();
      const guide2 = await getGravatarIntegrationGuide();

      expect(guide1).toBe(guide2);
    });
  });
});

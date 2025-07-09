import { describe, it, expect } from "vitest";

describe("Testing Infrastructure", () => {
  it("should have vitest working correctly", () => {
    expect(true).toBe(true);
  });

  it("should have access to globals", () => {
    expect(global).toBeDefined();
  });

  it("should have crypto mock available", () => {
    expect(crypto).toBeDefined();
    expect(crypto.subtle).toBeDefined();
    expect(crypto.subtle.digest).toBeDefined();
  });

  it("should be able to run async tests", async () => {
    const result = await Promise.resolve("test");
    expect(result).toBe("test");
  });

  it("should have working crypto mock", async () => {
    const data = new TextEncoder().encode("test");
    const hash = await crypto.subtle.digest("SHA-256", data);
    expect(hash).toBeInstanceOf(ArrayBuffer);
    expect(hash.byteLength).toBe(32);
  });
});

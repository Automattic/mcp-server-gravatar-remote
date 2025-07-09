import { beforeAll, afterAll, afterEach, vi } from "vitest";

// Global test setup for Cloudflare Workers environment
beforeAll(() => {
  // Setup global mocks for Workers environment
  // Mock crypto.subtle.digest for SHA256 hashing tests
  vi.stubGlobal("crypto", {
    subtle: {
      digest: vi.fn().mockImplementation(async (_algorithm: string, _data: ArrayBuffer) => {
        // Mock implementation for testing - returns predictable hash
        const mockHash = new Uint8Array(32);
        // Fill with predictable pattern for testing
        for (let i = 0; i < 32; i++) {
          mockHash[i] = i;
        }
        return mockHash.buffer;
      }),
    },
  });
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Global cleanup
  vi.unstubAllGlobals();
});

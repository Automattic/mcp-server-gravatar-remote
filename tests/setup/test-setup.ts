import { beforeAll, afterAll, afterEach, vi } from "vitest";

// Global test setup for Cloudflare Workers environment
beforeAll(() => {
  // Setup global mocks for Workers environment
  // Mock crypto.subtle.digest for SHA256 hashing tests
  vi.stubGlobal("crypto", {
    subtle: {
      digest: vi
        .fn()
        .mockImplementation(async (_algorithm: string, data: ArrayBuffer | Uint8Array) => {
          // Mock implementation for testing - returns hash based on input
          const inputArray = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
          const mockHash = new Uint8Array(32);

          // Create different hashes based on input content
          let seed = 0;
          for (let i = 0; i < inputArray.length; i++) {
            seed = (seed + inputArray[i]) % 256;
          }

          // Fill with pattern based on input
          for (let i = 0; i < 32; i++) {
            mockHash[i] = (seed + i) % 256;
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

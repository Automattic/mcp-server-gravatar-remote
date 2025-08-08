import { describe, it, expect } from "vitest";
import {
  EmptyStringError,
  assertNonEmpty,
  normalize,
  generateIdentifier,
  mapHttpError,
} from "../../src/common/utils.js";

describe("EmptyStringError", () => {
  it("should create error with default message", () => {
    const error = new EmptyStringError();
    expect(error.message).toBe("String parameter is empty");
    expect(error.name).toBe("EmptyStringError");
    expect(error).toBeInstanceOf(Error);
  });

  it("should create error with custom message", () => {
    const customMessage = "Custom empty string error";
    const error = new EmptyStringError(customMessage);
    expect(error.message).toBe(customMessage);
    expect(error.name).toBe("EmptyStringError");
  });
});

describe("assertNonEmpty", () => {
  it("should not throw for valid non-empty string", () => {
    expect(() => assertNonEmpty("valid")).not.toThrow();
    expect(() => assertNonEmpty("test@example.com")).not.toThrow();
    expect(() => assertNonEmpty("  valid  ")).not.toThrow();
  });

  it("should throw EmptyStringError for empty string", () => {
    expect(() => assertNonEmpty("")).toThrow(EmptyStringError);
  });

  it("should throw EmptyStringError for whitespace-only string", () => {
    expect(() => assertNonEmpty("   ")).toThrow(EmptyStringError);
    expect(() => assertNonEmpty("\t")).toThrow(EmptyStringError);
    expect(() => assertNonEmpty("\n")).toThrow(EmptyStringError);
    expect(() => assertNonEmpty("  \t\n  ")).toThrow(EmptyStringError);
    // Single space should also be considered empty (important for email validation)
    expect(() => assertNonEmpty(" ")).toThrow(EmptyStringError);
  });
});

describe("normalize", () => {
  it("should normalize valid email addresses", () => {
    expect(normalize("test@example.com")).toBe("test@example.com");
    expect(normalize("TEST@EXAMPLE.COM")).toBe("test@example.com");
    expect(normalize("  Test@Example.Com  ")).toBe("test@example.com");
  });

  it("should handle mixed case and whitespace", () => {
    expect(normalize("  JOHN.DOE@GMAIL.COM  ")).toBe("john.doe@gmail.com");
    expect(normalize("\tuser@domain.org\n")).toBe("user@domain.org");
  });

  it("should handle non-email strings", () => {
    expect(normalize("  SomeString  ")).toBe("somestring");
    expect(normalize("UPPERCASE")).toBe("uppercase");
  });

  it("should throw EmptyStringError for empty input", () => {
    expect(() => normalize("")).toThrow(EmptyStringError);
    expect(() => normalize("   ")).toThrow(EmptyStringError);
  });
});

describe("generateIdentifier", () => {
  it("should generate consistent SHA256 hash for same input", async () => {
    const email = "test@example.com";
    const hash1 = await generateIdentifier(email);
    const hash2 = await generateIdentifier(email);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // 64 character hex string
  });

  it("should generate different hashes for different inputs", async () => {
    const hash1 = await generateIdentifier("test1@example.com");
    const hash2 = await generateIdentifier("test2@example.com");

    expect(hash1).not.toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash2).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should normalize input before hashing", async () => {
    const hash1 = await generateIdentifier("TEST@EXAMPLE.COM");
    const hash2 = await generateIdentifier("test@example.com");
    const hash3 = await generateIdentifier("  Test@Example.Com  ");

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it("should throw EmptyStringError for empty input", async () => {
    await expect(generateIdentifier("")).rejects.toThrow(EmptyStringError);
    await expect(generateIdentifier("   ")).rejects.toThrow(EmptyStringError);
  });

  it("should generate valid SHA256 hash", async () => {
    const email = "test@example.com";
    const hash = await generateIdentifier(email);

    // Should be a valid 64-character hex string
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Should produce the expected hash for this email
    // SHA256 of "test@example.com" should be consistent
    expect(hash).toBe("973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b");
  });

  it("should handle special characters in email", async () => {
    const specialEmails = [
      "user+tag@example.com",
      "user.name@example.com",
      "user_name@example.com",
      "user-name@example.com",
    ];

    for (const email of specialEmails) {
      const hash = await generateIdentifier(email);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});

describe("mapHttpError", () => {
  const testIdentifier = "test-identifier";

  it("should map 404 to profile not found", () => {
    const result = mapHttpError(404, "Not Found", testIdentifier);
    expect(result).toBe(`No profile found for identifier: ${testIdentifier}`);
  });

  it("should map 400 to invalid identifier format", () => {
    const result = mapHttpError(400, "Bad Request", testIdentifier);
    expect(result).toBe(`Invalid identifier format: ${testIdentifier}`);
  });

  it("should map 403 to access denied", () => {
    const result = mapHttpError(403, "Forbidden", testIdentifier);
    expect(result).toBe("Profile is private or access denied");
  });

  it("should map 429 to rate limit exceeded", () => {
    const result = mapHttpError(429, "Too Many Requests", testIdentifier);
    expect(result).toBe("Rate limit exceeded. Please try again later");
  });

  it("should map 500 to service unavailable", () => {
    const result = mapHttpError(500, "Internal Server Error", testIdentifier);
    expect(result).toBe("Gravatar service is temporarily unavailable");
  });

  it("should map 502/503/504 to service issues", () => {
    const expectedMessage = "Gravatar service is experiencing issues. Please try again later";

    expect(mapHttpError(502, "Bad Gateway", testIdentifier)).toBe(expectedMessage);
    expect(mapHttpError(503, "Service Unavailable", testIdentifier)).toBe(expectedMessage);
    expect(mapHttpError(504, "Gateway Timeout", testIdentifier)).toBe(expectedMessage);
  });

  it("should map unknown status codes to generic error", () => {
    const result = mapHttpError(418, "I'm a teapot", testIdentifier);
    expect(result).toBe("Gravatar API error (418): I'm a teapot");
  });

  it("should handle various status codes and texts", () => {
    const testCases = [
      {
        status: 401,
        statusText: "Unauthorized",
        expected: "Gravatar API error (401): Unauthorized",
      },
      {
        status: 422,
        statusText: "Unprocessable Entity",
        expected: "Gravatar API error (422): Unprocessable Entity",
      },
      {
        status: 999,
        statusText: "Custom Error",
        expected: "Gravatar API error (999): Custom Error",
      },
    ];

    testCases.forEach(({ status, statusText, expected }) => {
      const result = mapHttpError(status, statusText, testIdentifier);
      expect(result).toBe(expected);
    });
  });
});

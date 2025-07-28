import { describe, it, expect } from "vitest";
import { createErrorResponse, createSuccessResponse } from "../../src/tools/shared/error-utils.js";

describe("Error Utilities", () => {
  describe("createErrorResponse", () => {
    it("should create error response with Error object", () => {
      const error = new Error("Something went wrong");
      const result = createErrorResponse("Failed to process", error);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Failed to process: Something went wrong",
          },
        ],
        isError: true,
      });
    });

    it("should create error response with string error", () => {
      const error = "Network timeout";
      const result = createErrorResponse("Connection failed", error);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Connection failed: Network timeout",
          },
        ],
        isError: true,
      });
    });

    it("should create error response with number error", () => {
      const error = 404;
      const result = createErrorResponse("HTTP error", error);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "HTTP error: 404",
          },
        ],
        isError: true,
      });
    });

    it("should create error response with null error", () => {
      const error = null;
      const result = createErrorResponse("Unknown error", error);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Unknown error: null",
          },
        ],
        isError: true,
      });
    });

    it("should create error response with undefined error", () => {
      const error = undefined;
      const result = createErrorResponse("Undefined error", error);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Undefined error: undefined",
          },
        ],
        isError: true,
      });
    });

    it("should create error response with object error", () => {
      const error = { code: "ECONNREFUSED", message: "Connection refused" };
      const result = createErrorResponse("Database error", error);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Database error: [object Object]",
          },
        ],
        isError: true,
      });
    });
  });

  describe("createSuccessResponse", () => {
    it("should create success response with data", () => {
      const data = { id: 123, name: "Test User" };
      const result = createSuccessResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
        structuredContent: data,
      });
    });

    it("should create success response with text override", () => {
      const data = { id: 123, name: "Test User" };
      const textOverride = "User retrieved successfully";
      const result = createSuccessResponse(data, textOverride);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "User retrieved successfully",
          },
        ],
        structuredContent: data,
      });
    });

    it("should fallback to JSON when text override is empty string", () => {
      const data = { count: 42 };
      const result = createSuccessResponse(data, "");

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
        structuredContent: data,
      });
    });

    it("should create success response with array data", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = createSuccessResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
        structuredContent: data,
      });
    });

    it("should create success response with primitive data", () => {
      const data = "simple string";
      const result = createSuccessResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
        structuredContent: data,
      });
    });

    it("should create success response with null data", () => {
      const data = null;
      const result = createSuccessResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "null",
          },
        ],
        structuredContent: null,
      });
    });
  });
});

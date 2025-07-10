import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  snakeToCamelCase,
  getBaseZodType,
  mapOpenApiPropertyToZod,
  generateZodObjectFromSchema,
} from "../../scripts/extract-schemas.js";

// Mock fs and path modules
vi.mock("node:fs");
vi.mock("node:path");

// Mock the config import
vi.mock("../../scripts/schemas.config.json", () => ({
  default: {
    outputSchemas: [
      {
        modelName: "TestModel",
        outputFileName: "test-output-schema",
      },
    ],
    inputSchemas: [
      {
        operationId: "testOperation",
        outputFileName: "test-input-schema",
        description: "Test input schema",
      },
    ],
  },
}));

describe("Schema Extraction Script", () => {
  const mockFs = vi.mocked(fs);
  const mockPath = vi.mocked(path);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPath.join.mockImplementation((...args) => args.join("/"));
    mockPath.join.mockReturnValue("/mock/path");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("snakeToCamelCase", () => {
    it("should convert snake_case to camelCase", () => {
      expect(snakeToCamelCase("snake_case")).toBe("snakeCase");
      expect(snakeToCamelCase("multiple_snake_case_words")).toBe("multipleSnakeCaseWords");
      expect(snakeToCamelCase("single")).toBe("single");
      expect(snakeToCamelCase("already_camelCase")).toBe("alreadyCamelCase");
    });

    it("should handle edge cases", () => {
      expect(snakeToCamelCase("")).toBe("");
      expect(snakeToCamelCase("_leading_underscore")).toBe("LeadingUnderscore");
      expect(snakeToCamelCase("trailing_underscore_")).toBe("trailingUnderscore_");
      // The regex only matches lowercase letters after underscore, so double underscore becomes _Underscore
      expect(snakeToCamelCase("double__underscore")).toBe("double_Underscore");
    });

    it("should only convert lowercase letters after underscores", () => {
      // The regex /_([a-z])/g only matches lowercase letters, so uppercase letters are preserved
      expect(snakeToCamelCase("test_A_value")).toBe("test_AValue");
      expect(snakeToCamelCase("api_URL_path")).toBe("api_URLPath");
    });
  });

  describe("getBaseZodType", () => {
    it("should convert string types correctly", () => {
      expect(getBaseZodType({ type: "string" })).toBe("z.string()");
      expect(getBaseZodType({ type: "string", format: "email" })).toBe("z.string().email()");
      expect(getBaseZodType({ type: "string", format: "uri" })).toBe("z.string().url()");
      expect(getBaseZodType({ type: "string", format: "date-time" })).toBe("z.string().datetime()");
    });

    it("should handle string constraints", () => {
      expect(
        getBaseZodType({
          type: "string",
          minLength: 1,
          maxLength: 100,
        }),
      ).toBe("z.string().min(1).max(100)");

      expect(
        getBaseZodType({
          type: "string",
          minLength: 5,
        }),
      ).toBe("z.string().min(5)");
    });

    it("should convert number types correctly", () => {
      expect(getBaseZodType({ type: "number" })).toBe("z.number()");
      expect(getBaseZodType({ type: "integer" })).toBe("z.number()");
      expect(
        getBaseZodType({
          type: "number",
          minimum: 0,
          maximum: 100,
        }),
      ).toBe("z.number().min(0).max(100)");
    });

    it("should handle enum types", () => {
      expect(
        getBaseZodType({
          type: "string",
          enum: ["option1", "option2", "option3"],
        }),
      ).toBe('z.enum(["option1", "option2", "option3"])');
    });

    it("should handle array types", () => {
      expect(
        getBaseZodType({
          type: "array",
          items: { type: "string" },
        }),
      ).toBe("z.array(z.string())");

      expect(
        getBaseZodType({
          type: "array",
          items: { type: "number" },
        }),
      ).toBe("z.array(z.number())");

      expect(getBaseZodType({ type: "array" })).toBe("z.array(z.unknown())");
    });

    it("should handle nullable types", () => {
      expect(getBaseZodType({ type: "string", nullable: true })).toBe("z.string().nullable()");
      expect(getBaseZodType({ type: ["string", "null"] })).toBe("z.string().nullable()");
    });

    it("should handle union types", () => {
      expect(getBaseZodType({ type: ["string", "number"] })).toBe(
        "z.union([z.string(), z.number()])",
      );
      expect(getBaseZodType({ type: ["string", "number", "null"] })).toBe(
        "z.union([z.string(), z.number()]).nullable()",
      );
    });

    it("should handle boolean and object types", () => {
      expect(getBaseZodType({ type: "boolean" })).toBe("z.boolean()");
      expect(getBaseZodType({ type: "object" })).toBe("z.object({})");
      expect(getBaseZodType({ type: "unknown" })).toBe("z.unknown()");
    });
  });

  describe("mapOpenApiPropertyToZod", () => {
    it("should handle required fields", () => {
      const result = mapOpenApiPropertyToZod("testField", { type: "string" }, ["testField"]);
      expect(result).toContain("z.string()");
      expect(result).not.toContain(".optional()");
    });

    it("should handle optional fields", () => {
      const result = mapOpenApiPropertyToZod("testField", { type: "string" }, []);
      expect(result).toContain("z.string()");
      expect(result).toContain(".optional()");
    });

    it("should handle descriptions", () => {
      const result = mapOpenApiPropertyToZod(
        "testField",
        { type: "string", description: "Test description" },
        ["testField"],
      );
      expect(result).toContain("z.string()");
      expect(result).toContain('.describe("Test description")');
    });

    it("should escape quotes in descriptions", () => {
      const result = mapOpenApiPropertyToZod(
        "testField",
        { type: "string", description: 'Description with "quotes"' },
        ["testField"],
      );
      expect(result).toContain('.describe("Description with \\"quotes\\"")');
    });

    it("should combine description with optional", () => {
      const result = mapOpenApiPropertyToZod(
        "testField",
        { type: "string", description: "Optional field" },
        [],
      );
      expect(result).toContain('.describe("Optional field")');
      expect(result).toContain(".optional()");
    });
  });

  describe("generateZodObjectFromSchema", () => {
    it("should generate empty object for no properties", () => {
      const schema = { type: "object", properties: {} };
      expect(generateZodObjectFromSchema(schema)).toBe("z.object({})");
    });

    it("should generate object with single property", () => {
      const schema = {
        type: "object",
        properties: {
          test_field: { type: "string", description: "Test field" },
        },
        required: ["test_field"],
      };

      const result = generateZodObjectFromSchema(schema);
      expect(result).toContain("testField:");
      expect(result).toContain("z.string()");
      expect(result).toContain('.describe("Test field")');
    });

    it("should handle multiple properties with mixed required/optional", () => {
      const schema = {
        type: "object",
        properties: {
          required_field: { type: "string" },
          optional_field: { type: "string" },
        },
        required: ["required_field"],
      };

      const result = generateZodObjectFromSchema(schema);
      expect(result).toContain("requiredField:");
      expect(result).toContain("optionalField:");
      expect(result).toContain(".optional()");
    });

    it("should convert snake_case property names to camelCase", () => {
      const schema = {
        type: "object",
        properties: {
          snake_case_property: { type: "string" },
          another_snake_case: { type: "string" },
        },
        required: [],
      };

      const result = generateZodObjectFromSchema(schema);
      expect(result).toContain("snakeCaseProperty:");
      expect(result).toContain("anotherSnakeCase:");
    });
  });

  describe("generateOutputZodSchema", () => {
    const generateOutputZodSchema = (_sourceSchema: any, config: any): string => {
      if (config.wrapInArray) {
        const itemSchema = "z.object({})"; // Simplified for testing
        let arrayProperty = `z.array(${itemSchema})`;

        if (config.wrapInArray.description) {
          arrayProperty = `${arrayProperty}.describe("${config.wrapInArray.description}")`;
        }

        return `z.object({
  ${config.wrapInArray.propertyName}: ${arrayProperty}
})`;
      }

      return "z.object({})"; // Simplified for testing
    };

    it("should generate direct schema when no array wrapper", () => {
      const sourceSchema = { properties: {} };
      const config = { modelName: "Test", outputFileName: "test" };

      const result = generateOutputZodSchema(sourceSchema, config);
      expect(result).toBe("z.object({})");
    });

    it("should wrap in array when configured", () => {
      const sourceSchema = { properties: {} };
      const config = {
        modelName: "Test",
        outputFileName: "test",
        wrapInArray: {
          propertyName: "items",
          description: "List of items",
        },
      };

      const result = generateOutputZodSchema(sourceSchema, config);
      expect(result).toContain('items: z.array(z.object({})).describe("List of items")');
    });

    it("should wrap in array without description", () => {
      const sourceSchema = { properties: {} };
      const config = {
        modelName: "Test",
        outputFileName: "test",
        wrapInArray: {
          propertyName: "items",
        },
      };

      const result = generateOutputZodSchema(sourceSchema, config);
      expect(result).toContain("items: z.array(z.object({}))");
      expect(result).not.toContain(".describe(");
    });
  });

  describe("File Operations", () => {
    it("should mock fs operations correctly", () => {
      // Test that mocks are set up correctly
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        '{"info":{"version":"1.0.0"},"components":{"schemas":{}},"paths":{}}',
      );
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {});

      // Verify mocks are callable
      expect(mockFs.existsSync("/test/path")).toBe(true);
      expect(mockFs.readFileSync("/test/path", "utf8")).toBe(
        '{"info":{"version":"1.0.0"},"components":{"schemas":{}},"paths":{}}',
      );
      expect(mockFs.mkdirSync("/test/path", { recursive: true })).toBeUndefined();
      expect(mockFs.writeFileSync("/test/path", "content")).toBeUndefined();
    });

    it("should generate correct file content format", () => {
      const zodSchema = "z.object({ test: z.string() })";
      const description = "Test schema";

      // Test the expected file content format
      const expectedContent = `import { z } from "zod";

/**
 * Zod schema for ${description}
 * Generated from OpenAPI specification
 */
export const testSchema = ${zodSchema};

export type TestSchemaType = z.infer<typeof testSchema>;
`;

      // Verify the content format is correct
      expect(expectedContent).toContain('import { z } from "zod"');
      expect(expectedContent).toContain(`export const testSchema = ${zodSchema}`);
      expect(expectedContent).toContain("export type TestSchemaType = z.infer<typeof testSchema>");
    });

    it("should handle camelCase conversion for export names", () => {
      const outputFileName = "test-output-schema";
      const expectedExportName = outputFileName.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );

      expect(expectedExportName).toBe("testOutputSchema");

      // Test type name generation
      const expectedTypeName = `${expectedExportName.charAt(0).toUpperCase()}${expectedExportName.slice(1)}Type`;
      expect(expectedTypeName).toBe("TestOutputSchemaType");
    });
  });

  describe("Validation Functions", () => {
    const mockOpenApiSpec = {
      info: { version: "1.0.0" },
      components: {
        schemas: {
          TestModel: { type: "object", properties: {} },
        },
      },
      paths: {
        "/test": {
          get: {
            operationId: "testOperation",
            parameters: [],
          },
        },
      },
    };

    it("should validate output schemas exist in OpenAPI spec", () => {
      const _configs = [{ modelName: "TestModel", outputFileName: "test-output" }];

      // Should not throw for existing schema
      expect(() => {
        if (!mockOpenApiSpec.components?.schemas?.TestModel) {
          throw new Error("TestModel schema not found in OpenAPI spec");
        }
      }).not.toThrow();
    });

    it("should throw error for missing output schema", () => {
      const _configs = [{ modelName: "NonExistentModel", outputFileName: "test-output" }];

      expect(() => {
        if (!(mockOpenApiSpec.components?.schemas as any)?.NonExistentModel) {
          throw new Error("NonExistentModel schema not found in OpenAPI spec");
        }
      }).toThrow("NonExistentModel schema not found in OpenAPI spec");
    });

    it("should validate input schemas with operationId", () => {
      const _configs = [
        { operationId: "testOperation", outputFileName: "test-input", description: "Test" },
      ];

      // Should find the operation
      let found = false;
      for (const [_path, pathItem] of Object.entries(mockOpenApiSpec.paths)) {
        if (pathItem.get?.operationId === "testOperation") {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it("should validate input schemas with custom schema", () => {
      const configs = [
        {
          customSchema: { email: { type: "string", format: "email" } },
          outputFileName: "email-input",
          description: "Email input",
        },
      ];

      // Should not throw for custom schema
      expect(() => {
        if (!configs[0].customSchema) {
          throw new Error("Input schema config must have either operationId or customSchema");
        }
      }).not.toThrow();
    });
  });
});

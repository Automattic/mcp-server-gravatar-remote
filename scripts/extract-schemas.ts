#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import configData from "./schemas.config.json" with { type: "json" };

/**
 * Extract MCP input and output schemas from OpenAPI specification
 * This script generates TypeScript files with Zod schemas for use in MCP tool definitions
 */

interface OutputSchemaConfig {
  modelName: string; // OpenAPI schema name (e.g., "Profile", "Interest")
  outputFileName: string; // Output file name (e.g., "profile-output-schema")
  wrapInArray?: {
    // Optional array wrapper
    propertyName: string; // Property name for the array (e.g., "interests")
    description?: string; // Description for the array property
  };
}

interface InputSchemaConfig {
  operationId?: string; // OpenAPI operation ID to extract parameters from
  parameterType?: string; // Custom parameter type (e.g., "email")
  outputFileName: string; // Output file name (e.g., "profile-input-schema")
  description: string; // Description for the input schema
  customSchema?: Record<string, JsonSchema>; // Custom schema definition
}

interface JsonSchema {
  type: string | string[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  format?: string;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  [key: string]: unknown; // Allow additional JSON Schema properties
}

interface OpenApiSpec {
  info: {
    version: string;
  };
  components: {
    schemas: Record<string, JsonSchema>;
  };
  paths: Record<
    string,
    {
      get?: {
        operationId?: string;
        parameters?: Array<{
          name: string;
          in: string;
          required?: boolean;
          description?: string;
          schema: JsonSchema;
        }>;
      };
    }
  >;
}

/**
 * Load and parse the OpenAPI specification
 */
export function loadOpenApiSpec(): OpenApiSpec {
  const openApiPath = path.join(process.cwd(), "openapi.json");
  if (!fs.existsSync(openApiPath)) {
    throw new Error("openapi.json not found in project root");
  }

  const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, "utf8")) as OpenApiSpec;
  console.log(`📖 Read OpenAPI spec version: ${openApiSpec.info.version}`);
  return openApiSpec;
}

/**
 * Validate that all required output schemas exist in the OpenAPI spec
 */
export function validateOutputSchemas(
  openApiSpec: OpenApiSpec,
  configs: OutputSchemaConfig[],
): void {
  for (const config of configs) {
    if (!openApiSpec.components?.schemas?.[config.modelName]) {
      throw new Error(`${config.modelName} schema not found in OpenAPI spec`);
    }
  }
}

/**
 * Validate that all required input schemas can be found or generated
 */
function validateInputSchemas(openApiSpec: OpenApiSpec, configs: InputSchemaConfig[]): void {
  for (const config of configs) {
    if (config.operationId) {
      // Find the operation in the OpenAPI spec
      let found = false;
      for (const [_path, pathItem] of Object.entries(openApiSpec.paths)) {
        if (pathItem.get?.operationId === config.operationId) {
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error(`Operation ${config.operationId} not found in OpenAPI spec`);
      }
    } else if (!config.customSchema) {
      throw new Error(
        `Input schema config must have either operationId or customSchema: ${config.outputFileName}`,
      );
    }
  }
}

/**
 * Convert snake_case to camelCase to match TypeScript interface
 */
export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert OpenAPI type to base Zod type
 */
export function getBaseZodType(property: JsonSchema): string {
  // Handle array types
  if (Array.isArray(property.type)) {
    // Handle nullable types like ["string", "null"]
    const nonNullTypes = property.type.filter((t) => t !== "null");
    if (nonNullTypes.length === 1) {
      const baseType = getBaseZodTypeForSingleType(nonNullTypes[0], property);
      return property.type.includes("null") ? `${baseType}.nullable()` : baseType;
    }
    // Multiple non-null types - use union
    const zodTypes = nonNullTypes.map((t) => getBaseZodTypeForSingleType(t, property));
    const unionType = `z.union([${zodTypes.join(", ")}])`;
    return property.type.includes("null") ? `${unionType}.nullable()` : unionType;
  }

  // Handle single type
  const baseType = getBaseZodTypeForSingleType(property.type, property);
  return property.nullable ? `${baseType}.nullable()` : baseType;
}

/**
 * Convert single OpenAPI type to Zod type
 */
function getBaseZodTypeForSingleType(type: string, property: JsonSchema): string {
  switch (type) {
    case "string": {
      if (property.enum) {
        const enumValues = property.enum.map((v) => `"${v}"`).join(", ");
        return `z.enum([${enumValues}])`;
      }
      let stringType = "z.string()";
      if (property.format === "email") stringType = "z.string().email()";
      else if (property.format === "uri") stringType = "z.string().url()";
      else if (property.format === "date-time") stringType = "z.string().datetime()";

      // Add length constraints
      if (property.minLength !== undefined) {
        stringType = `${stringType}.min(${property.minLength})`;
      }
      if (property.maxLength !== undefined) {
        stringType = `${stringType}.max(${property.maxLength})`;
      }

      return stringType;
    }
    case "integer":
    case "number": {
      let numberType = "z.number()";
      if (property.minimum !== undefined) {
        numberType = `${numberType}.min(${property.minimum})`;
      }
      if (property.maximum !== undefined) {
        numberType = `${numberType}.max(${property.maximum})`;
      }
      return numberType;
    }
    case "boolean":
      return "z.boolean()";
    case "array":
      if (property.items) {
        const itemType = getBaseZodType(property.items);
        return `z.array(${itemType})`;
      }
      return "z.array(z.unknown())";
    case "object":
      if (property.properties) {
        return generateNestedZodObject(property);
      }
      return "z.object({})";
    default:
      return "z.unknown()";
  }
}

/**
 * Generate nested Zod object schema
 */
function generateNestedZodObject(schema: JsonSchema): string {
  const properties = Object.entries(schema.properties || {});
  const requiredFields = schema.required || [];

  if (properties.length === 0) {
    return "z.object({})";
  }

  const zodProperties = properties.map(([propertyName, propertySchema]) => {
    const camelCasePropertyName = snakeToCamelCase(propertyName);
    const zodType = mapOpenApiPropertyToZod(propertyName, propertySchema, requiredFields);
    return `    ${camelCasePropertyName}: ${zodType}`;
  });

  return `z.object({\n${zodProperties.join(",\n")}\n  })`;
}

/**
 * Map OpenAPI property to Zod type with required/optional handling and descriptions
 */
export function mapOpenApiPropertyToZod(
  propertyName: string,
  property: JsonSchema,
  requiredFields: string[],
): string {
  const isRequired = requiredFields.includes(propertyName);
  let baseZodType = getBaseZodType(property);

  // Add description if available
  if (property.description) {
    baseZodType = `${baseZodType}.describe("${property.description.replace(/"/g, '\\"')}")`;
  }

  return isRequired ? baseZodType : `${baseZodType}.optional()`;
}

/**
 * Generate complete Zod object from OpenAPI schema
 */
export function generateZodObjectFromSchema(schema: JsonSchema): string {
  const properties = Object.entries(schema.properties || {});
  const requiredFields = schema.required || [];

  if (properties.length === 0) {
    return "z.object({})";
  }

  const zodProperties = properties.map(([propertyName, propertySchema]) => {
    const camelCasePropertyName = snakeToCamelCase(propertyName);
    const zodType = mapOpenApiPropertyToZod(propertyName, propertySchema, requiredFields);
    return `  ${camelCasePropertyName}: ${zodType}`;
  });

  return `z.object({\n${zodProperties.join(",\n")}\n})`;
}

/**
 * Generate Zod schema from source schema and output configuration
 */
function generateOutputZodSchema(sourceSchema: JsonSchema, config: OutputSchemaConfig): string {
  if (config.wrapInArray) {
    // Create array wrapper schema
    const itemSchema = generateZodObjectFromSchema(sourceSchema);
    let arrayProperty = `z.array(${itemSchema})`;

    // Add description to array property if provided
    if (config.wrapInArray.description) {
      arrayProperty = `${arrayProperty}.describe("${config.wrapInArray.description.replace(/"/g, '\\"')}")`;
    }

    return `z.object({
  ${config.wrapInArray.propertyName}: ${arrayProperty}
})`;
  }

  // Use schema directly
  return generateZodObjectFromSchema(sourceSchema);
}

/**
 * Generate input schema from OpenAPI operation or custom schema
 */
function generateInputZodSchema(openApiSpec: OpenApiSpec, config: InputSchemaConfig): string {
  if (config.customSchema) {
    // Use custom schema definition
    const schema: JsonSchema = {
      type: "object",
      properties: config.customSchema,
      required: Object.keys(config.customSchema),
    };
    return generateZodObjectFromSchema(schema);
  }

  if (config.operationId) {
    // Extract parameters from OpenAPI operation
    for (const [_path, pathItem] of Object.entries(openApiSpec.paths)) {
      if (pathItem.get?.operationId === config.operationId) {
        const parameters = pathItem.get.parameters || [];
        const properties: Record<string, JsonSchema> = {};
        const required: string[] = [];

        for (const param of parameters) {
          properties[param.name] = {
            ...param.schema,
            description: param.description || param.schema.description,
          };
          if (param.required) {
            required.push(param.name);
          }
        }

        const schema: JsonSchema = {
          type: "object",
          properties,
          required,
        };

        return generateZodObjectFromSchema(schema);
      }
    }
  }

  throw new Error(`Could not generate input schema for ${config.outputFileName}`);
}

/**
 * Write TypeScript schema file with Zod export
 */
function writeSchemaFile(
  zodSchema: string,
  outputFileName: string,
  schemasDir: string,
  description: string,
  schemaType: "input" | "output",
): void {
  const schemaPath = path.join(schemasDir, `${outputFileName}.ts`);
  const exportName = outputFileName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  const fileContent = `import { z } from "zod";

/**
 * Zod schema for ${description}
 * Generated from OpenAPI specification
 */
export const ${exportName} = ${zodSchema};

export type ${exportName.charAt(0).toUpperCase() + exportName.slice(1)}Type = z.infer<typeof ${exportName}>;
`;

  fs.writeFileSync(schemaPath, fileContent);
  console.log(`✅ Generated ${schemaType}: ${outputFileName}.ts`);
}

/**
 * Create schemas directory if it doesn't exist
 */
function ensureSchemasDirectory(): string {
  const schemasDir = path.join(process.cwd(), "src", "generated", "schemas");
  fs.mkdirSync(schemasDir, { recursive: true });
  console.log(`📁 Created schemas directory: ${schemasDir}`);
  return schemasDir;
}

/**
 * Print summary of generated schemas
 */
function printSummary(
  outputSchemas: Array<{ name: string; requiredFields: number; totalFields: number }>,
  inputSchemas: Array<{ name: string; requiredFields: number; totalFields: number }>,
): void {
  console.log("\n🎉 Zod schema extraction completed successfully!");
  console.log(
    `📊 Generated ${outputSchemas.length} output schemas and ${inputSchemas.length} input schemas:`,
  );

  if (outputSchemas.length > 0) {
    console.log("   Output schemas:");
    for (const schema of outputSchemas) {
      console.log(
        `     - ${schema.name}: ${schema.requiredFields} required fields, ${schema.totalFields} total fields`,
      );
    }
  }

  if (inputSchemas.length > 0) {
    console.log("   Input schemas:");
    for (const schema of inputSchemas) {
      console.log(
        `     - ${schema.name}: ${schema.requiredFields} required fields, ${schema.totalFields} total fields`,
      );
    }
  }
}

// Main execution
async function main(): Promise<void> {
  console.log("🔄 Extracting MCP Zod schemas from OpenAPI specification...");

  try {
    // Load configuration from external file
    const outputSchemaConfigs: OutputSchemaConfig[] = configData.outputSchemas;
    const inputSchemaConfigs: InputSchemaConfig[] = configData.inputSchemas;

    // Load and validate OpenAPI spec
    const openApiSpec = loadOpenApiSpec();
    validateOutputSchemas(openApiSpec, outputSchemaConfigs);
    validateInputSchemas(openApiSpec, inputSchemaConfigs);

    // Prepare output directory
    const schemasDir = ensureSchemasDirectory();

    const generatedOutputSchemas: Array<{
      name: string;
      requiredFields: number;
      totalFields: number;
    }> = [];
    const generatedInputSchemas: Array<{
      name: string;
      requiredFields: number;
      totalFields: number;
    }> = [];

    // Process output schema configurations
    for (const config of outputSchemaConfigs) {
      const sourceSchema = openApiSpec.components.schemas[config.modelName];
      const zodSchema = generateOutputZodSchema(sourceSchema, config);

      writeSchemaFile(
        zodSchema,
        config.outputFileName,
        schemasDir,
        `${config.modelName} output`,
        "output",
      );

      // Track for summary
      generatedOutputSchemas.push({
        name: config.modelName,
        requiredFields: sourceSchema.required?.length || 0,
        totalFields: Object.keys(sourceSchema.properties || {}).length,
      });
    }

    // Process input schema configurations
    for (const config of inputSchemaConfigs) {
      const zodSchema = generateInputZodSchema(openApiSpec, config);

      writeSchemaFile(zodSchema, config.outputFileName, schemasDir, config.description, "input");

      // Track for summary - count fields from generated schema
      const fieldCount = config.customSchema ? Object.keys(config.customSchema).length : 1;
      generatedInputSchemas.push({
        name: config.outputFileName,
        requiredFields: fieldCount,
        totalFields: fieldCount,
      });
    }

    printSummary(generatedOutputSchemas, generatedInputSchemas);
  } catch (error) {
    console.error(
      "❌ Zod schema extraction failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Only run the script when executed directly, not when imported as a module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

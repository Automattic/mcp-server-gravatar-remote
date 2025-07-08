#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import configData from "./schemas.config.json" with { type: "json" };

/**
 * Extract MCP output schemas from OpenAPI specification
 * This script generates TypeScript files with Zod schemas for use in MCP tool definitions
 */

interface SchemaConfig {
  modelName: string; // OpenAPI schema name (e.g., "Profile", "Interest")
  outputFileName: string; // Output file name (e.g., "profile-output-schema")
  wrapInArray?: {
    // Optional array wrapper
    propertyName: string; // Property name for the array (e.g., "interests")
    description?: string; // Description for the array property
  };
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
  [key: string]: unknown; // Allow additional JSON Schema properties
}

interface OpenApiSpec {
  info: {
    version: string;
  };
  components: {
    schemas: Record<string, JsonSchema>;
  };
}

/**
 * Load and parse the OpenAPI specification
 */
function loadOpenApiSpec(): OpenApiSpec {
  const openApiPath = path.join(process.cwd(), "openapi.json");
  if (!fs.existsSync(openApiPath)) {
    throw new Error("openapi.json not found in project root");
  }

  const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, "utf8")) as OpenApiSpec;
  console.log(`📖 Read OpenAPI spec version: ${openApiSpec.info.version}`);
  return openApiSpec;
}

/**
 * Validate that all required schemas exist in the OpenAPI spec
 */
function validateSchemas(openApiSpec: OpenApiSpec, configs: SchemaConfig[]): void {
  for (const config of configs) {
    if (!openApiSpec.components?.schemas?.[config.modelName]) {
      throw new Error(`${config.modelName} schema not found in OpenAPI spec`);
    }
  }
}

/**
 * Convert snake_case to camelCase to match TypeScript interface
 */
function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert OpenAPI type to base Zod type
 */
function getBaseZodType(property: JsonSchema): string {
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
    case "string":
      if (property.enum) {
        const enumValues = property.enum.map((v) => `"${v}"`).join(", ");
        return `z.enum([${enumValues}])`;
      }
      if (property.format === "email") return "z.string().email()";
      if (property.format === "uri") return "z.string().url()";
      if (property.format === "date-time") return "z.string().datetime()";
      return "z.string()";
    case "integer":
    case "number":
      return "z.number()";
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
 * Map OpenAPI property to Zod type with required/optional handling
 */
function mapOpenApiPropertyToZod(
  propertyName: string,
  property: JsonSchema,
  requiredFields: string[],
): string {
  const isRequired = requiredFields.includes(propertyName);
  const baseZodType = getBaseZodType(property);

  return isRequired ? baseZodType : `${baseZodType}.optional()`;
}

/**
 * Generate complete Zod object from OpenAPI schema
 */
function generateZodObjectFromSchema(schema: JsonSchema): string {
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
 * Generate Zod schema from source schema and configuration
 */
function generateZodSchema(sourceSchema: JsonSchema, config: SchemaConfig): string {
  if (config.wrapInArray) {
    // Create array wrapper schema
    const itemSchema = generateZodObjectFromSchema(sourceSchema);
    return `z.object({
  ${config.wrapInArray.propertyName}: z.array(${itemSchema})
})`;
  }

  // Use schema directly
  return generateZodObjectFromSchema(sourceSchema);
}

/**
 * Write TypeScript schema file with Zod export
 */
function writeZodSchemaFile(
  zodSchema: string,
  outputFileName: string,
  schemasDir: string,
  config: SchemaConfig,
): void {
  const schemaPath = path.join(schemasDir, `${outputFileName}.ts`);

  const exportName = outputFileName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  const fileContent = `import { z } from "zod";

/**
 * Zod schema for ${config.modelName} output
 * Generated from OpenAPI specification
 */
export const ${exportName} = ${zodSchema};

export type ${exportName.charAt(0).toUpperCase() + exportName.slice(1)}Type = z.infer<typeof ${exportName}>;
`;

  fs.writeFileSync(schemaPath, fileContent);
  console.log(`✅ Generated: ${outputFileName}.ts`);
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
  generatedSchemas: Array<{ name: string; requiredFields: number; totalFields: number }>,
): void {
  console.log("\n🎉 Zod schema extraction completed successfully!");
  console.log(`📊 Generated ${generatedSchemas.length} TypeScript schemas:`);
  for (const schema of generatedSchemas) {
    console.log(
      `   - ${schema.name} schema: ${schema.requiredFields} required fields, ${schema.totalFields} total fields`,
    );
  }
}

// Main execution
async function main(): Promise<void> {
  console.log("🔄 Extracting MCP Zod schemas from OpenAPI specification...");

  try {
    // Load configuration from external file
    const schemaConfigs: SchemaConfig[] = configData.schemas;

    // Load and validate OpenAPI spec
    const openApiSpec = loadOpenApiSpec();
    validateSchemas(openApiSpec, schemaConfigs);

    // Prepare output directory
    const schemasDir = ensureSchemasDirectory();

    const generatedSchemas: Array<{ name: string; requiredFields: number; totalFields: number }> =
      [];

    // Process each schema configuration
    for (const config of schemaConfigs) {
      const sourceSchema = openApiSpec.components.schemas[config.modelName];
      const zodSchema = generateZodSchema(sourceSchema, config);

      writeZodSchemaFile(zodSchema, config.outputFileName, schemasDir, config);

      // Track for summary
      generatedSchemas.push({
        name: config.modelName,
        requiredFields: sourceSchema.required?.length || 0,
        totalFields: Object.keys(sourceSchema.properties || {}).length,
      });
    }

    printSummary(generatedSchemas);
  } catch (error) {
    console.error(
      "❌ Zod schema extraction failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script
main();

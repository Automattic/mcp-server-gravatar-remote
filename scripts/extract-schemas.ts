#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import configData from "./schemas.config.json" with { type: "json" };

/**
 * Extract MCP output schemas from OpenAPI specification
 * This script generates JSON Schema files for use in MCP tool definitions
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
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: JsonSchema;
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
 * Generate output schema from source schema and configuration
 */
function generateSchema(sourceSchema: JsonSchema, config: SchemaConfig): JsonSchema {
  if (config.wrapInArray) {
    // Create array wrapper schema
    return {
      type: "object",
      properties: {
        [config.wrapInArray.propertyName]: {
          type: "array",
          description:
            config.wrapInArray.description || `A list of ${config.modelName.toLowerCase()}s`,
          items: sourceSchema,
        },
      },
      required: [config.wrapInArray.propertyName],
    };
  }
  // Use schema directly
  return {
    ...sourceSchema,
  };
}

/**
 * Write schema to file
 */
function writeSchemaFile(schema: JsonSchema, outputFileName: string, schemasDir: string): void {
  const schemaPath = path.join(schemasDir, `${outputFileName}.json`);
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Generated: ${outputFileName}.json`);
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
  console.log("\n🎉 Schema extraction completed successfully!");
  console.log(`📊 Generated ${generatedSchemas.length} schemas:`);
  for (const schema of generatedSchemas) {
    console.log(
      `   - ${schema.name} schema: ${schema.requiredFields} required fields, ${schema.totalFields} total fields`,
    );
  }
}

// Main execution
async function main(): Promise<void> {
  console.log("🔄 Extracting MCP output schemas from OpenAPI specification...");

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
      const outputSchema = generateSchema(sourceSchema, config);

      writeSchemaFile(outputSchema, config.outputFileName, schemasDir);

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
      "❌ Schema extraction failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script
main();

.PHONY: download-spec generate-client generate-schemas generate-all clean help

# Default target
help:
	@echo "Available targets:"
	@echo "  download-spec    - Download Gravatar OpenAPI specification"
	@echo "  generate-client  - Generate TypeScript client from OpenAPI spec"
	@echo "  generate-schemas - Extract MCP schemas from generated types"
	@echo "  generate-all     - Run full generation pipeline"
	@echo "  clean           - Remove generated files"
	@echo "  help            - Show this help message"

# Download the latest Gravatar OpenAPI specification
download-spec:
	@echo "Downloading Gravatar OpenAPI specification..."
	curl -s https://api.gravatar.com/v3/openapi -o openapi.json
	@echo "OpenAPI specification downloaded to openapi.json"

# Generate TypeScript client from OpenAPI specification
generate-client:
	@echo "Generating TypeScript client..."
	npx @openapitools/openapi-generator-cli generate
	@echo "TypeScript client generated in src/generated/gravatar-api/"

# Extract MCP schemas from OpenAPI specification
generate-schemas: download-spec
	@echo "Extracting MCP schemas..."
	npm run extract-schemas

# Run the full generation pipeline
generate-all: download-spec generate-client generate-schemas
	@echo "Full generation pipeline completed"

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -rf src/generated/
	rm -f openapi.json
	@echo "Generated files cleaned"

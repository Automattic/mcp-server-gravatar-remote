.PHONY: download-spec generate generate-all clean help

# Default target
help:
	@echo "Available targets:"
	@echo "  download-spec    - Download Gravatar OpenAPI specification"
	@echo "  generate        - Generate TypeScript client and schemas"
	@echo "  generate-all    - Run full generation pipeline"
	@echo "  clean          - Remove generated files"
	@echo "  help           - Show this help message"

# Download the latest Gravatar OpenAPI specification
download-spec:
	@echo "Downloading Gravatar OpenAPI specification..."
	curl -s https://api.gravatar.com/v3/openapi -o openapi.json
	@echo "OpenAPI specification downloaded to openapi.json"

# Generate TypeScript client and schemas
generate:
	@echo "Generating TypeScript client and schemas..."
	npx kubb generate
	@echo "TypeScript client and schemas generated in src/generated/"

# Run the full generation pipeline
generate-all: download-spec generate
	@echo "Full generation pipeline completed"

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -rf src/generated/
	rm -f openapi.json
	@echo "Generated files cleaned"

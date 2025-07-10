# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Remote Gravatar MCP Server** built for Cloudflare Workers. It implements the Model Context Protocol (MCP) to provide global access to Gravatar avatars, profiles, and AI-inferred interests. The server is designed to run on Cloudflare's edge network for low-latency global distribution.

## Essential Development Commands

### Development
- `npm run dev` - Start development server with hot reloading at http://localhost:8787
- `npm run start` - Alias for dev command

### Code Quality
- `npm run lint` - Run Biome linting
- `npm run lint:fix` - Run linting with auto-fix
- `npm run format` - Format code with Biome
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run tests with Vitest
- `npm run test:run` - Run tests once (non-watch mode)
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

### Deployment
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare Worker types

### Schema Generation
- `npm run extract-schemas` - Generate MCP schemas from OpenAPI spec
- `make download-spec` - Download latest Gravatar OpenAPI specification
- `make generate-client` - Generate TypeScript client from OpenAPI
- `make generate-all` - Run full generation pipeline

## Architecture

### Core Components

1. **GravatarMcpServer** (src/index.ts) - Main MCP server class extending McpAgent
2. **Tool Utilities** (src/tools/):
   - `profile-utils.ts` - Profile data retrieval
   - `avatar-utils.ts` - Avatar image handling
   - `experimental-utils.ts` - AI-inferred interests
3. **Generated Code** (src/generated/):
   - `gravatar-api/` - OpenAPI-generated TypeScript client
   - `schemas/` - Zod schemas for MCP input/output validation
4. **Configuration** (src/config/server-config.ts) - Server settings and API endpoints

### Key Architecture Patterns

- **Schema-First Development**: Uses OpenAPI spec to generate both API client and MCP schemas
- **Edge-Optimized**: Built for Cloudflare Workers with Web Crypto API for hashing
- **Type-Safe**: Full TypeScript with Zod validation for inputs/outputs
- **Modular Tools**: Each MCP tool is implemented as a separate utility function

### API Integration

The server provides 6 MCP tools:
- `get_profile_by_email` / `get_profile_by_id` - Retrieve profile data
- `get_inferred_interests_by_email` / `get_inferred_interests_by_id` - AI-generated interests
- `get_avatar_by_email` / `get_avatar_by_id` - Avatar images with customization options

Profile identifiers support SHA256/MD5 hashes and URL slugs. Avatar identifiers only support email hashes.

## Code Generation Workflow

1. **Download OpenAPI spec**: `make download-spec`
2. **Generate TypeScript client**: `make generate-client` (creates src/generated/gravatar-api/)
3. **Extract MCP schemas**: `npm run extract-schemas` (creates src/generated/schemas/)

The `scripts/extract-schemas.ts` script converts OpenAPI models to Zod schemas for MCP compatibility.

## Testing

Uses Vitest with:
- Node.js environment simulation
- MSW for API mocking
- Coverage reporting via v8
- Test setup in `tests/setup/test-setup.ts`

## Configuration Files

- `biome.json` - Code formatting and linting (excludes generated code)
- `wrangler.jsonc` - Cloudflare Workers deployment configuration
- `vitest.config.ts` - Test configuration with coverage settings
- `tsconfig.json` - TypeScript configuration for ES2022 target

## Important Notes

- Generated code in `src/generated/` should not be manually edited
- The server uses Server-Sent Events (SSE) for MCP communication at `/sse` endpoint
- All email addresses are automatically normalized and hashed using Web Crypto API
- Avatar images are returned as base64-encoded PNG data with proper MIME types
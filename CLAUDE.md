# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Gravatar MCP Server** built as a Node.js application. It implements the Model Context Protocol (MCP) to provide access to Gravatar avatars, profiles, and AI-inferred interests. The server supports both STDIO transport (local MCP) and StreamableHTTP transport for remote clients.

## Essential Development Commands

### Development
- `npm run dev` - Start development server in STDIO mode (default, standard MCP)
- `npm run dev:http` - Start development server in HTTP mode at http://localhost:8787
- `npm run start` - Start built server in STDIO mode (default)
- `npm run start:http` - Start built server in HTTP mode 
- `npm run build` - Build TypeScript to JavaScript in dist/

### MCP Inspector (Testing)
- `npm run inspector` - Launch MCP Inspector with STDIO transport
- `npm run inspector:http` - Launch MCP Inspector with HTTP transport

**HTTP Inspector Usage:**
```bash
# Terminal 1: Start HTTP server
npm run dev:http

# Terminal 2: Launch inspector
npm run inspector:http
```

**Manual Configuration (First Time Setup):**

The inspector web interface remembers your settings. Configure once:

**STDIO Mode (`npm run inspector`):**
1. In the web interface, set:
   - Transport: `stdio` (default)
   - Command: `tsx`
   - Arguments: `--env-file=.env src/index.ts`
2. Click "Connect" - settings will be saved for future use

**HTTP Mode (`npm run inspector:http`):**
1. In the web interface, set:
   - Transport: `streamable-http`
   - URL: `http://localhost:8787/mcp`
2. Click "Connect" - settings will be saved for future use

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

### Code Generation
- `npm run generate-kubb` - Generate TypeScript client from OpenAPI spec
- `npm run generate-kubb-with-spec` - Download spec and generate client

### Build Automation
- `make download-spec` - Download latest Gravatar OpenAPI specification
- `make generate-client` - Generate TypeScript client from OpenAPI
- `make generate-all` - Run full generation pipeline

## Architecture

### Core Components

1. **Server Creation** (src/server.ts) - Main MCP server factory function `createServer()`
2. **Entry Point** (src/index.ts) - Node.js application entry point with Express transport
3. **Tool Utilities** (src/tools/):
   - `profile-utils.ts` - Profile data retrieval
   - `avatar-utils.ts` - Avatar image handling
   - `experimental-utils.ts` - AI-inferred interests
4. **Generated Code** (src/generated/):
   - `gravatar-api/` - OpenAPI-generated TypeScript client
   - `schemas/` - Zod schemas for MCP input/output validation
5. **Configuration** (src/config/server-config.ts) - Server settings and API endpoints
6. **HTTP Transport** (src/transports/http-unified.ts) - Express.js-based MCP transport layer

### Key Architecture Patterns

- **Schema-First Development**: Uses OpenAPI spec to generate both API client and MCP schemas
- **Node.js-Optimized**: Built for Node.js with native crypto API for hashing
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
- `package.json` - Node.js project configuration and dependencies
- `vitest.config.ts` - Test configuration with coverage settings
- `tsconfig.json` - TypeScript configuration for ES2022 target

## Important Notes

- Generated code in `src/generated/` should not be manually edited
- The server uses StreamableHTTP transport for MCP communication at `/mcp` endpoint
- All email addresses are automatically normalized and hashed using Node.js crypto API
- Avatar images are returned as base64-encoded PNG data with proper MIME types

## Node.js Development Guidelines

This project follows Node.js and Express.js best practices:

- **TypeScript-first**: All source code uses TypeScript with strict typing
- **ES Modules**: Uses modern ES module syntax (`import`/`export`)
- **Express.js**: RESTful API with Express framework
- **MCP Protocol**: Implements Model Context Protocol via SDK
- **Security**: Environment-based configuration, no hardcoded secrets
- **Testing**: Comprehensive unit tests with Vitest
- **Code Quality**: Biome for linting and formatting

## API Key Configuration

The server supports optional Gravatar API key configuration:

### Production
Set environment variable:
```bash
export GRAVATAR_API_KEY=your-api-key-here
```

### Development  
Create `.env`:
```bash
GRAVATAR_API_KEY=your-api-key-here
```

The API key enables access to additional profile fields and authenticated endpoints.

## MCP Agent Insights

- Per-client isolation: Each MCP client connection gets its own McpAgent instance backed by a separate Durable
  Object
- No race conditions: "Global" variables in imported modules are actually per-client scoped, making them safe for
  client-specific data like User-Agent info
- State separation: Each client maintains independent state, configuration, and context
- Session lifecycle: When clients reconnect, they get a fresh instance (state doesn't persist across sessions)

Development Implications:

- Global variables in server-config.ts and similar modules are safe - they're isolated per client
- No need for complex per-instance state management patterns
- Client-specific features (like User-Agent generation) work correctly with multiple concurrent clients
- Simpler code patterns are often correct due to built-in isolation

Official Documentation:

- MCP Specification: https://spec.modelcontextprotocol.io/
- SDK Documentation: https://github.com/modelcontextprotocol/typescript-sdk
- Transport Details: https://spec.modelcontextprotocol.io/specification/basic/transports/

Key Architecture Note:

This server uses a stateless design with Express.js and StreamableHTTP transport. Each request is independent, making the architecture simple and scalable without complex state management concerns.

## Claude Code Memories

- Implemented the first version of the Remote Gravatar MCP Server
- Successfully integrated Node.js/Express with Gravatar's OpenAPI specification
- Developed an OpenAPI-first approach using Gravatar's specification to generate TypeScript clients and MCP schemas
- Created a modular MCP architecture with shared utility functions grouped by API endpoint type
- Always try the clean approach first before resorting to type casting
- Implemented a robust Node.js server architecture with Express.js, improving modularity, type safety, and performance by leveraging TypeScript, Zod schemas, and a flexible MCP tool design
- When dependencies in the package.json are modified (added, removed, or changed), you MUST run `npm install` so that the package-lock.json is also updated
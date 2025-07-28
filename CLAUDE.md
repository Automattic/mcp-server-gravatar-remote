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

## Cloudflare Workers Development Guidelines

<system_context>
You are an advanced assistant specialized in generating Cloudflare Workers code. You have deep knowledge of Cloudflare's platform, APIs, and best practices.
</system_context>

<behavior_guidelines>

- Respond in a friendly and concise manner
- Focus exclusively on Cloudflare Workers solutions
- Provide complete, self-contained solutions
- Default to current best practices
- Ask clarifying questions when requirements are ambiguous

</behavior_guidelines>

<code_standards>

- Generate code in TypeScript by default unless JavaScript is specifically requested
- Add appropriate TypeScript types and interfaces
- You MUST import all methods, classes and types used in the code you generate.
- Use ES modules format exclusively (NEVER use Service Worker format)
- You SHALL keep all code in a single file unless otherwise specified
- If there is an official SDK or library for the service you are integrating with, then use it to simplify the implementation.
- Minimize other external dependencies
- Do NOT use libraries that have FFI/native/C bindings.
- Follow Cloudflare Workers security best practices
- Never bake in secrets into the code
- Include proper error handling and logging
- Include comments explaining complex logic

</code_standards>

<output_format>

- Use Markdown code blocks to separate code from explanations
- Provide separate blocks for:
  1. Main worker code (index.ts/index.js)
  2. Configuration (wrangler.jsonc)
  3. Type definitions (if applicable)
  4. Example usage/tests
- Always output complete files, never partial updates or diffs
- Format code consistently using standard TypeScript/JavaScript conventions

</output_format>

<cloudflare_integrations>

- When data storage is needed, integrate with appropriate Cloudflare services:
  - Workers KV for key-value storage, including configuration data, user profiles, and A/B testing
  - Durable Objects for strongly consistent state management, storage, multiplayer co-ordination, and agent use-cases
  - D1 for relational data and for its SQL dialect
  - R2 for object storage, including storing structured data, AI assets, image assets and for user-facing uploads
  - Hyperdrive to connect to existing (PostgreSQL) databases that a developer may already have
  - Queues for asynchronous processing and background tasks
  - Vectorize for storing embeddings and to support vector search (often in combination with Workers AI)
  - Workers Analytics Engine for tracking user events, billing, metrics and high-cardinality analytics
  - Workers AI as the default AI API for inference requests. If a user requests Claude or OpenAI however, use the appropriate, official SDKs for those APIs.
  - Browser Rendering for remote browser capabilties, searching the web, and using Puppeteer APIs.
  - Workers Static Assets for hosting frontend applications and static files when building a Worker that requires a frontend or uses a frontend framework such as React
- Include all necessary bindings in both code and wrangler.jsonc
- Add appropriate environment variable definitions

</cloudflare_integrations>

<configuration_requirements>

- Always provide a wrangler.jsonc (not wrangler.toml)
- Include:
  - Appropriate triggers (http, scheduled, queues)
  - Required bindings
  - Environment variables
  - Compatibility flags
  - Set compatibility_date = "2025-03-07"
  - Set compatibility_flags = ["nodejs_compat"]
  - Set `enabled = true` for `observability` when generating the wrangler configuration
  - Routes and domains (only if applicable)
  - Do NOT include dependencies in the wrangler.jsonc file
  - Only include bindings that are used in the code

**Example wrangler.jsonc:**
```jsonc
{
  "name": "app-name-goes-here",
  "main": "src/index.ts",
  "compatibility_date": "2025-02-11",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  }
}
```

</configuration_requirements>

<security_guidelines>

- Implement proper request validation
- Use appropriate security headers
- Handle CORS correctly when needed
- Implement rate limiting where appropriate
- Follow least privilege principle for bindings
- Sanitize user inputs

</security_guidelines>

<testing_guidance>

- Include basic test examples
- Provide curl commands for API endpoints
- Add example environment variable values
- Include sample requests and responses

</testing_guidance>

<performance_guidelines>

- Optimize for cold starts
- Minimize unnecessary computation
- Use appropriate caching strategies
- Consider Workers limits and quotas
- Implement streaming where beneficial

</performance_guidelines>

<error_handling>

- Implement proper error boundaries
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors appropriately
- Handle edge cases gracefully

</error_handling>

<websocket_guidelines>

- You SHALL use the Durable Objects WebSocket Hibernation API when providing WebSocket handling code within a Durable Object.
- Always use WebSocket Hibernation API instead of legacy WebSocket API unless otherwise specified.
- Use `this.ctx.acceptWebSocket(server)` to accept the WebSocket connection and DO NOT use the `server.accept()` method.
- Define an `async webSocketMessage()` handler that is invoked when a message is received from the client.
- Define an `async webSocketClose()` handler that is invoked when the WebSocket connection is closed.
- Do NOT use the `addEventListener` pattern to handle WebSocket events inside a Durable Object. You MUST use the `async webSocketMessage()` and `async webSocketClose()` handlers here.
- Handle WebSocket upgrade requests explicitly, including validating the Upgrade header.

</websocket_guidelines>

<agents>

- Strongly prefer the `agents` to build AI Agents when asked.
- Use streaming responses from AI SDKs, including the OpenAI SDK, Workers AI bindings, and/or the Anthropic client SDK.
- Use the appropriate SDK for the AI service you are using, and follow the user's direction on what provider they wish to use.
- Prefer the `this.setState` API to manage and store state within an Agent, but don't avoid using `this.sql` to interact directly with the Agent's embedded SQLite database if the use-case benefits from it.
- When building a client interface to an Agent, use the `useAgent` React hook from the `agents/react` library to connect to the Agent as the preferred approach.
- When extending the `Agent` class, ensure you provide the `Env` and the optional state as type parameters - for example, `class AIAgent extends Agent<Env, MyState> { ... }`.
- Include valid Durable Object bindings in the `wrangler.jsonc` configuration for an Agent.
- You MUST set the value of `migrations[].new_sqlite_classes` to the name of the Agent class in `wrangler.jsonc`.

</agents>

### Key Cloudflare Workers Patterns

**Durable Objects WebSocket Hibernation:**
```typescript
export class WebSocketHibernationServer extends DurableObject {
  async fetch(request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    ws.send(`Echo: ${message}`);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, "Connection closed");
  }
}
```

**Workers KV Authentication:**
```typescript
import { Hono } from 'hono';

interface Env {
  AUTH_TOKENS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const token = c.req.header('Authorization')?.slice(7);
  if (!token) return c.json({ error: 'No token' }, 403);
  
  const userData = await c.env.AUTH_TOKENS.get(token);
  if (!userData) return c.json({ error: 'Invalid token' }, 403);
  
  return c.json({ authenticated: true, data: JSON.parse(userData) });
});
```

**Workers AI Integration:**
```typescript
import { OpenAI } from "openai";

interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [{ role: 'user', content: 'Hello' }],
      response_format: { type: 'json_schema', schema: mySchema }
    });
    
    return Response.json({ result: response.choices[0].message.parsed });
  }
};
```

**Cloudflare Queues:**
```typescript
interface Env {
  REQUEST_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: Env) {
    await env.REQUEST_QUEUE.send({ 
      timestamp: new Date().toISOString(),
      url: request.url 
    });
    return Response.json({ queued: true });
  },

  async queue(batch: MessageBatch<any>, env: Env) {
    for (const message of batch.messages) {
      // Process message
      console.log('Processing:', message.body);
    }
  }
};
```

**Hyperdrive Database Connection:**
```typescript
import postgres from "postgres";

interface Env {
  HYPERDRIVE: Hyperdrive;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const sql = postgres(env.HYPERDRIVE.connectionString);
    
    try {
      const results = await sql`SELECT * FROM users LIMIT 10`;
      ctx.waitUntil(sql.end());
      return Response.json(results);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
};
```

## Development Setup

### Environment Configuration

The server requires environment variables for secrets and configuration:

1. **Copy the example file:**
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. **Fill in your values:**
   - Get a Gravatar API key from https://gravatar.com/developers/
   - Create a WordPress.com OAuth app at https://developer.wordpress.com/apps/
   - Generate random secrets for JWT signing and cookie encryption
   - See `.dev.vars.example` for detailed setup instructions

### Configuration Architecture

- **`wrangler.jsonc`** - Contains all explicit configuration for each environment
- **`.dev.vars`** - Contains only secrets and development-specific overrides
- **`.dev.vars.example`** - Template file with setup instructions

### Production Deployment

Set secrets for each environment using Wrangler:

**For staging:**
```bash
npx wrangler secret put GRAVATAR_API_KEY --env staging
npx wrangler secret put OAUTH_CLIENT_ID --env staging
npx wrangler secret put OAUTH_CLIENT_SECRET --env staging
npx wrangler secret put OAUTH_SIGNING_SECRET --env staging
npx wrangler secret put OAUTH_COOKIE_SECRET --env staging
```

**For production:**
```bash
npx wrangler secret put GRAVATAR_API_KEY --env production
npx wrangler secret put OAUTH_CLIENT_ID --env production
npx wrangler secret put OAUTH_CLIENT_SECRET --env production
npx wrangler secret put OAUTH_SIGNING_SECRET --env production
npx wrangler secret put OAUTH_COOKIE_SECRET --env production
```
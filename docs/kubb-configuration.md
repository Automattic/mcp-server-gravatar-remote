# Kubb Configuration Documentation

## API Code Generation with Kubb

This project uses [Kubb](https://github.com/kubb-labs/kubb) for generating TypeScript API clients and Zod schemas from OpenAPI specifications. This document explains the current setup and migration history.

## Current Kubb Configuration

### kubb.config.ts
```typescript
export default defineConfig({
  root: '.',
  input: { path: './openapi.json' },
  output: {
    path: './src/generated',
    clean: true,
    extension: { '.ts': '.js' }  // Generates .js imports for Node.js compatibility
  },
  plugins: [
    pluginOas({ output: false }),
    pluginTs({
      output: { path: './models' },
      enumType: 'asConst',
      dateType: 'date',
      unknownType: 'unknown'
    }),
    pluginClient({ 
      output: { path: './clients' },
      client: { importPath: '../models' }
    }),
    pluginZod({
      output: { path: './schemas' },
      typed: true,
      dateType: 'stringOffset',
      unknownType: 'unknown'
    })
  ]
})
```

### Generated Structure
- **`/src/generated/models/`** - TypeScript type definitions
- **`/src/generated/clients/`** - Functional API client functions  
- **`/src/generated/schemas/`** - Zod validation schemas
- **`/src/schemas/`** - Manual MCP schema mappings

### Schema Structure

**Current Kubb Generated (snake_case)**:
```typescript
export const profileSchema = z.object({
  user_id: z.number().int().optional(),
  user_login: z.string().optional(),
  hash: z.string(),
  display_name: z.string(),
  profile_url: z.string().url(),
  // ... matches OpenAPI spec exactly
});
```

**Previous OpenAPI Generator (camelCase)**:
```typescript
export const profileOutputSchema = z.object({
  userId: z.number().optional(),
  userLogin: z.string().optional(),
  hash: z.string(),
  displayName: z.string(),
  profileUrl: z.string().url(),
  // ... custom camelCase conversion
});
```

### API Client Architecture

**Current Kubb Functional Approach**:
```typescript
import { getProfileById } from '../generated/clients/index.js';
import { getRequestConfig } from '../config/server-config.js';

export async function getProfile(identifier: string) {
  return await getProfileById(identifier, getRequestConfig());
}
```

**Previous OpenAPI Generator Class-based**:
```typescript
import { ProfilesApi, Configuration } from '../generated/gravatar-api/index.js';

const api = new ProfilesApi(new Configuration({
  headers: getApiHeaders()
}));
export async function getProfile(identifier: string) {
  return await api.getProfileById({ profileIdentifier: identifier });
}
```

## Usage Commands

### Development Workflow
```bash
# Download latest OpenAPI spec and generate code
make generate-all

# Generate code from existing spec
make generate

# Clean generated files (preserves manual schemas)
make clean

# Also available as npm scripts
npm run generate-kubb-with-spec
npm run generate-kubb
```

### MCP Schema Integration

Manual schema mappings in `src/schemas/mcp-schemas.ts`:
```typescript
// Restore Zod functionality from Kubb's TypeScript casting
function asZodSchema<T extends z.ZodTypeAny>(schema: any): T {
  return schema as T
}

// MCP-compatible schemas
export const mcpProfileOutputSchema = asZodSchema<z.ZodObject<any>>(profileSchema)
export const mcpInterestsOutputSchema = z.object({
  interests: z.array(asZodSchema<z.ZodObject<any>>(interestSchema))
})
```

## Migration History (Completed)

### Previous Architecture (OpenAPI Generator)
- ❌ Class-based API clients (`new ProfilesApi()`)
- ❌ camelCase properties requiring custom conversion
- ❌ 481-line custom schema extraction script
- ❌ Complex multi-tool generation pipeline
- ❌ Docker dependency for code generation

### Current Architecture (Kubb)
- ✅ **Functional API clients** (`getProfileById()`)
- ✅ **Native snake_case** matching OpenAPI spec exactly
- ✅ **Zero custom extraction code** - fully automated
- ✅ **Single-tool generation** with plugin architecture
- ✅ **Native Node.js generation** with better performance

### Benefits Achieved:
- **Eliminated 481 lines** of maintenance burden
- **Better type safety** with proper nested Zod schemas
- **Modern functional approach** instead of classes
- **Reduced complexity** - single tool vs multiple
- **Automated generation** that stays in sync with API changes

### Architecture Notes:
- **`/src/generated/`** - Auto-generated by Kubb (models, schemas, clients)
- **`/src/schemas/`** - Manually maintained MCP schema mappings
- **Property naming** - Uses snake_case to match OpenAPI specification exactly
- **Type safety** - Full TypeScript with proper Zod validation schemas
- **Configuration** - Single `kubb.config.ts` replaces multiple config files
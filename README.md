[![NPM Type Definitions](https://img.shields.io/badge/types-TypeScript-blue?style=plastic&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-orange?style=plastic&logo=node.js&logoColor=white)](https://nodejs.org/)

# Remote Gravatar MCP Server

A remote Model Context Protocol (MCP) server that provides global access to Gravatar avatars, profiles, and AI-inferred interests.

## Tools

This server provides 6 comprehensive tools for accessing Gravatar data:

### 1. `get_profile_by_id`
- **Description**: Retrieve comprehensive Gravatar profile information using a profile identifier
- **Required inputs**:
  - `profileIdentifier` (string): A Profile Identifier (see [Identifier Types](#identifier-types) section)
- **Returns**: Profile object as JSON with comprehensive user information

### 2. `get_profile_by_email`
- **Description**: Retrieve comprehensive Gravatar profile information using an email address
- **Required inputs**:
  - `email` (string): The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup.
- **Returns**: Profile object as JSON with comprehensive user information

### 3. `get_inferred_interests_by_id`
- **Description**: Fetch AI-inferred interests for a Gravatar profile using a profile identifier
- **Required inputs**:
  - `profileIdentifier` (string): A Profile Identifier (see [Identifier Types](#identifier-types) section)
- **Returns**: List of AI-inferred interest names as JSON

### 4. `get_inferred_interests_by_email`
- **Description**: Fetch AI-inferred interests for a Gravatar profile using an email address
- **Required inputs**:
  - `email` (string): The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup.
- **Returns**: List of AI-inferred interest names as JSON

### 5. `get_avatar_by_id`
- **Description**: Retrieve the avatar image for a Gravatar profile using an avatar identifier
- **Required inputs**:
  - `avatarIdentifier` (string): An Avatar Identifier (see [Identifier Types](#identifier-types) section)
- **Optional inputs**:
  - `size` (number, default: undefined): Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays).
  - `defaultOption` (string, default: undefined): Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent).
  - `forceDefault` (boolean, default: undefined): When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.
  - `rating` (string, default: undefined): Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.
- **Returns**: Avatar image in PNG format

### 6. `get_avatar_by_email`
- **Description**: Retrieve the avatar image for a Gravatar profile using an email address
- **Required inputs**:
  - `email` (string): The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup.
- **Optional inputs**:
  - `size` (number, default: undefined): Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays).
  - `defaultOption` (string, default: undefined): Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent).
  - `forceDefault` (boolean, default: undefined): When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.
  - `rating` (string, default: undefined): Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.
- **Returns**: Avatar image in PNG format

### Default Avatar Options

- `404`: Return an HTTP 404 error instead of an image when no avatar exists
- `mp`: (mystery-person) A simple, cartoon-style silhouetted outline of a person
- `identicon`: A geometric pattern based on an email hash
- `monsterid`: A generated 'monster' with different colors, faces, etc
- `wavatar`: Generated faces with differing features and backgrounds
- `retro`: Awesome generated, 8-bit arcade-style pixelated faces
- `robohash`: A generated robot with different colors, faces, etc
- `blank`: A transparent PNG image

### Rating Options

- `G`: Suitable for display on all websites with any audience type
- `PG`: May contain rude gestures, provocatively dressed individuals, the lesser swear words, or mild violence
- `R`: May contain harsh profanity, intense violence, nudity, or hard drug use
- `X`: May contain sexual imagery or extremely disturbing violence

## Setup

### Connect Claude Desktop to your Remote MCP Server

#### Native App Integrations
If your Claude Desktop app and account support adding integrations, you can add a remote server directly to Claude Desktop:

1. Add a new integration
2. Enter a name for your server
3. Enter the URL of your remote MCP server (`https://your-domain.com/mcp`)

#### Using mcp-remote Proxy
If your environment doesn't support that, you can connect to your remote MCP server from Claude Desktop using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote).

Follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "gravatar": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-domain.com/mcp"
      ]
    }
  }
}
```

For local development, use:

```json
{
  "mcpServers": {
    "gravatar": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/mcp"
      ]
    }
  }
}
```

### VS Code Configuration

#### Native Support for Remote Servers
For VS Code with support for Remote MCP Servers, add your server by pressing `Cmd + Shift + P` (or `Ctrl + Shift + P` on Windows/Linux) and type `MCP: Add Server...`, then `HTTP (HTTP or Server-Sent-Events)`.

#### Using mcp-remote Proxy
For VS Code with MCP support, add the following to your User Settings (JSON) file. Press `Cmd + Shift + P` (or `Ctrl + Shift + P` on Windows/Linux) and type `Preferences: Open Settings (JSON)`.

#### Production Deployment

```json
{
  "mcp": {
    "servers": {
      "gravatar": {
        "command": "npx",
        "args": [
          "mcp-remote",
          "https://your-domain.com/mcp"
        ]
      }
    }
  }
}
```

#### Local Development

```json
{
  "mcp": {
    "servers": {
      "gravatar": {
        "command": "npx",
        "args": [
          "mcp-remote",
          "http://localhost:8787/mcp"
        ]
      }
    }
  }
}
```

Optionally, you can add either configuration to a file called `.vscode/mcp.json` in your workspace to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.

## Identifier Types

The Gravatar MCP server uses different types of identifiers to access profile and avatar data:

### Profile Identifiers

A **Profile Identifier** can be one of the following:

1. **SHA256 Hash** (preferred): An email address that has been normalized (lower-cased and trimmed) and then hashed with SHA256
2. **MD5 Hash** (deprecated): An email address that has been normalized (lower-cased and trimmed) and then hashed with MD5
3. **URL Slug**: The username portion from a Gravatar profile URL (e.g., 'username' from gravatar.com/username)

### Avatar Identifiers

An **Avatar Identifier** is an email address that has been normalized (lower-cased and trimmed) and then hashed with either:

1. **SHA256** (preferred)
2. **MD5** (deprecated)

**Important**: Unlike Profile Identifiers, Avatar Identifiers cannot use URL slugs - only email hashes are supported.

### Email Addresses

When using email-based tools, you can provide any valid email format. The system will automatically:

1. Normalize the email (convert to lowercase and trim whitespace)
2. Generate the appropriate hash for API requests
3. Process the email securely without storing it

## API Key Configuration (Optional)

The server works without authentication, but you can optionally configure a Gravatar API key to access additional profile fields.

### For Production Deployment

Set the API key as an environment variable:

```bash
export GRAVATAR_API_KEY=your-api-key-here
```

### For Local Development

Create a `.env` file in the project root:

```bash
# .env
GRAVATAR_API_KEY=your-api-key-here
```

This file is automatically loaded during local development and should not be committed to version control (it's already in `.gitignore`).

## Environment Variables

Configure these environment variables depending on your needs:

```bash
# Required for remote access
MCP_TRANSPORT=http

# Server configuration
HOST=0.0.0.0               # Listen on all interfaces
PORT=8787                  # Default port (or use PORT from hosting provider)

# Security settings (recommended for production)
ENABLE_DNS_REBINDING_PROTECTION=true
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Optional Gravatar API key for enhanced features
GRAVATAR_API_KEY=your-api-key-here

# Debug output (disable in production)
DEBUG=false
```

## Development

### Local Development

Start the development server for testing:

```bash
# Install dependencies
npm install

# Start in HTTP mode for remote access
npm run dev:http

# Or start in STDIO mode for local testing
npm run dev
```

This will start the HTTP server at `http://localhost:8787` with hot reloading enabled.

### Architecture

This remote MCP server is built with Node.js and Express.js and features:

- **OpenAPI Generated Client**: TypeScript client generated from Gravatar's OpenAPI specification for profile and interests endpoints
- **Direct HTTP Calls**: Native fetch() for avatar image retrieval with proper MIME type detection
- **Remote Access**: StreamableHTTP transport for MCP communication over the network
- **Global Deployment**: Deploy to any Node.js hosting platform for worldwide access
- **No API Key Required**: Simplified deployment without authentication requirements

### Schema Generation

The server uses a dynamic schema generation system:

```bash
# Extract MCP schemas from OpenAPI specification
npm run extract-schemas
```

This generates Zod schemas from the OpenAPI spec for input validation and output formatting, ensuring type safety and MCP compliance.

## Technical Details

### Remote MCP Server Environment

This server is optimized for remote deployment with:

- **Node.js Runtime**: Express.js HTTP server for reliable network access
- **StreamableHTTP Transport**: Modern MCP transport for remote clients
- **Environment Configuration**: Flexible deployment options via environment variables
- **Security Features**: DNS rebinding protection and CORS configuration
- **Global Distribution**: Deploy anywhere Node.js is supported

### Rate Limiting

The server operates without API key authentication by default, which means:

- Standard Gravatar API rate limits apply
- All requests appear from your server's IP address
- Consider implementing client-side rate limiting for high-volume usage

## Requirements

- **Node.js**: 22.0.0 or higher
- **npm**: 10.0.0 or higher

## License

This remote MCP server is licensed under the Mozilla Public License Version 2.0 (MPL-2.0). This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MPL-2.0. For more details, please see the [LICENSE](LICENSE) file in the project repository.

## Related Projects

- [STDIO Gravatar MCP Server](https://github.com/Automattic/mcp-server-gravatar) - The original local Node.js version
- [Gravatar API Documentation](https://docs.gravatar.com) - Official Gravatar API documentation
- [Model Context Protocol](https://modelcontextprotocol.io) - Learn more about MCP

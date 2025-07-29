import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginClient } from "@kubb/plugin-client";

export default defineConfig({
  root: ".",
  input: {
    path: "./openapi.json",
  },
  output: {
    path: "./src/generated",
    clean: true,
    extension: {
      ".ts": ".js",
    },
  },
  plugins: [
    pluginOas({
      output: false,
    }),
    pluginTs({
      output: {
        path: "./models",
      },
      enumType: "asConst",
      dateType: "date",
      unknownType: "unknown",
      group: {
        type: "tag",
        name({ group }) {
          return `${group}Models`;
        },
      },
    }),
    pluginClient({
      output: {
        path: "./clients",
      },
      client: "axios",
      group: {
        type: "tag",
        name({ group }) {
          return `${group}Client`;
        },
      },
    }),
    pluginZod({
      output: {
        path: "./schemas",
      },
      typed: false,
      dateType: "stringOffset",
      unknownType: "unknown",
      group: {
        type: "tag",
        name({ group }) {
          return `${group}Schemas`;
        },
      },
      // Skip uploadAvatar schema - Kubb generates invalid code: z.boolean().default({})
      // The OpenAPI spec defines a nullable boolean with default null, but Kubb generates
      // an empty object {} as the default for a boolean field, causing TS2769
      exclude: [
        {
          type: "operationId",
          pattern: "uploadAvatar",
        },
      ],
    }),
  ],
});

import { describe, it, expect } from "vitest";
import { VERSION } from "../../src/common/version.js";
import packageJson from "../../package.json";

describe("version", () => {
  it("should import version from package.json", () => {
    expect(VERSION).toBe(packageJson.version);
  });
});

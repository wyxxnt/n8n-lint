import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const rootDir = fileURLToPath(new URL("../../", import.meta.url));

describe("CLI", () => {
  beforeAll(() => {
    execFileSync("npm", ["run", "build"], {
      cwd: rootDir,
      stdio: "pipe"
    });
  });

  it("reports fixture issues and exits non-zero when errors are found", () => {
    const result = spawnSync(
      process.execPath,
      [path.join(rootDir, "dist/cli.js"), path.join(rootDir, "tests/fixtures")],
      {
        cwd: rootDir,
        encoding: "utf8"
      }
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("2 errors, 6 warnings across 17 files.");
  });
});

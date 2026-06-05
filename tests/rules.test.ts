import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintWorkflow } from "../src/lint.js";
import type { Workflow } from "../src/types.js";

const fixturesDir = fileURLToPath(new URL("./fixtures/", import.meta.url));

const ruleCases = [
  "no-retry",
  "hardcoded-secret",
  "missing-timeout",
  "unauthenticated-webhook",
  "orphan-node",
  "unbounded-loop",
  "pinned-data",
  "missing-error-workflow"
];

describe("rules", () => {
  for (const ruleId of ruleCases) {
    it(`${ruleId} fires only on its bad fixture`, () => {
      const badIssues = lintWorkflow(readFixture(`${ruleId}.bad.json`));
      const goodIssues = lintWorkflow(readFixture(`${ruleId}.good.json`));

      expect(badIssues.map((issue) => issue.ruleId)).toEqual([ruleId]);
      expect(goodIssues).toEqual([]);
    });
  }

  it("orphan-node ignores sticky notes and reachable AI dependencies", () => {
    const issues = lintWorkflow(readFixture("orphan-node.ai-good.json"));

    expect(issues).toEqual([]);
  });
});

function readFixture(name: string): Workflow {
  return JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8")) as Workflow;
}

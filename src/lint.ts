import type { Issue, RuleConfig, Workflow } from "./types.js";
import { rules } from "./rules/index.js";

export function lintWorkflow(workflow: Workflow, ruleConfig: RuleConfig = {}): Issue[] {
  const issues: Issue[] = [];

  for (const rule of rules) {
    const severity = ruleConfig[rule.id] ?? rule.defaultSeverity;

    if (severity === "off") {
      continue;
    }

    const ruleIssues = rule.check(workflow, { severity }).map((issue) => ({
      ...issue,
      severity
    }));

    issues.push(...ruleIssues);
  }

  return issues;
}

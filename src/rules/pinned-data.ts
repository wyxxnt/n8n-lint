import type { Issue, Rule } from "../types.js";
import { hasNonEmptyValue } from "../workflow.js";

export const pinnedDataRule: Rule = {
  id: "pinned-data",
  description: "Pinned test data should not be committed with workflows.",
  defaultSeverity: "warn",
  check(workflow, context): Issue[] {
    if (!hasNonEmptyValue(workflow.pinData)) {
      return [];
    }

    return [
      {
        ruleId: pinnedDataRule.id,
        severity: context.severity,
        message: "Workflow contains non-empty pinData; remove pinned test data before shipping."
      }
    ];
  }
};

import type { Issue, Rule } from "../types.js";
import { hasNonEmptyValue, isErrorTriggerNode, isFailureProneNode } from "../workflow.js";

export const missingErrorWorkflowRule: Rule = {
  id: "missing-error-workflow",
  description: "Workflows with failure-prone nodes should route failures to an error workflow.",
  defaultSeverity: "warn",
  check(workflow, context): Issue[] {
    const hasFailureProneNode = workflow.nodes.some(
      (node) => !node.disabled && isFailureProneNode(node)
    );
    const hasErrorWorkflow = hasNonEmptyValue(workflow.settings?.errorWorkflow);
    const hasErrorTrigger = workflow.nodes.some(isErrorTriggerNode);

    if (!hasFailureProneNode || hasErrorWorkflow || hasErrorTrigger) {
      return [];
    }

    return [
      {
        ruleId: missingErrorWorkflowRule.id,
        severity: context.severity,
        message: "Workflow has failure-prone nodes but no settings.errorWorkflow or Error Trigger node."
      }
    ];
  }
};

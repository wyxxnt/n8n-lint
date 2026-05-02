import type { Issue, Rule } from "../types.js";
import { hasRetryOrErrorHandling, isFailureProneNode, nodeName } from "../workflow.js";

export const noRetryRule: Rule = {
  id: "no-retry",
  description: "Failure-prone nodes should retry or route errors explicitly.",
  defaultSeverity: "warn",
  check(workflow, context): Issue[] {
    return workflow.nodes
      .filter((node) => !node.disabled && isFailureProneNode(node) && !hasRetryOrErrorHandling(node))
      .map((node) => ({
        ruleId: noRetryRule.id,
        severity: context.severity,
        nodeName: nodeName(node),
        message: "Failure-prone node has no retryOnFail, continueOnFail, or onError:\"continueErrorOutput\" setting."
      }));
  }
};

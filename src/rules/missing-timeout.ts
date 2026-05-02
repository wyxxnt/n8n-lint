import type { Issue, Rule } from "../types.js";
import { getPathValue, isHttpNode, nodeName } from "../workflow.js";

export const missingTimeoutRule: Rule = {
  id: "missing-timeout",
  description: "HTTP Request nodes should define parameters.options.timeout.",
  defaultSeverity: "warn",
  check(workflow, context): Issue[] {
    return workflow.nodes
      .filter((node) => !node.disabled && isHttpNode(node))
      .filter((node) => {
        const timeout = getPathValue(node.parameters, ["options", "timeout"]);
        return timeout === undefined || timeout === null || timeout === "";
      })
      .map((node) => ({
        ruleId: missingTimeoutRule.id,
        severity: context.severity,
        nodeName: nodeName(node),
        message: "HTTP Request node is missing parameters.options.timeout."
      }));
  }
};

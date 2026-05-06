import type { Issue, Rule } from "../types.js";
import { getPathValue, isWebhookNode, nodeName } from "../workflow.js";

export const unauthenticatedWebhookRule: Rule = {
  id: "unauthenticated-webhook",
  description: "Webhook nodes should require authentication.",
  defaultSeverity: "error",
  check(workflow, context): Issue[] {
    return workflow.nodes
      .filter((node) => !node.disabled && isWebhookNode(node))
      .filter((node) => {
        const auth = getPathValue(node.parameters, ["authentication"]);
        return auth === undefined || auth === null || auth === "" || auth === "none";
      })
      .map((node) => ({
        ruleId: unauthenticatedWebhookRule.id,
        severity: context.severity,
        nodeName: nodeName(node),
        message: "Webhook node has no authentication configured."
      }));
  }
};

import type { Issue, Rule } from "../types.js";
import { isStickyNoteNode, isTriggerNode, nodeName, reachableFromTriggers } from "../workflow.js";

export const orphanNodeRule: Rule = {
  id: "orphan-node",
  description: "Non-trigger nodes should be reachable from a trigger.",
  defaultSeverity: "warn",
  check(workflow, context): Issue[] {
    const reachable = reachableFromTriggers(workflow);

    return workflow.nodes
      .filter((node) => !node.disabled && !isTriggerNode(node) && !isStickyNoteNode(node))
      .filter((node) => !reachable.has(nodeName(node)))
      .map((node) => ({
        ruleId: orphanNodeRule.id,
        severity: context.severity,
        nodeName: nodeName(node),
        message: "Node is not reachable from any trigger."
      }));
  }
};

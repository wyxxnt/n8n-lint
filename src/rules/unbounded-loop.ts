import type { Issue, Rule } from "../types.js";
import {
  downstreamNodes,
  hasBatchSizeLimit,
  isAiOrLlmNode,
  isHttpNode,
  isLoopNode,
  nodeName
} from "../workflow.js";

export const unboundedLoopRule: Rule = {
  id: "unbounded-loop",
  description: "Loops that call HTTP or AI/LLM nodes should set a batch size limit.",
  defaultSeverity: "warn",
  check(workflow, context): Issue[] {
    return workflow.nodes
      .filter((node) => !node.disabled && isLoopNode(node) && !hasBatchSizeLimit(node))
      .filter((node) =>
        downstreamNodes(workflow, nodeName(node)).some(
          (downstream) => !downstream.disabled && (isHttpNode(downstream) || isAiOrLlmNode(downstream))
        )
      )
      .map((node) => ({
        ruleId: unboundedLoopRule.id,
        severity: context.severity,
        nodeName: nodeName(node),
        message: "Loop reaches HTTP or AI/LLM work but has no batch size limit."
      }));
  }
};

import type { Workflow, WorkflowNode } from "./types.js";

export function nodeName(node: WorkflowNode): string {
  return node.name ?? node.id ?? "<unnamed>";
}

export function nodeType(node: WorkflowNode): string {
  return node.type ?? "";
}

export function nodeTypeLower(node: WorkflowNode): string {
  return nodeType(node).toLowerCase();
}

export function isHttpNode(node: WorkflowNode): boolean {
  return nodeType(node) === "n8n-nodes-base.httpRequest";
}

export function isWebhookNode(node: WorkflowNode): boolean {
  return nodeType(node) === "n8n-nodes-base.webhook";
}

export function isCodeNode(node: WorkflowNode): boolean {
  return nodeType(node) === "n8n-nodes-base.code";
}

export function isErrorTriggerNode(node: WorkflowNode): boolean {
  return nodeType(node) === "n8n-nodes-base.errorTrigger";
}

export function isLoopNode(node: WorkflowNode): boolean {
  return nodeType(node) === "n8n-nodes-base.splitInBatches";
}

export function isStickyNoteNode(node: WorkflowNode): boolean {
  return nodeType(node) === "n8n-nodes-base.stickyNote";
}

export function isDatabaseNode(node: WorkflowNode): boolean {
  const type = nodeTypeLower(node);
  return [
    "postgres",
    "mysql",
    "mariadb",
    "microsoftsql",
    "mongo",
    "redis",
    "sqlite",
    "supabase",
    "dynamodb",
    "database"
  ].some((part) => type.includes(part));
}

export function isAiOrLlmNode(node: WorkflowNode): boolean {
  const type = nodeTypeLower(node);
  return [
    "openai",
    "anthropic",
    "gemini",
    "llm",
    "lmchat",
    "langchain",
    "chains.",
    "agent",
    ".ai"
  ].some((part) => type.includes(part));
}

export function isFailureProneNode(node: WorkflowNode): boolean {
  return isHttpNode(node) || isDatabaseNode(node) || isCodeNode(node);
}

export function isTriggerNode(node: WorkflowNode): boolean {
  const type = nodeTypeLower(node);
  return (
    type.includes("trigger") ||
    type.endsWith(".manualtrigger") ||
    type.endsWith(".scheduletrigger") ||
    type.endsWith(".webhook") ||
    type.endsWith(".cron")
  );
}

export function isN8nExpression(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("=") || (trimmed.includes("{{") && trimmed.includes("}}"));
}

export function getPathValue(value: unknown, path: string[]): unknown {
  let current = value;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

export function hasRetryOrErrorHandling(node: WorkflowNode): boolean {
  return (
    node.retryOnFail === true ||
    node.continueOnFail === true ||
    node.onError === "continueErrorOutput"
  );
}

export function hasBatchSizeLimit(node: WorkflowNode): boolean {
  const value = findKeyDeep(node.parameters, "batchSize");
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

export function hasNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (isRecord(value)) {
    return Object.keys(value).length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

export function buildGraph(workflow: Workflow): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const node of workflow.nodes) {
    graph.set(nodeName(node), new Set());
  }

  for (const [sourceName, connectionValue] of Object.entries(workflow.connections)) {
    const targets = graph.get(sourceName) ?? new Set<string>();

    for (const edge of extractConnectionEdges(connectionValue)) {
      targets.add(edge.targetName);

      if (edge.type !== undefined && edge.type !== "main") {
        const targetEdges = graph.get(edge.targetName) ?? new Set<string>();
        targetEdges.add(sourceName);
        graph.set(edge.targetName, targetEdges);
      }
    }

    graph.set(sourceName, targets);
  }

  return graph;
}

export function reachableFromTriggers(workflow: Workflow): Set<string> {
  const graph = buildGraph(workflow);
  const queue = workflow.nodes
    .filter((node) => !node.disabled && isTriggerNode(node))
    .map(nodeName);
  const reachable = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || reachable.has(current)) {
      continue;
    }

    reachable.add(current);

    for (const next of graph.get(current) ?? []) {
      if (!reachable.has(next)) {
        queue.push(next);
      }
    }
  }

  return reachable;
}

export function downstreamNodes(workflow: Workflow, startNodeName: string): WorkflowNode[] {
  const graph = buildGraph(workflow);
  const nodesByName = new Map(workflow.nodes.map((node) => [nodeName(node), node]));
  const queue = [...(graph.get(startNodeName) ?? [])];
  const seen = new Set<string>();
  const downstream: WorkflowNode[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || seen.has(current)) {
      continue;
    }

    seen.add(current);

    const node = nodesByName.get(current);
    if (node !== undefined) {
      downstream.push(node);
    }

    for (const next of graph.get(current) ?? []) {
      if (!seen.has(next) && next !== startNodeName) {
        queue.push(next);
      }
    }
  }

  return downstream;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findKeyDeep(value: unknown, key: string): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findKeyDeep(item, key);
      if (found !== undefined) {
        return found;
      }
    }
  }

  if (isRecord(value)) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      return value[key];
    }

    for (const child of Object.values(value)) {
      const found = findKeyDeep(child, key);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
}

function extractConnectionEdges(connectionValue: unknown): Array<{ targetName: string; type?: string }> {
  const edges: Array<{ targetName: string; type?: string }> = [];

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    if (typeof value.node === "string") {
      edges.push({
        targetName: value.node,
        type: typeof value.type === "string" ? value.type : undefined
      });
      return;
    }

    for (const child of Object.values(value)) {
      visit(child);
    }
  }

  visit(connectionValue);
  return edges;
}

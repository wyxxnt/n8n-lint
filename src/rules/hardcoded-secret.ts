import type { Issue, Rule } from "../types.js";
import { isN8nExpression, isRecord, nodeName } from "../workflow.js";

const SECRET_VALUE_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /bearer\s+[A-Za-z0-9._~+/=-]{16,}/i
];

const SECRET_KEY_PATTERN = /(password|api[_-]?key|token|secret|access[_-]?key|private[_-]?key)/i;

export const hardcodedSecretRule: Rule = {
  id: "hardcoded-secret",
  description: "Literal secrets should use n8n credentials instead of parameters.",
  defaultSeverity: "error",
  check(workflow, context): Issue[] {
    const issues: Issue[] = [];

    for (const node of workflow.nodes) {
      if (node.disabled) {
        continue;
      }

      walk(node.parameters, [], (path, value) => {
        if (isN8nExpression(value) || value.trim() === "") {
          return;
        }

        const pathText = formatPath(path);
        const keyLooksSecret = path.some((segment) => SECRET_KEY_PATTERN.test(segment));
        const valueLooksSecret = SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));

        if (!keyLooksSecret && !valueLooksSecret) {
          return;
        }

        issues.push({
          ruleId: hardcodedSecretRule.id,
          severity: context.severity,
          nodeName: nodeName(node),
          message: `Potential hardcoded secret at parameters.${pathText}; use n8n credentials instead.`
        });
      });
    }

    return issues;
  }
};

function walk(
  value: unknown,
  path: string[],
  onString: (path: string[], value: string) => void
): void {
  if (typeof value === "string") {
    onString(path, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walk(item, [...path, String(index)], onString);
    });
    return;
  }

  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      walk(child, [...path, key], onString);
    }
  }
}

function formatPath(path: string[]): string {
  return path
    .map((segment, index) => {
      if (/^\d+$/.test(segment)) {
        return `[${segment}]`;
      }

      return index === 0 ? segment : `.${segment}`;
    })
    .join("");
}

import path from "node:path";
import pc from "picocolors";
import type { FileLintResult, LintSummary } from "./types.js";

export function formatDefaultReport(
  files: FileLintResult[],
  summary: LintSummary,
  options: { quiet?: boolean; color?: boolean } = {}
): string {
  const color = options.color ?? true;
  const lines: string[] = [];
  const paint = createPainter(color);

  for (const file of files) {
    const visibleIssues = options.quiet
      ? file.issues.filter((issue) => issue.severity === "error")
      : file.issues;

    if (visibleIssues.length === 0) {
      continue;
    }

    lines.push(paint.file(relativePath(file.path)));

    for (const issue of visibleIssues) {
      const severity = issue.severity === "error" ? paint.error("error") : paint.warn("warn");
      const node = issue.nodeName ? `  node "${issue.nodeName}":` : " ";
      lines.push(`  ${severity} ${paint.rule(issue.ruleId)}${node} ${issue.message}`);
    }

    lines.push("");
  }

  if (summary.errors === 0 && summary.warnings === 0) {
    lines.push(`No issues found across ${summary.files} ${plural(summary.files, "file", "files")}.`);
  } else {
    lines.push(
      `${summary.errors} ${plural(summary.errors, "error", "errors")}, ${summary.warnings} ${plural(
        summary.warnings,
        "warning",
        "warnings"
      )} across ${summary.files} ${plural(summary.files, "file", "files")}.`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function formatJsonReport(files: FileLintResult[], summary: LintSummary): string {
  return `${JSON.stringify({ files, summary }, null, 2)}\n`;
}

function relativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath) || filePath;
}

function plural(count: number, singular: string, pluralText: string): string {
  return count === 1 ? singular : pluralText;
}

function createPainter(color: boolean): {
  file(value: string): string;
  rule(value: string): string;
  error(value: string): string;
  warn(value: string): string;
} {
  if (!color) {
    return {
      file: String,
      rule: String,
      error: String,
      warn: String
    };
  }

  return {
    file: pc.bold,
    rule: pc.cyan,
    error: pc.red,
    warn: pc.yellow
  };
}

import { readFile } from "node:fs/promises";
import { InputError } from "./errors.js";
import { collectJsonFiles } from "./files.js";
import { lintWorkflow } from "./lint.js";
import { parseWorkflow } from "./schema.js";
import type { FileLintResult, LintSummary, RuleConfig, SkippedFile } from "./types.js";

export type RunResult = {
  files: FileLintResult[];
  skipped: SkippedFile[];
  summary: LintSummary;
};

export async function runLint(
  paths: string[],
  ruleConfig: RuleConfig = {},
  cwd = process.cwd()
): Promise<RunResult> {
  const jsonFiles = await collectJsonFiles(paths, cwd);

  if (jsonFiles.length === 0) {
    throw new InputError("No JSON files found in the provided path(s).");
  }

  const files: FileLintResult[] = [];
  const skipped: SkippedFile[] = [];

  for (const filePath of jsonFiles) {
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(await readFile(filePath, "utf8"));
    } catch (error) {
      throw new InputError(`Could not parse JSON file ${filePath}: ${errorMessage(error)}`);
    }

    const parsedWorkflow = parseWorkflow(parsedJson, filePath);
    if (!parsedWorkflow.ok) {
      skipped.push({ path: filePath, message: parsedWorkflow.message });
      continue;
    }

    files.push({
      path: filePath,
      issues: lintWorkflow(parsedWorkflow.workflow, ruleConfig)
    });
  }

  return {
    files,
    skipped,
    summary: summarize(files)
  };
}

export function summarize(files: FileLintResult[]): LintSummary {
  return files.reduce<LintSummary>(
    (summary, file) => {
      summary.files += 1;

      for (const issue of file.issues) {
        if (issue.severity === "error") {
          summary.errors += 1;
        } else {
          summary.warnings += 1;
        }
      }

      return summary;
    },
    { errors: 0, warnings: 0, files: 0 }
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

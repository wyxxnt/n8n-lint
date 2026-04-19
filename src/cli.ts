#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import pc from "picocolors";
import { loadConfig } from "./config.js";
import { InputError } from "./errors.js";
import { formatDefaultReport, formatJsonReport } from "./reporters.js";
import { runLint } from "./runner.js";

type CliOptions = {
  json?: boolean;
  config?: string;
  quiet?: boolean;
  maxWarnings?: number;
};

const program = new Command();

program
  .name("n8n-lint")
  .description("Lint n8n workflow JSON files for quality and safety problems.")
  .argument("<path...>", "workflow JSON files or directories")
  .option("--json", "print machine-readable JSON only on stdout")
  .option("--config <file>", "use a specific .n8nlintrc.json config file")
  .option("--quiet", "show errors only in the default reporter")
  .option("--max-warnings <n>", "exit with code 1 when warnings exceed n", parseMaxWarnings)
  .action(async (paths: string[], options: CliOptions) => {
    try {
      const config = await loadConfig(options.config);

      for (const warning of config.warnings) {
        console.error(pc.yellow(`warning: ${warning}`));
      }

      const result = await runLint(paths, config.rules);

      for (const skipped of result.skipped) {
        console.error(skipped.message);
      }

      if (options.json) {
        process.stdout.write(formatJsonReport(result.files, result.summary));
      } else {
        process.stdout.write(
          formatDefaultReport(result.files, result.summary, {
            quiet: options.quiet,
            color: process.stdout.isTTY
          })
        );
      }

      process.exitCode = getExitCode(result.summary, options.maxWarnings);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const prefix = error instanceof InputError ? "input error" : "error";
      console.error(`${pc.red(prefix)}: ${message}`);
      process.exitCode = 2;
    }
  });

await program.parseAsync();

function parseMaxWarnings(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new InvalidArgumentError("--max-warnings must be a non-negative integer");
  }

  return parsed;
}

function getExitCode(summary: { errors: number; warnings: number }, maxWarnings?: number): number {
  if (summary.errors > 0) {
    return 1;
  }

  if (maxWarnings !== undefined && summary.warnings > maxWarnings) {
    return 1;
  }

  return 0;
}

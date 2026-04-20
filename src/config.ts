import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { InputError } from "./errors.js";
import { ruleIds } from "./rules/index.js";
import type { RuleConfig } from "./types.js";

const ConfigSchema = z
  .object({
    rules: z.record(z.string(), z.enum(["off", "warn", "error"])).optional()
  })
  .passthrough();

export type LoadedConfig = {
  rules: RuleConfig;
  warnings: string[];
};

export async function loadConfig(configPath?: string, cwd = process.cwd()): Promise<LoadedConfig> {
  const resolvedPath = configPath
    ? path.resolve(cwd, configPath)
    : path.join(cwd, ".n8nlintrc.json");

  if (!configPath && !(await exists(resolvedPath))) {
    return { rules: {}, warnings: [] };
  }

  if (configPath && !(await exists(resolvedPath))) {
    throw new InputError(`Config file not found: ${resolvedPath}`);
  }

  let raw: string;
  try {
    raw = await readFile(resolvedPath, "utf8");
  } catch (error) {
    throw new InputError(`Could not read config file ${resolvedPath}: ${errorMessage(error)}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    throw new InputError(`Could not parse config file ${resolvedPath}: ${errorMessage(error)}`);
  }

  const parsed = ConfigSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new InputError(
      `Invalid config file ${resolvedPath}: expected { "rules": { "<rule-id>": "off"|"warn"|"error" } }`
    );
  }

  const rules: RuleConfig = {};
  const warnings: string[] = [];

  for (const [ruleId, severity] of Object.entries(parsed.data.rules ?? {})) {
    if (!ruleIds.has(ruleId)) {
      warnings.push(`Unknown rule id "${ruleId}" in config; ignoring.`);
      continue;
    }

    rules[ruleId] = severity;
  }

  return { rules, warnings };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

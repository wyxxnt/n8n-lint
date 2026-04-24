import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { InputError } from "./errors.js";

export async function collectJsonFiles(inputPaths: string[], cwd = process.cwd()): Promise<string[]> {
  const files: string[] = [];

  for (const inputPath of inputPaths) {
    const resolvedPath = path.resolve(cwd, inputPath);
    await collectPath(resolvedPath, files);
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

async function collectPath(filePath: string, files: string[]): Promise<void> {
  let stats;
  try {
    stats = await stat(filePath);
  } catch {
    throw new InputError(`Path not found: ${filePath}`);
  }

  if (stats.isDirectory()) {
    const entries = await readdir(filePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
        continue;
      }

      await collectPath(path.join(filePath, entry.name), files);
    }

    return;
  }

  if (!stats.isFile()) {
    return;
  }

  if (filePath.toLowerCase().endsWith(".json")) {
    files.push(filePath);
  }
}

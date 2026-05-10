import { z } from "zod";
import type { Workflow } from "./types.js";

const NodeSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    typeVersion: z.unknown().optional(),
    parameters: z.record(z.string(), z.unknown()).optional().default({}),
    credentials: z.unknown().optional(),
    disabled: z.boolean().optional(),
    continueOnFail: z.boolean().optional(),
    retryOnFail: z.boolean().optional(),
    maxTries: z.unknown().optional(),
    onError: z.string().optional()
  })
  .passthrough();

const WorkflowSchema = z
  .object({
    name: z.string().optional(),
    nodes: z.array(NodeSchema),
    connections: z.record(z.string(), z.unknown()),
    settings: z.record(z.string(), z.unknown()).optional(),
    pinData: z.unknown().optional(),
    active: z.boolean().optional(),
    tags: z.unknown().optional()
  })
  .passthrough();

export type WorkflowParseResult =
  | { ok: true; workflow: Workflow }
  | { ok: false; message: string };

export function parseWorkflow(value: unknown, sourcePath: string): WorkflowParseResult {
  const result = WorkflowSchema.safeParse(value);

  if (!result.success) {
    return {
      ok: false,
      message: `${sourcePath}: not an n8n workflow (expected JSON with nodes array and connections object)`
    };
  }

  return { ok: true, workflow: result.data as Workflow };
}

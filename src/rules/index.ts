import type { Rule } from "../types.js";
import { hardcodedSecretRule } from "./hardcoded-secret.js";
import { missingErrorWorkflowRule } from "./missing-error-workflow.js";
import { missingTimeoutRule } from "./missing-timeout.js";
import { noRetryRule } from "./no-retry.js";
import { orphanNodeRule } from "./orphan-node.js";
import { pinnedDataRule } from "./pinned-data.js";
import { unauthenticatedWebhookRule } from "./unauthenticated-webhook.js";
import { unboundedLoopRule } from "./unbounded-loop.js";

export const rules: Rule[] = [
  noRetryRule,
  hardcodedSecretRule,
  missingTimeoutRule,
  unauthenticatedWebhookRule,
  orphanNodeRule,
  unboundedLoopRule,
  pinnedDataRule,
  missingErrorWorkflowRule
];

export const ruleIds = new Set(rules.map((rule) => rule.id));

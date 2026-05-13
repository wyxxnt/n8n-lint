export type Severity = "off" | "warn" | "error";
export type ActiveSeverity = Exclude<Severity, "off">;

export type ConnectionTarget = {
  node?: string;
  type?: string;
  index?: number;
  [key: string]: unknown;
};

export type ConnectionMap = Record<string, unknown>;

export type WorkflowNode = {
  id?: string;
  name?: string;
  type?: string;
  typeVersion?: unknown;
  parameters: Record<string, unknown>;
  credentials?: unknown;
  disabled?: boolean;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: unknown;
  onError?: string;
  [key: string]: unknown;
};

export type Workflow = {
  name?: string;
  nodes: WorkflowNode[];
  connections: ConnectionMap;
  settings?: Record<string, unknown>;
  pinData?: unknown;
  active?: boolean;
  tags?: unknown;
  [key: string]: unknown;
};

export type Issue = {
  ruleId: string;
  severity: ActiveSeverity;
  nodeName?: string;
  message: string;
};

export type RuleContext = {
  severity: ActiveSeverity;
};

export type Rule = {
  id: string;
  description: string;
  defaultSeverity: ActiveSeverity;
  check(workflow: Workflow, context: RuleContext): Issue[];
};

export type RuleConfig = Record<string, Severity>;

export type FileLintResult = {
  path: string;
  issues: Issue[];
};

export type SkippedFile = {
  path: string;
  message: string;
};

export type LintSummary = {
  errors: number;
  warnings: number;
  files: number;
};

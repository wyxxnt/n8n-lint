n8n-lint is a CI-friendly linter that catches risky n8n workflow JSON patterns before they ship.

## Quick start

Run without installing:

```sh
npx n8n-lint ./workflows
```

Install globally:

```sh
npm install -g n8n-lint
n8n-lint ./workflows
```

## Usage

```sh
n8n-lint <path...>
```

`<path...>` accepts JSON files or directories. Directories are scanned recursively for `*.json`.

Flags:

| Flag | Description |
| --- | --- |
| `--json` | Print machine-readable JSON only on stdout. |
| `--config <file>` | Use a specific config file instead of `.n8nlintrc.json` in the current directory. |
| `--quiet` | Show errors only in the default text reporter. |
| `--max-warnings <n>` | Exit with code `1` when warnings exceed `n`. |

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | No error-severity issues, and warnings did not exceed `--max-warnings`. |
| `1` | At least one error-severity issue, or warnings exceeded `--max-warnings`. |
| `2` | Bad input or an unexpected crash. |

## Rules

| Rule | Default | What it catches |
| --- | --- | --- |
| `no-retry` | `warn` | HTTP, database, and Code nodes without `retryOnFail`, `continueOnFail`, or `onError:"continueErrorOutput"`. |
| `hardcoded-secret` | `error` | Literal secrets in node parameters, including API keys, bearer tokens, password/token-like fields, OpenAI-style keys, and Google API keys. Secret values are never printed. |
| `missing-timeout` | `warn` | HTTP Request nodes without `parameters.options.timeout`. |
| `unauthenticated-webhook` | `error` | Webhook nodes with `parameters.authentication` unset or set to `none`. |
| `orphan-node` | `warn` | Non-disabled, non-trigger nodes that are not reachable from any trigger node. |
| `unbounded-loop` | `warn` | Split In Batches loops that reach HTTP or AI/LLM work without a batch size limit. |
| `pinned-data` | `warn` | Non-empty `pinData` that may include test data by accident. |
| `missing-error-workflow` | `warn` | Workflows with failure-prone nodes but no `settings.errorWorkflow` and no Error Trigger node. |

## Config

Create `.n8nlintrc.json` in the current directory, or pass it with `--config`.

```json
{
  "rules": {
    "missing-timeout": "error",
    "orphan-node": "off",
    "pinned-data": "warn"
  }
}
```

Unknown rule ids are warned about and ignored.

## JSON output

```sh
n8n-lint ./workflows --json
```

```json
{
  "files": [
    {
      "path": "/absolute/path/workflow.json",
      "issues": [
        {
          "ruleId": "missing-timeout",
          "severity": "warn",
          "nodeName": "Fetch User",
          "message": "HTTP Request node is missing parameters.options.timeout."
        }
      ]
    }
  ],
  "summary": {
    "errors": 0,
    "warnings": 1,
    "files": 1
  }
}
```

## GitHub Actions

```yaml
name: lint n8n workflows

on:
  pull_request:
  push:
    branches: [main]

jobs:
  n8n-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx n8n-lint ./workflows --max-warnings 0
```

# _masterplan

The single source of truth for **Fitme**. Everything decided before code lives here.
When code and this directory disagree, this directory takes precedence and code must align to it.

## Masterplan Directory Structure

| Folder | Contents | Audience |
| :--- | :--- | :--- |
| `product/` | Product vision, core value pillars, V1 features (P0/P1), and post-V1 backlog | Product owner & planner |
| `architecture/` | Tech stack, cloud topology, folder organization, Bedrock LLM contracts | Planner & agents |
| `data-structures/` | Zod domain schemas, DynamoDB single-table keys, and wire formats | Planner & agents (shapes authority) |
| `design/` | **The Briefs (`00-*.md` to `12-*.md`)**: self-contained tasks for AI coding agents | Coding agents (Flash/Sonnet) |
| `mcp/` | App MCP server specification (`/api/mcp`) for external LLM clients | Planner & agents |
| `aws/` | Cognito setup, DynamoDB table specs, IAM policies, Amplify deployment runbook | Cloud deploy sessions |
| `testing/` | Vitest and Playwright test plan by feature ID | QA & CI validation |

## Execution Flow

```
product/ (what & why) ──► data-structures/ & architecture/ (contracts & shapes)
                                  │
                                  ▼
                         design/NN-<brief>.md (one discrete task)
                                  │
                       Coding Agent builds brief ──► npm run check passes ──► git commit
```


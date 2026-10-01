# AI RUNTIME / KNOWLEDGE BACKEND AUDIT

Production contains AI backend tables:
- `ai_agent_configs`
- `ai_agent_runs`
- `ai_agent_steps`
- `ai_agent_nodes`
- `ai_agent_edges`
- `ai_agent_workflows`
- `ai_agent_workflow_steps`
- `ai_knowledge_documents`
- `ai_knowledge_chunks`
- `local_ai_runtime_config`

Active Edge Function:
- `local-safety-ai`

Database search/matching functions:
- `match_ai_knowledge`
- `match_ai_knowledge_text`
- `hse_data_assistant`

The current visible HSE Operational Assistant is intentionally read-only.

## Required rule
Do not expose autonomous write-capable agents to production HSE records merely because agent tables exist.

## If administration UI is retained/created
Admin-only controls:
- AI runtime status
- model/provider configuration without exposing secrets
- knowledge-source ingestion status
- indexed document list
- run history
- step diagnostics
- read-only assistant policy
- permission-scoped grounding
- audit logs
- failure/timeout state

Any future write/action agent must use explicit approval gates and normal HSE RBAC/workflow controls.

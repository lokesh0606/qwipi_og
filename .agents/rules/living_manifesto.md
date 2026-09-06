# Living Manifesto & Continuous Runbook Rule

> **Scope**: Strict operational invariant for all Antigravity and AI coding agents operating on the Qwipi workspace.

## MANDATORY AGENT INVARIANT: Update AGENTS.md and SKILLS.md in EVERY Conversation

Whenever you make changes, bugfixes, refactorings, or feature implementations to this repository:

1. **Before Concluding Any Task or Conversation**:
   - You **MUST** check if your changes affected system behavior, data contracts, routes, hooks, configurations, or operational workflows.
   - Update **`AGENTS.md`**:
     - Keep the repository topography map current.
     - Document any changes to data contracts (ORM models, Pydantic schemas, TypeScript types).
     - Add or refine non-negotiable architectural invariants in Section 5.
   - Update **`SKILLS.md`**:
     - Keep the Master Skill Map up to date.
     - Add or refine procedural runbooks (SOPs) for any newly introduced or modified capabilities.
   - Update relevant files in **`.agents/skills/`**:
     - `qwipi-navigation/SKILL.md`
     - `qwipi-verification/SKILL.md`
     - `qwipi-chat-streaming/SKILL.md`

2. **Git Synchronization Standard**:
   - Always commit updates to `AGENTS.md` and `SKILLS.md` alongside code changes.
   - Remote: `https://github.com/lokesh0606/qwipi_og.git`
   - Branch: `main`
   - Author: `LOKESH KANKALAPATI <lokeshkankalapati06@gmail.com>`
   - Never stage `.env` or credential files.

# Living Manifesto & Continuous Runbook Rule

> **Scope**: Strict operational invariant for all AI coding agents operating on the Qwipi workspace.

## MANDATORY AGENT INVARIANT: Synchronize Documentation in EVERY Session

Whenever you introduce code modifications, bugfixes, refactorings, or feature implementations:

1. **Before Concluding Any Task or Turn**:
   - Audit whether changes affected contracts, endpoints, hooks, state, database models, or CLI commands.
   - Update **`AGENTS.md`**:
     - Keep the key file topography map accurate.
     - Document any changes to data contracts (ORM models, Pydantic schemas, TypeScript interfaces).
     - Add or refine non-negotiable architectural invariants in Section 5.
   - Update **`SKILLS.md`**:
     - Keep the Master Skills Catalog accurate.
     - Add or update procedural SOPs for new or modified features.
   - Update relevant files in **`.agents/skills/`**:
     - `qwipi-navigation/SKILL.md`
     - `qwipi-verification/SKILL.md`
     - `qwipi-chat-streaming/SKILL.md`

2. **Git Synchronization Protocol**:
   - Always commit documentation updates alongside code modifications.
   - Remote: `https://github.com/lokesh0606/qwipi_og.git`
   - Branch: `main`
   - Author: `LOKESH KANKALAPATI <lokeshkankalapati06@gmail.com>`
   - Strictly verify `.gitignore` enforcement before committing; never stage `.env` or secrets.

# WCPool AI Team Workflow

This `.ai/` folder contains the full operating system for working on WCPool with an AI assistant — personas, context files, and the master orchestrator prompt.

---

## Folder Map

```
.ai/
  agents/          ← 13 agent persona files (one per specialist)
  context/         ← Ground truth about the product, tech, i18n, and QA
  prompts/         ← The master orchestrator prompt that activates the team
```

---

## Read This First

Start here: [`prompts/wcpool-master-orchestrator-prompt.md`](prompts/wcpool-master-orchestrator-prompt.md)

It is the bootstrap prompt that wires everything together — team mission, agent routing, guardrails, response modes, and a copy-pasteable activation sentence.

---

## Context Files

These four files are the shared ground truth every agent works from:

| File | What it covers |
|---|---|
| [`context/product-context.md`](context/product-context.md) | Users, scope, principles, non-goals, roadmap themes |
| [`context/technical-context.md`](context/technical-context.md) | Architecture, auth, DB, realtime, PWA, i18n, guardrails |
| [`context/localization-rules.md`](context/localization-rules.md) | i18n rules — canonical names, `t()`, `localTeamName()`, QA requirements |
| [`context/qa-regression-checklist.md`](context/qa-regression-checklist.md) | Full regression checklist — views, states, mobile, locales |

---

## Agent Files

Read these in order for a full picture of the team. Each file has the persona's role, responsibilities, and a copy-pasteable prompt template.

| # | File | Agent | Role |
|---|---|---|---|
| 00 | [`agents/00-team-operating-system.md`](agents/00-team-operating-system.md) | Team OS | Core rules, routing table, done criteria |
| 01 | [`agents/01-aria-product-manager.md`](agents/01-aria-product-manager.md) | Aria Vega | Product Manager |
| 02 | [`agents/02-mateo-tech-lead.md`](agents/02-mateo-tech-lead.md) | Mateo Ríos | Tech Lead |
| 03 | [`agents/03-noa-staff-frontend.md`](agents/03-noa-staff-frontend.md) | Noa Kim | Staff Frontend Engineer |
| 04 | [`agents/04-ivan-platform-engineer.md`](agents/04-ivan-platform-engineer.md) | Ivan Petrov | Platform Engineer (Supabase, infra) |
| 05 | [`agents/05-lina-ux-designer.md`](agents/05-lina-ux-designer.md) | Lina Morales | UX Designer |
| 06 | [`agents/06-sofia-localization-lead.md`](agents/06-sofia-localization-lead.md) | Sofia Tanaka | Localization Lead |
| 07 | [`agents/07-darius-qa-lead.md`](agents/07-darius-qa-lead.md) | Darius Osei | QA Lead |
| 08 | [`agents/08-mira-security-engineer.md`](agents/08-mira-security-engineer.md) | Mira Shen | Security Engineer |
| 09 | [`agents/09-owen-docs-lead.md`](agents/09-owen-docs-lead.md) | Owen Walsh | Docs Lead |
| 10 | [`agents/10-rhea-release-manager.md`](agents/10-rhea-release-manager.md) | Rhea Patel | Release Manager |
| 11 | [`agents/11-eli-data-analyst.md`](agents/11-eli-data-analyst.md) | Eli Torres | Data Analyst |
| 12 | [`agents/12-priya-scrum-chief-of-staff.md`](agents/12-priya-scrum-chief-of-staff.md) | Priya Nair | Chief of Staff / Delivery Manager |
| 13 | [`agents/13-agent-skills-recommendations.md`](agents/13-agent-skills-recommendations.md) | — | Tool and skills recommendations per agent |

**Start with Priya (12) for any new request** — she routes to the right specialists.

---

## How to Use This in Claude Code

Paste this sentence at the start of any new Claude session to activate the full team:

```
Read and follow the WCPool AI team workflow from .ai/prompts/wcpool-master-orchestrator-prompt.md before responding to anything.
```

That one line loads the orchestrator, which then directs Claude to read the context files and persona files in order.

### Tips

- For a quick single-agent response, paste the relevant persona's **Prompt Template** section directly.
- For complex features or anything touching auth/realtime/release, use the full orchestrator — it enforces the right review chain.
- The orchestrator handles routing automatically: just describe the task and it will route through Priya first, then the appropriate specialists.

---

## Recommended Review Order (new contributor)

If you're reading this for the first time:

1. [`prompts/wcpool-master-orchestrator-prompt.md`](prompts/wcpool-master-orchestrator-prompt.md) — understand the team's operating model
2. [`agents/00-team-operating-system.md`](agents/00-team-operating-system.md) — understand the rules all agents follow
3. [`context/product-context.md`](context/product-context.md) — understand what WCPool is and isn't
4. [`context/technical-context.md`](context/technical-context.md) — understand the architecture and guardrails
5. [`context/localization-rules.md`](context/localization-rules.md) — understand the i18n requirements
6. The persona files in numeric order (01–13)

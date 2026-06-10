# WCPool AI Team Operating System

Use these agents as a software company team for WCPool. Every meaningful prompt, feature, bug, refactor, release, and doc update should be reviewed by the relevant agents before implementation.

## Core Rules

1. No hardcoded product behavior without Product + Engineering review.
2. No user-facing copy ships without Product + Localization review.
3. No feature ships without QA sign-off.
4. No schema, auth, routing, or security change ships without Platform review.
5. No visual/UI change ships without Design review.
6. No documentation-affecting change ships without Docs review.
7. Any feature touching scores, allocation, or eliminations requires Product, Engineering, and QA review together.

## Default Workflow

### For a new feature
- Product Manager defines the user problem, scope, success criteria, and non-goals.
- Tech Lead proposes implementation shape, risks, and affected systems.
- UX Designer reviews flow, language, and edge cases.
- Localization Lead checks all user-facing strings and locale implications.
- Platform Engineer reviews auth, data, realtime, deployment, and migration impact.
- QA Lead writes acceptance criteria, test matrix, and regression checklist.
- Docs Lead updates README, DEVELOPMENT.md, and user/admin guides if needed.

### For a bug
- QA reproduces and writes exact failure conditions.
- Tech Lead identifies root cause area.
- Relevant engineer proposes the smallest safe fix.
- QA validates fix and regression surface.
- Docs updates only if behavior or workflow changed.

### For a polish pass
- Product checks user value.
- UX checks clarity and consistency.
- Frontend Engineer checks implementation safety.
- QA checks breakpoints, states, and regressions.
- Localization checks any copy changes.

## Prompt Routing

Use these agents by default:

| Work type | Agents |
|---|---|
| New feature | Product, Tech Lead, UX, Frontend/Platform, QA, Docs |
| Bug fix | QA, Tech Lead, relevant engineer |
| UI polish | UX, Frontend, QA, Localization |
| Auth / DB / realtime | Platform, Tech Lead, QA, Security |
| i18n / copy | Product, Localization, QA, Docs |
| Release | Product, QA, Docs, Platform |

## Done Criteria

A task is done only when:
- Scope is clear.
- Edge cases are listed.
- Implementation is reviewed by the right engineering owner.
- QA acceptance criteria pass.
- Localization is complete for en-US, es-MX, pt-PT.
- Docs are updated if behavior changed.

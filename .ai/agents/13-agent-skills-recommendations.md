# Agent Skills Recommendations for Perplexity and VS Code

This team will work best if both environments have a shared minimum toolset.

## Recommended Skills for Perplexity

Install or enable these when available:

| Skill | Why it matters |
|---|---|
| website-building | Critical for UI, SPA, PWA, responsive design, interaction quality |
| doc | Critical for README, DEVELOPMENT.md, changelogs, user guides |
| chart | Useful for metrics, standings, QA dashboards, and release visuals |
| xlsx | Useful if exports, admin imports, or structured bulk operations are added |
| slides | Useful for roadmap, stakeholder updates, and launch reviews |

## Recommended Capabilities in VS Code / Claude

Use extensions or workflows that support:
- Git diff awareness.
- Repo-wide search and refactor.
- Markdown preview.
- JSON and SQL linting.
- TypeScript support for Supabase Edge Functions.
- ESLint / Prettier or equivalent formatting.
- Playwright or Cypress if browser automation is added.
- REST client or Supabase CLI support.

## Strongly Recommended VS Code Extensions

- GitLens
- ESLint
- Prettier
- Markdown All in One
- Error Lens
- SQLTools
- Tailwind CSS IntelliSense (if Tailwind is adopted later)
- Playwright Test for VS Code (if end-to-end tests are added)
- Thunder Client or REST Client

## Agent-to-Skill Mapping

| Agent | Best skills / tools |
|---|---|
| Aria (Product) | doc, slides |
| Mateo (Tech Lead) | website-building, doc, repo search, git diff |
| Noa (Frontend) | website-building, CSS/HTML/JS tooling, responsive preview |
| Ivan (Platform) | TypeScript, SQL, Supabase CLI, REST client |
| Lina (UX) | website-building, image/reference browsing, responsive preview |
| Sofia (Localization) | repo search, markdown/doc, string diff workflows |
| Darius (QA) | browser testing tools, screenshots, Playwright/Cypress |
| Mira (Security) | repo search, auth/RLS review tooling, REST client |
| Owen (Docs) | doc, markdown preview, git diff |
| Rhea (Release) | git history, deployment logs, QA checklists |
| Eli (Data) | chart, xlsx, spreadsheet/data tools |
| Priya (Delivery) | doc, issue templates, kanban/board workflows |

## Team Operating Recommendation

For every meaningful prompt:
1. Start with Priya to route the request.
2. Bring in Aria if the work affects product behavior.
3. Bring in Mateo for technical framing.
4. Bring in the relevant implementer agent.
5. Always run Darius before ship.
6. Run Sofia for any copy/UI/string change.
7. Run Owen when behavior, setup, or workflow changes.
8. Run Rhea for final ship readiness.

## Minimal Review Matrix

| Change type | Required agents |
|---|---|
| New UI feature | Priya, Aria, Mateo, Noa, Lina, Sofia, Darius, Owen |
| Backend/platform | Priya, Mateo, Ivan, Mira, Darius, Owen |
| Bug fix | Priya, Mateo, relevant engineer, Darius |
| Copy/i18n | Priya, Aria, Sofia, Darius, Owen |
| Release | Rhea, Darius, Owen, relevant owners |

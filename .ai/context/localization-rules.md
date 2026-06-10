# WCPool Localization Rules

## Supported Locales

WCPool must support these locales at all times:
- `en-US` — US English
- `es-MX` — Mexican Spanish
- `pt-PT` — Portugal Portuguese

No feature is complete if any user-facing string is missing in one of these locales.

## Core Rules

### 1. No hardcoded user-facing strings
All user-visible UI text must go through the translation system:
- `t('key')`
- `t('key', ...args)` for interpolated or count-based text

Never add raw strings directly in rendered UI when they should be localized.

### 2. Canonical team names stay in Spanish
Internally and in the database, team names remain in canonical Spanish.

Examples:
- comparisons
- elimination state
- allocation storage
- payload data
- DB writes

These must continue to use the Spanish canonical name.

### 3. Displayed team names must be localized
Whenever a team name is shown to the user, it must use:
- `localTeamName(nameEs)`

Never display canonical Spanish team names directly in non-Spanish locales.

### 4. New features must add all locale keys before shipping
If a feature introduces:
- a new button label
- a modal title
- a tooltip
- an error message
- a status label
- a confirmation string
- a helper sentence

then all three locale objects must be updated in the same change.

## Translation Implementation Rules

### String keys
Prefer concise, stable keys that describe purpose, not wording.

Good examples:
- `createPoolBtn`
- `failedSaveAlloc`
- `shareViewerLink`

Avoid vague or overly broad keys.

### Function-valued translations
Use functions for:
- counts
- interpolation
- plural-sensitive phrases
- dynamic helper lines

Examples:
- count helpers
- delete confirmations with pool titles
- alive/eliminated counts

### Fallback behavior
- Default fallback is `en-US`
- Missing keys should be treated as implementation debt and fixed quickly
- Do not rely on fallback as a permanent shipping solution

## UX Rules for Localization

### Length awareness
Some strings will expand in Spanish or Portuguese. Review:
- mobile headers
- buttons
- chips
- inline controls
- helper text
- status badges

Localization review must include layout fit, not just translated text.

### Natural phrasing over literal translation
Use wording that feels natural to users in each locale. Avoid awkward word-for-word translation when a cleaner local phrase exists.

### Preserve meaning consistently
If a label means “viewer” in one locale, do not shift it to “spectator” or “public mode” elsewhere unless intentionally designed.

## QA Requirements for Localization

Every feature with UI changes must be checked for:
- all keys present in `en-US`, `es-MX`, `pt-PT`
- no mixed-language screens
- no overflow or broken mobile layouts
- no untranslated team names
- correct dynamic interpolation
- correct locale persistence after refresh/navigation

## Required Review Triggers

Bring in Localization review when a task changes:
- UI copy
- new screens or sections
- team-name display
- export text
- WhatsApp copy
- error or success messaging
- empty states
- onboarding or invite flows

## Future Rule

For all future WCPool work:
- Product defines copy intent
- Engineering wires keys through `t()`
- Localization validates all locales
- QA verifies all locale behavior before ship

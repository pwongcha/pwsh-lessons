# Working Notes

## Learner profile
- Near-zero PowerShell. Windows GUI user. Keep terminal anxiety low — explain what to click/type.
- Has Control Center access; NO API credentials yet → lesson 03 must teach creating a Basic API client.
- Prefers short, quick lessons.
- Uses Akamai daily via the UI, so Akamai domain concepts (property, config, hostname, activation) are familiar — it's the *shell* that's new. Lean on this: map each cmdlet to the UI screen it replaces.

## Teaching preferences
- Every lesson must carry Akamai branding (shared stylesheet `assets/course.css`).
- Model after https://powershell.aka-dev.net/ in spirit: practical, use-case-driven, Windows-first. (Site returns 403 to fetch — could not inspect directly.)
- Offline-first for early lessons: practice parsing/filtering real Akamai JSON without needing credentials.
- Mark any write/activate step clearly as "staging first, production later."

## Curriculum (chosen: Guided operations track)
1. PowerShell primer — pipeline, objects, Get-Help, filtering, JSON      [0001 — DONE]
2. Install the Akamai module + verify PowerShell version                [0002 — DONE]
3. First-time setup: create API client, .edgerc, sections, account switch  [0003 — DONE]
4. Verify auth: your first real API call (base IDs: account/contract/group/product)  [0004 — DONE]
5. Find a property (search + list + inspect versions/rules)              [0005 — DONE]
   NB: module uses Get-PropertyRules (not Get-PropertyRuleTree) for the rule tree.
6. Update a property (new version, edit rule, activate to staging)       [0006 — DONE]
   Update-PropertyRule uses -Path (JSON Pointer) + -Value; Set-PropertyRules for whole tree.
   Warning-acknowledge param name varies by module version — lesson flags this.
7. Add a hostname to a security config                                  [0007 — DONE]
   Add-AppSecSelectedHostnames takes -Body @{hostnameList=@(@{hostname='x'})} (no -Hostnames).
   New-AppSecConfigurationVersion returns .version; New-AppSecActivation uses -NotificationEmails
   + -AcknowledgedInvalidHosts. Concept split: selected hostnames (pool) vs match target (routes to policy).
8. Review a custom rule + its action                                    [0008 — DONE]
   Two halves: Get-AppSecCustomRule = definition (operator + conditions, config-level, no version param);
   Get-AppSecPolicyCustomRule = per-policy action (alert/deny/deny_custom_{id}/none).
   Set-AppSecPolicyCustomRule -Action changes just the action.
9. View a client list (items, tags, activation status)                  [0009 — DONE]
   Get-ClientListActivationStatus uses -Environment (not -Network). Status MODIFIED = unreleased edits.
   Client lists version + activate independently of security configs (key selling point).
10. Update a client list + IAM/IDM basics                               [0010 — DONE]
    New-ClientListActivation uses -Network; Get-ClientListActivationStatus uses -Environment (quirk).
    Get-IAMUser -UIIdentityID; New-IAMUser -Body @{...authGrants=@(@{groupId;roleId})} -SendEmail.

=== ALL 10 PLANNED LESSONS COMPLETE (2026-08-31). Course finale in 0010 includes
    mission recap table + communities + "next topics" (prod activation, reusable functions, CLI/Terraform). ===

index.html at workspace root = course home / TOC (grouped, tagged read-only vs writes).
Every lesson footer nav: prev link + "☰ All lessons" (index) + next link. Cheat sheet footer links index too.
When adding lesson 11+: add a row to index.html and fix the lesson-10 nav "next".

=== MkDocs Material port (mkdocs/) — FULL conversion done 2026-08-31 ===
- All 10 lessons + cheat-sheet/glossary/resources converted to Markdown under mkdocs/docs/.
- Static HTML version (lessons/, index.html, reference/) still intact — the two are parallel.
- Quiz widget: raw-HTML .quiz blocks + docs/javascripts/quiz.js (hooks Material's document$).
- Progress: docs/javascripts/progress.js, localStorage KEY "ps101:progress:v1",
  each lesson ends with <div id="lesson-meta" data-slug="NN-..." hidden>; index.md wraps intro in <div id="course-home">.
- Branding: docs/stylesheets/akamai.css maps --ak-* onto Material --md-* tokens. Approx palette.
- `mkdocs build --strict` passes clean. Run: cd mkdocs && .venv/bin/mkdocs serve
- When editing a lesson: change BOTH the .html and the .md, or pick one as source of truth.
- Deploy: mkdocs build -> site/ -> Caddy static root on a Linode; Akamai property in front. See mkdocs/README.md.

## Branding palette (APPROXIMATION — confirm before external use)
- Akamai blue:      #0090FF
- Deep navy ink:    #12161C
- Slate text:       #3B4652
- Surface:          #FFFFFF / #F5F7FA
- Accent gradient:  linear-gradient(120deg, #0090FF, #6E56CF)
- Success green:    #1A7F52   Warning amber: #B26B00   Danger red: #C6392F
- Font: system UI stack; mono: ui-monospace / Cascadia Code / Consolas

## Open questions for the user
- Which Windows PowerShell will they use — built-in 5.1, or install PowerShell 7? (Recommend 7.)
- Do they want lessons to also cover the Akamai CLI equivalent, or PowerShell only? (Assuming PowerShell only per mission.)

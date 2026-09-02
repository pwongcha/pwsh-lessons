---
hide:
  - navigation
---

<div id="course-home" markdown>

Operate Akamai from a Windows shell. Twelve short lessons: install and authenticate,
manage TLS certificates, find and change properties, wire hostnames into security
configs, manage client lists and custom rules, and administer users — all from
PowerShell.

[Start with Lesson 01](lessons/01-powershell-primer.md){ .md-button .md-button--primary }
[Cheat sheet](reference/cheat-sheet.md){ .md-button target="_blank" rel="noopener" }


**Tags:** :material-lock-open-variant: *read-only* = safe to run anywhere ·
:material-pencil: *writes · staging* = makes changes, stops at the staging network.

Version 1.0.0 · [what's changed](changelog.md)
{ .ak-home-version }

</div>

## Get started

<div class="grid cards" markdown>

-   :material-numeric-1-box:{ .lg } __PowerShell primer__

    ---

    The five ideas you need before touching the module: cmdlets, the pipeline,
    objects, `Get-Help`, and JSON — practised on a real Akamai response.

    [:octicons-arrow-right-24: Start lesson 01](lessons/01-powershell-primer.md) <span class="ak-card-foot">:material-timer-outline: ~12 min &nbsp; :material-lock-open-variant: no credentials</span>

-   :material-numeric-2-box:{ .lg } __Install the Akamai module__

    ---

    Check your PowerShell version, install from the Gallery, load and verify —
    the TLS fix, the v1 cleanup, the unapproved-verbs warning.

    [:octicons-arrow-right-24: Lesson 02](lessons/02-install-the-module.md) <span class="ak-card-foot">:material-timer-outline: ~10 min &nbsp; :material-lock-open-variant: no credentials</span>

-   :material-numeric-3-box:{ .lg } __Create an API client & set up `.edgerc`__

    ---

    Turn Control Center access into credentials, store them safely, make your
    first authenticated call. Sections and account switching.

    [:octicons-arrow-right-24: Lesson 03](lessons/03-api-client-and-edgerc.md) <span class="ak-card-foot">:material-timer-outline: ~15 min &nbsp; :material-lock-open-variant: Control Center login</span>

-   :material-numeric-4-box:{ .lg } __Map your account: contracts, groups, products__

    ---

    The IDs every later cmdlet asks for — how they nest, how to pull them once,
    and how to never type them by hand.

    [:octicons-arrow-right-24: Lesson 04](lessons/04-account-base-ids.md) <span class="ak-card-foot">:material-timer-outline: ~12 min &nbsp; :material-lock-open-variant: read-only</span>

</div>

## Certificates

<div class="grid cards" markdown>

-   :material-numeric-5-box:{ .lg } __Inspect and update a certificate__

    ---

    Read an enrollment's SANs, issuer, and per-network expiry; add a SAN and
    walk the change through CPS's gates to staging.

    [:octicons-arrow-right-24: Lesson 05](lessons/05-inspect-and-update-a-certificate.md) <span class="ak-card-foot">:material-timer-outline: ~16 min &nbsp; :material-pencil: writes · staging</span>

</div>

## Property Manager

<div class="grid cards" markdown>

-   :material-numeric-6-box:{ .lg } __Find a property and read its state__

    ---

    Search by name or hostname, then pull version status, hostnames, activation
    history, and the rule tree.

    [:octicons-arrow-right-24: Lesson 06](lessons/06-find-a-property.md) <span class="ak-card-foot">:material-timer-outline: ~15 min &nbsp; :material-lock-open-variant: read-only</span>

-   :material-numeric-7-box:{ .lg } __Update a property: new version → edit → activate__

    ---

    The safe workflow: clone a version, change a rule two ways, validate,
    activate to staging, poll to `ACTIVE`.

    [:octicons-arrow-right-24: Lesson 07](lessons/07-update-a-property.md) <span class="ak-card-foot">:material-timer-outline: ~18 min &nbsp; :material-pencil: writes · staging</span>

</div>

## Application Security

<div class="grid cards" markdown>

-   :material-numeric-8-box:{ .lg } __Add a hostname to a security configuration__

    ---

    Clone a config version, add the hostname to the selected set, confirm a
    policy evaluates it, activate to staging.

    [:octicons-arrow-right-24: Lesson 08](lessons/08-add-hostname-to-security-config.md) <span class="ak-card-foot">:material-timer-outline: ~18 min &nbsp; :material-pencil: writes · staging</span>

-   :material-numeric-9-box:{ .lg } __Review a custom rule and its action__

    ---

    Read what a rule matches, find what each policy does when it matches, and
    build a review table with a verdict per rule.

    [:octicons-arrow-right-24: Lesson 09](lessons/09-review-custom-rule-action.md) <span class="ak-card-foot">:material-timer-outline: ~15 min &nbsp; :material-lock-open-variant: read-only</span>

</div>

## Client Lists

<div class="grid cards" markdown>

-   :material-numeric-10-box:{ .lg } __View a client list__

    ---

    Find your lists, read their entries, check tags and expiry, and see exactly
    what's live on staging vs production.

    [:octicons-arrow-right-24: Lesson 10](lessons/10-view-a-client-list.md) <span class="ak-card-foot">:material-timer-outline: ~12 min &nbsp; :material-lock-open-variant: read-only</span>

-   <span class="ak-num lg">11</span> __Update a client list__

    ---

    The lowest-friction change on the platform — edit a list and activate just
    the list. No config or property version needed.

    [:octicons-arrow-right-24: Lesson 11](lessons/11-update-a-client-list.md) <span class="ak-card-foot">:material-timer-outline: ~12 min &nbsp; :material-pencil: writes · staging</span>

</div>

## Identity

<div class="grid cards" markdown>

-   <span class="ak-num lg">12</span> __IAM / IDM basics__

    ---

    A working tour of Identity & Access Management from the shell — users, roles,
    and groups — plus an access audit you can run today.

    [:octicons-arrow-right-24: Lesson 12](lessons/12-iam-idm-basics.md) <span class="ak-card-foot">:material-timer-outline: ~10 min &nbsp; :material-pencil: writes · staging</span>

</div>

## Reference — keep these open

<div class="grid cards" markdown>

-   __Cheat sheet__

    PowerShell core + a task → cmdlet map for all eight use cases. Prints to ~2 pages.

    [:octicons-arrow-right-24: Open](reference/cheat-sheet.md){ target="_blank" rel="noopener" }

-   __Glossary__

    Canonical terms used across every lesson.

    [:octicons-arrow-right-24: Open](glossary.md){ target="_blank" rel="noopener" }

-   __Resources__

    Trusted sources for knowledge and communities.

    [:octicons-arrow-right-24: Open](resources.md){ target="_blank" rel="noopener" }

</div>


---


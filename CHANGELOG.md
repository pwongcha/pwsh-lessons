# Changelog

All notable changes to the **Akamai PowerShell Lessons** are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
a **minor** bump adds a lesson or reference page, a **patch** bump corrects or
revises existing content, and a **major** bump restructures the course.

Only reader-visible changes are listed. Build, deploy, and tooling changes live in
the git history.

## [1.0.0] - 2026-09-01

### Added

- Twelve use-case lessons, grouped into six tracks:
  - **Get started** — PowerShell primer, installing the Akamai module, creating an
    API client and `.edgerc`, mapping account base IDs (contracts, groups, products).
  - **Certificates** — inspect an enrollment and add a SAN through CPS to staging.
  - **Property Manager** — find a property and read its state; the safe
    new-version → edit → activate workflow.
  - **Application Security** — add a hostname to a security configuration; review a
    custom rule and its per-policy action.
  - **Client Lists** — view a client list; update and activate one on its own.
  - **Identity** — an IAM / IDM tour from the shell, with an access audit.
- Reference section: a printable cheat sheet (PowerShell core plus a task → cmdlet
  map), a glossary of canonical terms, and a curated resources page.
- Per-lesson reading timer, a graded quiz widget, and per-browser completion
  tracking with a progress summary on the home page.

[Unreleased]: https://github.com/pwongcha/pwsh-lessons/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/pwongcha/pwsh-lessons/releases/tag/v1.0.0

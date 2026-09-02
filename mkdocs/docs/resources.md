# Resources

Trusted sources behind this course.  Knowledge for the lessons is drawn from
here — not from parametric guesses.

## Knowledge

### PowerShell fundamentals

- [Microsoft — PowerShell 101](https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/01-getting-started)
  — the canonical beginner course.  Cmdlets, the pipeline, objects, `Get-Help`,
  `Get-Member`, filtering.  Primary source for Lesson 01.
- [Microsoft — About Pipelines](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_pipelines)
  — how objects flow between commands.
- [Microsoft — Everything about hashtables (splatting)](https://learn.microsoft.com/en-us/powershell/scripting/learn/deep-dives/everything-about-hashtable)
  — splatting long Akamai parameter lists with `@params`.
- [Microsoft — ConvertFrom-Json](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/convertfrom-json)
  — turning Akamai JSON responses into objects you can filter.
- [Microsoft — Installing PowerShell on Windows](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows)
  — Windows PowerShell 5.1 vs PowerShell 7; how to install 7.

### Akamai PowerShell module

- [Akamai PowerShell — Overview](https://techdocs.akamai.com/powershell/docs/overview)
  — install, PS 5.1+ requirement, submodule architecture, v1→v2 incompatibility.
- [Akamai PowerShell — Authentication](https://techdocs.akamai.com/powershell/docs/authentication.md)
  — Basic API client, `.edgerc` format, `-EdgeRCFile`, `-Section`, env vars,
  account switching.  Primary source for Lesson 03.
- [Akamai PowerShell — Get Started index](https://techdocs.akamai.com/powershell/docs/get-started/llms.txt)
  — overview, base IDs, version mapping, error handling & options, commands & help.
- [Akamai PowerShell — Commands and help](https://techdocs.akamai.com/powershell/docs/commands-help.md)
  — verb-noun naming, `Get-Help -Full/-Examples/-Online`, unapproved-verbs warning.
- [akamai/PowerShell on GitHub](https://github.com/akamai/PowerShell) — source, issues, release notes.
- [PowerShell Gallery — Akamai](https://www.powershellgallery.com/packages/Akamai) — current version, submodule list.

### Akamai product API docs (behaviour behind the cmdlets)

- [Property Manager API (PAPI)](https://techdocs.akamai.com/property-mgr/reference/api)
- [Application Security API](https://techdocs.akamai.com/application-security/reference/api)
- [Client Lists API](https://techdocs.akamai.com/client-lists/reference/api)
- [Identity & Access Management API](https://techdocs.akamai.com/iam-user-admin/reference/api)

## Communities

- [Akamai Community — Developer / API forum](https://community.akamai.com/)
  — official, Akamai-staffed.  Module bugs, auth issues, "is this the right
  cmdlet" questions.
- [akamai/PowerShell GitHub Issues](https://github.com/akamai/PowerShell/issues)
  — report broken cmdlets, check known issues before you burn an hour.



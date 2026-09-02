# PowerShell 101 for Akamai API — Resources

## Knowledge

### PowerShell fundamentals
- [Microsoft: PowerShell 101 (scripting/learn)](https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/01-getting-started)
  The canonical beginner course from Microsoft. Use for: cmdlets, the pipeline, objects, `Get-Help`, `Get-Member`, filtering. Primary source for lesson 01.
- [Microsoft: About Pipelines](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_pipelines)
  Use for: how objects flow between commands.
- [Microsoft: Everything you wanted to know about hashtables (splatting)](https://learn.microsoft.com/en-us/powershell/scripting/learn/deep-dives/everything-about-hashtable)
  Use for: splatting long Akamai parameter lists with `@params`.
- [Microsoft: ConvertFrom-Json](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/convertfrom-json)
  Use for: turning Akamai JSON responses into objects you can filter.
- [Microsoft: Installing PowerShell on Windows](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows)
  Use for: Windows PowerShell 5.1 vs PowerShell 7; how to install 7.

### Akamai PowerShell module
- [Akamai PowerShell — Overview](https://techdocs.akamai.com/powershell/docs/overview)
  Use for: install (`Install-Module Akamai`), PS 5.1+ requirement, submodule architecture, v1→v2 incompatibility.
- [Akamai PowerShell — Authentication](https://techdocs.akamai.com/powershell/docs/authentication.md)
  Use for: creating a Basic API client in Control Center, `.edgerc` format, `-EdgeRCFile`, `-Section`, env vars, `Get-AccountSwitchKey` / `-AccountSwitchKey`. Primary source for lesson 03.
- [Akamai PowerShell — Get Started section index](https://techdocs.akamai.com/powershell/docs/get-started/llms.txt)
  Use for: overview, base IDs, version mapping, error handling & options, commands & help.
- [Akamai PowerShell — Commands and help](https://techdocs.akamai.com/powershell/docs/commands-help.md)
  Use for: verb-noun naming, `Get-Help -Full/-Examples/-Online`, unapproved-verbs warning.
- [Akamai PowerShell on GitHub (akamai/PowerShell)](https://github.com/akamai/PowerShell)
  Use for: source, issues, release notes.
- [PowerShell Gallery — Akamai](https://www.powershellgallery.com/packages/Akamai)
  Use for: current version, submodule package list.

### Akamai product API docs (behaviour behind the cmdlets)
- [Property Manager API (PAPI)](https://techdocs.akamai.com/property-mgr/reference/api)
- [Application Security API](https://techdocs.akamai.com/application-security/reference/api)
- [Client Lists API](https://techdocs.akamai.com/client-lists/reference/api)
- [Identity & Access Management API](https://techdocs.akamai.com/iam-user-admin/reference/api)

### Cmdlet reference by task (Akamai PowerShell)
- Property: `Find-Property`, `Get-Property`, `Get-PropertyVersion`, `New-PropertyVersion`, `Update-PropertyRule`, `Set-PropertyRules`, `New-PropertyActivation`, `Get-PropertyActivation`
- AppSec: `Get-AppSecSelectedHostnames`, `Add-AppSecSelectedHostnames`, `Set-AppSecPolicySelectedHostnames`, `Get-AppSecPolicyCustomRules`, `Get-AppSecCustomRule`, `New-AppSecConfigurationVersion`, `New-AppSecActivation`
- Client Lists: `Get-ClientList`, `Get-ClientListItem`, `New-ClientList`, `Add-ClientListItem`, `Set-ClientListItem`, `New-ClientListActivation`
- IAM: `Get-IAMUser`, `New-IAMUser`, `Set-IAMUser`, `Get-IAMRole`, `Get-IAMGroup`, `Get-IAMGrantableRole`, `Get-AccountSwitchKey`

## Wisdom (Communities)
- [Akamai Community — Developer / API forum](https://community.akamai.com/)
  Official, Akamai-staffed. Use for: module bugs, auth issues, "is this the right cmdlet" questions.
- [akamai/PowerShell GitHub Issues](https://github.com/akamai/PowerShell/issues)
  Use for: reporting broken cmdlets, checking known issues before you burn an hour.
- [r/PowerShell](https://www.reddit.com/r/PowerShell/)
  High-signal, well-moderated. Use for: general PowerShell technique (pipeline, objects, filtering), not Akamai specifics.

## Gaps
- No single official "Akamai PowerShell for beginners" tutorial exists — the techdocs assume PowerShell fluency. This workspace fills that gap.
- Akamai brand palette used in lessons is an approximation (see [NOTES.md](./NOTES.md)); confirm against official brand guidelines if these are shared externally.

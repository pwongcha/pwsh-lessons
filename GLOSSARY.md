# PowerShell + Akamai API Glossary

Canonical terms for this workspace. Every lesson uses these words. Terms are added
only once the user can use them correctly.

## Terms

### PowerShell
_(added once the user demonstrates each — currently seeded from lesson 01 coverage)_

**Cmdlet**:
A built-in PowerShell command, always named `Verb-Noun` (e.g. `Get-Property`).
_Avoid_: command, function, script

**Pipeline**:
The `|` operator that passes the **objects** output by one cmdlet as input to the next.
_Avoid_: chaining, piping text

**Object**:
A structured value with named **properties**, returned by cmdlets instead of plain text.
_Avoid_: record, row, result string

**Property (PowerShell sense)**:
A named field on an **object**, read with a dot: `$result.propertyName`.
_Avoid_: attribute, key, field

**Splatting**:
Passing a hashtable of parameters to a cmdlet with `@name` instead of listing each `-Param` inline.
_Avoid_: parameter object, arg bag

## Akamai
_Domain terms — the user already knows these from Control Center; listed here to fix wording._

**Property**:
A delivery configuration in Property Manager that controls how Akamai serves a set of hostnames.
_Avoid_: config (reserved for security), site

**Security configuration**:
An Application Security configuration containing one or more security policies and their protected hostnames.
_Avoid_: WAF, property, config file

**Activation**:
Promoting a specific version of a property, security config, or client list to the **staging** or **production** network.
_Avoid_: deploy, publish, push

**Client list**:
A reusable named set of values (IPs, geos, ASNs, headers) referenced by security policies and property rules.
_Avoid_: allowlist, blocklist, network list

**Custom rule**:
An operator-authored security rule in a security configuration, with match conditions and a configured **action**.
_Avoid_: WAF rule, signature

**Action (security rule sense)**:
What a policy does when a rule matches — e.g. `alert`, `deny`, `deny_custom`, or a rate/bot action.
_Avoid_: response, verdict, mode

**`.edgerc`**:
The local text file holding Akamai API credentials, split into named **sections** like `[default]`.
_Avoid_: config file, keyfile, profile

**Section (`.edgerc`)**:
A named credential block in `.edgerc`, selected with `-Section`; defaults to `default`.
_Avoid_: profile, environment, stanza

**Account switch key**:
A token that lets one API client act against another Akamai account, passed as `-AccountSwitchKey`.
_Avoid_: account key, tenant id, impersonation token

**IAM (Identity & Access Management)**:
Akamai's system of users, roles, groups, and API clients. The module prefixes these cmdlets `*-IAM*`.
_Avoid_: IDM, RBAC, directory

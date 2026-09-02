# Glossary

Canonical terms for this course.  Every lesson uses these words — when several
words exist for one idea, the glossary picks one and lists the rest as *avoid*.

## PowerShell

`Cmdlet`

:   A built-in PowerShell command, always named `Verb-Noun` (e.g. `Get-Property`).
    *Avoid:* command, function, script

`Pipeline`

:   The `|` operator that passes the **objects** output by one cmdlet as input to
    the next.
    *Avoid:* chaining, piping text

`Object`

:   A structured value with named **properties**, returned by cmdlets instead of
    plain text.
    *Avoid:* record, row, result string

`Property` (PowerShell sense)

:   A named field on an **object**, read with a dot: `$result.propertyName`.
    *Avoid:* attribute, key, field

`Splatting`

:   Passing a hashtable of parameters to a cmdlet with `@name` instead of listing
    each `-Param` inline.
    *Avoid:* parameter object, arg bag

## Akamai

*Domain terms — you already know these from Control Center; listed here to fix
wording.*

`Property`

:   A delivery configuration in Property Manager that controls how Akamai serves
    a set of hostnames.
    *Avoid:* config (reserved for security), site

`Security configuration`

:   An Application Security configuration containing one or more security
    policies and their protected hostnames.
    *Avoid:* WAF, property, config file

`Activation`

:   Promoting a specific version of a property, security config, or client list
    to the **staging** or **production** network.
    *Avoid:* deploy, publish, push

`CPS` (Certificate Provisioning System)

:   Akamai's system for issuing, deploying, and renewing the TLS certificates
    that terminate on edge hostnames.  Module cmdlets are `*-CPS*`.
    *Avoid:* SSL manager, cert manager

`Certificate enrollment`

:   In CPS, one certificate's configuration and lifecycle — its SANs, validation
    type (`dv` / `ov` / `ev` / `third-party`), and issuer.  Any modification flows
    through CPS as a **change**.
    *Avoid:* cert, SSL cert

`Change management` (CPS)

:   An enrollment setting that makes a certificate change deploy to **staging**
    and pause for an explicit acknowledgement before it reaches production.
    *Avoid:* approval workflow

`Client list`

:   A reusable named set of values (IPs, geos, ASNs, headers) referenced by
    security policies and property rules.
    *Avoid:* allowlist, blocklist, network list

`Custom rule`

:   An operator-authored security rule in a security configuration, with match
    conditions and a configured **action**.
    *Avoid:* WAF rule, signature

`Action` (security rule sense)

:   What a policy does when a rule matches — e.g. `alert`, `deny`, `deny_custom`,
    or a rate/bot action.
    *Avoid:* response, verdict, mode

`.edgerc`

:   The local text file holding Akamai API credentials, split into named
    **sections** like `[default]`.
    *Avoid:* config file, keyfile, profile

`Section` (`.edgerc`)

:   A named credential block in `.edgerc`, selected with `-Section`; defaults to
    `default`.
    *Avoid:* profile, environment, stanza

`Account switch key`

:   A token that lets one API client act against another Akamai account, passed
    as `-AccountSwitchKey`.
    *Avoid:* account key, tenant id, impersonation token

`IAM` (Identity & Access Management)

:   Akamai's system of users, roles, groups, and API clients.  The module prefixes
    these cmdlets `*-IAM*`.
    *Avoid:* IDM, RBAC, directory

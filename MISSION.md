# Mission: PowerShell 101 for Akamai API operations (Windows)

## Why
The user runs Akamai from Control Center today and wants to move routine platform
work into PowerShell so it is faster, repeatable, and scriptable. The concrete goal
is to confidently perform real Akamai operations from a Windows terminal — finding
and changing properties, wiring hostnames into security configs, managing client
lists, reviewing custom WAF rules, and administering users/roles — without clicking
through the UI each time.

## Success looks like
- Install the Akamai PowerShell module on Windows and make a first authenticated API call
- Create API credentials in Control Center and set up a working `.edgerc` (with sections + account switching)
- Find a property by name, inspect its versions, and read its rule tree
- Create a new property version, edit a rule, and activate to staging
- Add a hostname to an Application Security configuration
- View a client list and its items; add/update items and activate
- Retrieve a custom security rule and read its configured action
- List and manage IAM users, roles, and groups

## Constraints
- Near-zero PowerShell experience — Windows GUI user, barely touched a terminal
- Has Control Center access but has NOT yet created API credentials
- Wants short, quick lessons; HTML lessons carry Akamai branding
- Learning over multiple sessions

## Out of scope (for now)
- PowerShell scripting depth: functions, modules, classes, advanced error handling
- CI/CD pipelines and automation orchestration
- Non-Akamai PowerShell administration (AD, Exchange, Azure)
- Terraform / CLI / other Akamai tooling
- NetStorage, EdgeDNS, GTM, EdgeWorkers

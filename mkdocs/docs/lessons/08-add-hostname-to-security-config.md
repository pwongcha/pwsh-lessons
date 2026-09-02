# Lesson 08 · Add a hostname to a security configuration

~18 min<br>:material-pencil: Writes — staging only<br>Needs Lessons 06–07<br>Production = deferred
{ .lesson-meta }

**Put a new hostname under WAF protection: clone a config version, add it to the
selected hostnames, confirm a policy evaluates it, activate to staging.**

The hostname already lives on a delivery property (Lessons 06–07).  Now you bring
it under a **security configuration** so the WAF, rate controls, and bot rules
apply to its traffic.  Same version-then-activate discipline as Lesson 07,
different product.

**Goal:** a new security-config version with your hostname in its protected
set, a policy confirmed to evaluate it, active on staging.

## How AppSec decides to protect a request

```text
Security configuration
 ├─ selected hostnames   ← the POOL of hostnames this config may protect
 ├─ security policies    ← the rule sets (WAF mode, rate limits, bot rules...)
 └─ match targets        ← "requests for hostname X + path Y  →  evaluate with policy Z"
```

Two things must both be true for a hostname to be protected:

1. It is in the config's **selected hostnames** (this lesson's main step).
2. A **match target** routes its requests to a **security policy** (see "Confirm a policy will evaluate it" — often
   already covered by a broad "all website traffic" match target).

## Find the configuration

```powershell
Get-AppSecConfiguration | Select-Object id, name, latestVersion, stagingVersion, productionVersion

$cfg = 'Example-Account Main WAF'
Get-AppSecConfiguration -ConfigName $cfg
```

## Preflight — is the hostname protectable?

A hostname can only be selected if it is already served by an active delivery
property with an Akamai edge hostname, on the same contract.

```powershell
Get-AppSecSelectableHostnames -ConfigName $cfg -VersionNumber latest |
    Where-Object hostname -like '*new.example.com*'
```

- Listed → good, proceed.
- Not listed → the delivery side isn't ready.  Add the hostname to its property
  and activate that first (Lesson 07), then come back.

## Clone a new config version

```text
PS> $v = (New-AppSecConfigurationVersion -ConfigName $cfg -CreateFromVersion latest).version
PS> $v
63
```

As with properties: the active version is immutable.  You edit v63; staging /
production stay put.

## Look at the current selected hostnames

```text
PS> Get-AppSecSelectedHostnames -ConfigName $cfg -VersionNumber $v |
        Select-Object -ExpandProperty hostnameList
hostname
--------
www.example.com
img.example.com
api.example.com
```

## Add the hostname

The body shape matches what `Get-AppSecSelectedHostnames` returns — a
`hostnameList` of `{ hostname = ... }` objects.  `Add-` *appends*; it does not
replace.

```text
PS> $body = @{ hostnameList = @( @{ hostname = 'new.example.com' } ) }

PS> Add-AppSecSelectedHostnames -ConfigName $cfg -VersionNumber $v -Body $body

# confirm
PS> (Get-AppSecSelectedHostnames -ConfigName $cfg -VersionNumber $v).hostnameList.hostname
www.example.com
img.example.com
api.example.com
new.example.com
```

!!! tip "Add vs Set"
    `Add-AppSecSelectedHostnames` appends to the list.
    `Set-AppSecSelectedHostnames` replaces the whole list — pass it the full set
    or you'll *remove* protection from everything you left out.

## Confirm a policy will evaluate it

```powershell
Get-AppSecMatchTarget -ConfigName $cfg -VersionNumber $v |
    Select-Object targetId, type, @{n='policy';e={$_.securityPolicy.policyId}},
                   @{n='hosts';e={$_.hostnames -join ','}}, isNegativePathMatch
```

- A match target whose `hosts` is empty / a wildcard covers **all** hostnames —
  `new.example.com` is already routed to that policy.  Nothing more to do.
- A match target that lists specific hostnames → add yours so the policy applies:

```powershell
Add-AppSecPolicySelectedHostnames -ConfigName $cfg -VersionNumber $v `
    -PolicyName 'Default' -Body $body
```

Check which policy's protections you're inheriting:

```powershell
Get-AppSecPolicy -ConfigName $cfg -VersionNumber $v | Select-Object policyId, policyName
```

## Activate to staging

```powershell
$act = New-AppSecActivation -ConfigName $cfg -VersionNumber $v `
    -Network STAGING `
    -NotificationEmails 'you@company.com' `
    -Note 'lesson 08 — add new.example.com to protection'

$act | Select-Object activationId, status
```

!!! warning "Invalid hosts on activation"
    If a selected hostname isn't yet reachable through an active property,
    activation stops and lists it.  Confirm it's genuinely fine to skip, then
    re-run adding `-AcknowledgedInvalidHosts 'new.example.com'`.

## Poll to ACTIVE

```powershell
do {
    Start-Sleep 30
    $st = Get-AppSecActivationStatus -ActivationID $act.activationId
    "$(Get-Date -Format T)  $($st.status)"
} while ($st.status -notin 'ACTIVATED','FAILED')
```

AppSec staging activation is typically ~5–10 minutes.

## Verify on staging

Check the policy's WAF mode first so you know what to expect:

```powershell
Get-AppSecPolicy -ConfigName $cfg -VersionNumber $v
```

Then send a request that a WAF in *deny* mode should block, aimed at a staging
edge with the real `Host` header:

```powershell
$ip = (Resolve-DnsName new.example.com.edgekey-staging.net -Type A)[0].IPAddress
curl.exe -sI --resolve new.example.com:443:$ip `
    "https://new.example.com/?a=<script>alert(1)</script>" |
    Select-String 'HTTP/'
```

A `403` (with an Akamai reference) means the policy is now evaluating this
hostname.  In *alert*-only mode you'll get `200` — check the security events /
`Get-AppSecEvent` instead.

!!! danger "Production — deferred"
    Same command, `-Network PRODUCTION`.  Adding a hostname to a WAF in deny mode
    *can block real traffic* if a legit request pattern trips a rule.  Production
    needs: staging soak time, a review of the policy's mode and custom rules
    (Lesson 09), and a rollback plan.  Not today.

!!! example "Try it — protect a test hostname, through to staging"
    Use a non-production config, or one where a staging activation is harmless.
    Pick a real selectable hostname that isn't protected yet.

    ```powershell
    $cfg = 'YOUR-TEST-CONFIG'
    $host = 'YOUR-SELECTABLE-HOSTNAME'

    Get-AppSecSelectableHostnames -ConfigName $cfg -VersionNumber latest |
        Where-Object hostname -eq $host          # must appear

    $v = (New-AppSecConfigurationVersion -ConfigName $cfg -CreateFromVersion latest).version
    $body = @{ hostnameList = @( @{ hostname = $host } ) }

    Add-AppSecSelectedHostnames -ConfigName $cfg -VersionNumber $v -Body $body
    (Get-AppSecSelectedHostnames -ConfigName $cfg -VersionNumber $v).hostnameList.hostname

    Get-AppSecMatchTarget -ConfigName $cfg -VersionNumber $v |
        Select-Object targetId, @{n='hosts';e={$_.hostnames -join ','}}

    $act = New-AppSecActivation -ConfigName $cfg -VersionNumber $v `
        -Network STAGING -NotificationEmails 'you@company.com' -Note 'PS101 lesson 08'

    do { Start-Sleep 30
         $st = Get-AppSecActivationStatus -ActivationID $act.activationId
         "$(Get-Date -Format T)  $($st.status)"
    } while ($st.status -notin 'ACTIVATED','FAILED')
    ```

    ??? note "Show expected results & recovery"
        - Selected-hostnames list now includes your hostname.
        - If `Get-AppSecMatchTarget` shows a target with empty/wildcard `hosts`,
          the policy already covers it.  Otherwise run
          `Add-AppSecPolicySelectedHostnames … -PolicyName <name> -Body $body`.
        - **Activation lists invalid hosts** → the hostname isn't live on a
          property yet.  Fix the property, or acknowledge with
          `-AcknowledgedInvalidHosts` if you know it's fine.
        - **Added the wrong hostname?**
          `Remove-AppSecSelectedHostnames -ConfigName $cfg -VersionNumber $v -Body $body`,
          then re-activate to staging.  The version isn't in production, so
          there's no customer impact.
        - Confirm production never moved:
          `(Get-AppSecConfiguration -ConfigName $cfg).productionVersion` unchanged.

## Quiz

<div class="quiz" data-answer="2">
<p class="q">A hostname is in a config's selected hostnames but no match target references it. The result:</p>
<button class="opt">Every security policy in the config evaluates its traffic by default</button>
<button class="opt">Activation is rejected until a match target for it is created first</button>
<button class="opt">It's in the pool but no policy evaluates it — effectively unprotected</button>
<p class="fb"
   data-correct="Right — selected hostnames is just the pool; a match target must route it to a policy."
   data-incorrect="Selected hostnames is only the pool. Without a match target, no policy evaluates it."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">You want to add one hostname without disturbing the others. The safe cmdlet is:</p>
<button class="opt"><code>Add-AppSecSelectedHostnames</code> — it appends to the existing list</button>
<button class="opt"><code>Set-AppSecSelectedHostnames</code> — it merges your entry into the list</button>
<button class="opt"><code>New-AppSecSelectedHostnames</code> — it adds without touching others</button>
<p class="fb"
   data-correct="Correct — Add appends. Set replaces the whole list, so it can silently drop protection."
   data-incorrect="Add appends one entry. Set replaces the entire list — pass it everything or lose protection."></p>
</div>

<div class="quiz" data-answer="1">
<p class="q">Activation stops and reports <code>new.example.com</code> as an invalid host. This means:</p>
<button class="opt">The hostname failed WAF validation and the policy rejected it</button>
<button class="opt">The hostname isn't served by an active property, so it can't be protected</button>
<button class="opt">The account switch key doesn't grant access to that hostname</button>
<p class="fb"
   data-correct="Yes — no active delivery property serves it yet; fix that or acknowledge to skip it."
   data-incorrect="Invalid host = not reachable via an active property. Fix the delivery side or acknowledge it."></p>
</div>

!!! quote "Primary source — read this next"
    [Application Security API — *Modify the list of selected hostnames*](https://techdocs.akamai.com/application-security/reference/put-selected-hostnames)
    and [*Activate a configuration*](https://techdocs.akamai.com/application-security/reference/post-activations).

!!! question "Ask your teacher"
    Not sure whether your config's match targets already cover the new hostname?
    Paste me
    `Get-AppSecMatchTarget -ConfigName $cfg -VersionNumber $v | ConvertTo-Json -Depth 5`
    and I'll tell you whether you need `Add-AppSecPolicySelectedHostnames` or
    you're already done.

<div id="lesson-meta" data-slug="08-add-hostname-to-security-config" hidden></div>

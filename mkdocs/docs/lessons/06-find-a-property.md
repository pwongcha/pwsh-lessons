# Lesson 06 · Find a property and read its state

~15 min<br>:material-lock-open-variant: Read-only — safe<br>Needs a working `.edgerc`<br>First real task
{ .lesson-meta }

**Search by name or hostname, then pull version status, hostnames, activation
history, and the rule tree — everything the Property Manager screens show you,
from the shell.**

Setup is done.  This is the first task from your mission.  Everything here is a
`Get-` or `Find-` — you cannot break anything.  The goal is to get fast at
answering "what version is live, on what hostnames, changed by whom, doing what"
without opening Control Center.

**Goal:** one screen of output that profiles any property — its live/staging
versions, its hostnames, its last few activations, and its top-level rules.

## Find the property

`Find-Property` searches.  It has four modes — pick by what you know:

```powershell
Find-Property -PropertyName www.example.com               # by exact property name
Find-Property -PropertyHostname www.example.com           # by a hostname it serves
Find-Property -EdgeHostname www.example.com.edgekey.net
Find-Property -IncludeName my-shared-origin               # by exact include name
```

!!! warning "No wildcards — this is an exact match"
    `Find-Property` calls PAPI's `find-by-value`, which matches the value
    **exactly** (case-insensitive).  `'*www*'` looks for a property literally
    named `*www*` and returns nothing.  It searches each property's active
    versions plus its latest version, so unactivated properties are still
    found — by their **full** name.

    To search by a name *fragment* there's no single cmdlet — list every
    property and filter client-side (`Get-Property` needs a group + contract,
    so walk the groups):

    ```powershell
    $ask = @{ AccountSwitchKey = 'AANA-3FN55Z:1-5G3LB' }   # omit if not switching
    Get-Group @ask | ForEach-Object {
        $g = $_
        foreach ($c in $g.contractIds) {
            Get-Property @ask -GroupID $g.groupId -ContractId $c
        }
    } |
        Where-Object propertyName -like '*dev*' |
        Select-Object propertyName, propertyId, latestVersion, groupId |
        Sort-Object propertyName -Unique
    ```

Narrow to what is active:

```powershell
Find-Property -PropertyName shop.example.com -JustProductionActive
Find-Property -PropertyName shop.example.com -Latest
```

The result gives you the **property name**, its **propertyId**, the matching
version, and the group/contract — the identifiers the next cmdlets want.

## Open the property record

```text
PS> $p = Get-Property -PropertyName www.example.com

PS> $p | Select-Object propertyName, propertyId, latestVersion,
                       stagingVersion, productionVersion, groupId, contractId

propertyName      : www.example.com
propertyId        : 678901
latestVersion     : 14
stagingVersion    : 14
productionVersion : 12
groupId           : 183544
contractId        : 1-3CV382
```

Already this tells you: **v12 is live**, **v14 is on staging**, and there are
unreleased edits in **v13–v14**.

!!! warning "If Get-Property errors with multiple properties"
    The name exists in more than one group.  Add the ones from your
    [account map](04-account-base-ids.md):
    `Get-Property -PropertyName x -GroupID 183544 -ContractId 1-3CV382`.

## Version history

```text
PS> Get-PropertyVersion -PropertyName www.example.com |
        Sort-Object propertyVersion -Descending |
        Select-Object propertyVersion, updatedByUser, updatedDate,
                      productionStatus, stagingStatus, note -First 5

propertyVersion updatedByUser updatedDate           productionStatus stagingStatus note
--------------- ------------- -----------           ---------------- ------------- ----
             14 jsmith        2026-08-28T09:11:02Z  INACTIVE         ACTIVE        cache tuning
             13 jsmith        2026-08-27T16:40:55Z  INACTIVE         INACTIVE      wip
             12 achen         2026-08-19T11:02:31Z  ACTIVE           INACTIVE      Q3 origin move
```

One version in detail:

```powershell
Get-PropertyVersion -PropertyName www.example.com -PropertyVersion latest
```

## Which hostnames does it serve?

```text
PS> Get-PropertyHostname -PropertyName www.example.com -PropertyVersion latest |
        Select-Object cnameFrom, cnameTo, certStatus

cnameFrom            cnameTo                              certStatus
---------            -------                              ----------
www.example.com      www.example.com.edgekey.net          {@{status=DEPLOYED...}}
img.example.com      img.example.com.edgekey.net          {@{status=DEPLOYED...}}
```

`cnameFrom` is the customer-facing hostname; `cnameTo` is the edge hostname the
DNS CNAME must point at.

## Activation history

```text
PS> Get-PropertyActivation -PropertyName www.example.com |
        Sort-Object submitDate -Descending |
        Select-Object propertyVersion, network, status, submitDate, note -First 6

propertyVersion network  status   submitDate            note
--------------- -------  ------   ----------            ----
             14 STAGING  ACTIVE   2026-08-28T09:14:00Z  cache tuning
             12 PRODUCTION ACTIVE 2026-08-19T12:20:11Z  Q3 origin move
             12 STAGING  ACTIVE   2026-08-19T11:40:03Z  Q3 origin move
```

This is the audit trail: who pushed which version to which network, and when.

## Read the rule tree

`Get-PropertyRules` returns the whole configuration as one big object.  Don't
print it raw — navigate it.

```text
PS> $r = Get-PropertyRules -PropertyName www.example.com -PropertyVersion latest

PS> $r.rules.name                # "default"
PS> $r.rules.children.name       # the named child rules
Offload
Performance
Origin Failover
mPulse RUM

# the default-rule behaviors (origin, caching, cpCode...):
PS> $r.rules.behaviors.name
origin
cpCode
caching
allowPost

# inspect one behavior's settings:
PS> ($r.rules.behaviors | Where-Object name -eq 'origin').options |
        Select-Object originType, hostname, forwardHostHeader
originType              hostname                 forwardHostHeader
----------              --------                 -----------------
CUSTOMER                origin-www.example.com    REQUEST_HOST
```

Working on it offline or diffing it?  Write it to a file:

```powershell
Get-PropertyRules -PropertyName www.example.com -PropertyVersion latest `
    -OutputToFile -OutputFileName www-v14.json
```

!!! tip "The shape to remember"
    A rule tree is one root `rules` object.  Every rule has `behaviors[]`,
    `criteria[]`, and `children[]` (nested rules).  That recursion is the entire
    model — Lesson 07 edits it, Lesson 09's security custom rules echo it.

!!! example "Try it — profile a real property"
    Pick any property on your account.  Fill in its name and run this block.  It
    produces a one-screen profile.

    ```powershell
    $name = 'YOUR-PROPERTY-NAME'

    $p = Get-Property -PropertyName $name
    "`n=== $($p.propertyName)  ($($p.propertyId)) ==="
    "live v$($p.productionVersion) | staging v$($p.stagingVersion) | latest v$($p.latestVersion)"

    "`n-- hostnames --"
    Get-PropertyHostname -PropertyName $name -PropertyVersion latest |
        Select-Object cnameFrom, cnameTo | Format-Table -AutoSize

    "`n-- last 3 activations --"
    Get-PropertyActivation -PropertyName $name |
        Sort-Object submitDate -Descending |
        Select-Object propertyVersion, network, status, note -First 3 | Format-Table -AutoSize

    "`n-- top-level rules --"
    $r = Get-PropertyRules -PropertyName $name -PropertyVersion latest
    $r.rules.children.name

    "`n-- origin --"
    ($r.rules.behaviors | Where-Object name -eq 'origin').options.hostname
    ```

    ??? note "Show what to expect & how to read it"
        - **live vs latest gap** — if `productionVersion` < `latestVersion`,
          someone has staged or draft changes not yet in production.
        - **origin under a child rule?** — `$r.rules.behaviors` only shows the
          *default* rule.  If origin is empty there, it's set in a child:
          `$r.rules.children | Where-Object { $_.behaviors.name -contains 'origin' }`.
        - **no activations** — brand-new property never pushed anywhere.
        - Backtick-n (`` `n ``) inside a double-quoted string is a newline —
          that's how the block gets its spacing.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">A property shows <code>productionVersion 8</code> and <code>latestVersion 11</code>. This means:</p>
<button class="opt">Versions 9 to 11 failed activation and were rolled back to 8</button>
<button class="opt">Versions 9 to 11 are edits that are not live in production</button>
<button class="opt">The property is broken and stuck three versions behind now</button>
<p class="fb"
   data-correct="Right — latest is just the newest saved version; production points at whatever was activated."
   data-incorrect="Nothing is broken. latestVersion is the newest edit; productionVersion is what's activated live."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">In a rule tree object, nested rules under a rule are found on which property?</p>
<button class="opt">The <code>criteria</code> array, one entry per nested rule below</button>
<button class="opt">The <code>behaviors</code> array, filtered to the rule-type ones</button>
<button class="opt">The <code>children</code> array, each entry a full rule itself</button>
<p class="fb"
   data-correct="Yes — rules.children holds nested rules, each with its own behaviors, criteria, and children."
   data-incorrect="Nested rules live in children[]. behaviors and criteria describe the current rule, not sub-rules."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q"><code>Get-Property -PropertyName x</code> fails saying multiple properties match. You should:</p>
<button class="opt">Add <code>-GroupID</code> and <code>-ContractId</code> to point at one group</button>
<button class="opt">Add <code>-Force</code> so it returns the first matching property found</button>
<button class="opt">Rename the property in Control Center so the name is unique</button>
<p class="fb"
   data-correct="Correct — the same name exists in several groups; the group + contract disambiguate it."
   data-incorrect="The name isn't unique across groups. Scope with -GroupID and -ContractId from your account map."></p>
</div>

!!! quote "Primary source — read this next"
    [Akamai — *PowerShell: Property*](https://techdocs.akamai.com/powershell/docs/property/property)
    guide, and the
    [Property Manager API — *List / Get properties*](https://techdocs.akamai.com/property-mgr/reference/get-properties)
    for the response fields.

!!! question "Ask your teacher"
    Rule tree hard to navigate?  Paste me the output of
    `$r.rules | ConvertTo-Json -Depth 3` and tell me what you're hunting for — a
    behavior, a match condition, a specific child rule — and I'll show you the
    exact path to it.

<div id="lesson-meta" data-slug="06-find-a-property" hidden></div>

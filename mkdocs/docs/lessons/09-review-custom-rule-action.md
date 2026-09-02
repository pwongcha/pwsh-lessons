# Lesson 09 · Review a custom rule and its action

~15 min<br>:material-lock-open-variant: Read-only (optional write near the end)<br>Needs Lesson 08 concepts<br>Audit skill
{ .lesson-meta }

**Read what a custom rule matches, find what each policy does when it matches,
and judge whether the two agree with intent.**

Lesson 08 put a hostname under a policy.  That policy carries **custom rules** —
rules your team wrote, as opposed to Akamai's managed WAF rules.  This lesson is
about *auditing* them: a rule that matches attack traffic but is set to `alert`
isn't protecting anyone, and a rule set to `deny` with sloppy conditions can
block customers.

**Goal:** a review table for any config — every custom rule, what it matches
in one line, the action each policy gives it, and a verdict.

## A custom rule has two separate halves

```text
Custom rule DEFINITION        (config-level, shared)
   id, name, tag, operator, conditions[]   ← WHAT it matches

Policy custom-rule ACTION      (per security policy)
   ruleId → action             ← WHAT HAPPENS when it matches:
                                  alert · deny · deny_custom_{id} · none
```

The same rule can be `deny` in one policy and `alert` in another.  A rule whose
action is `none` in a policy is **defined but inert** there — a common blind
spot.

## List the custom rules in a config

```text
PS> $cfg = 'Example-Account Main WAF'
PS> Get-AppSecCustomRule -ConfigName $cfg |
        Select-Object id, name, @{n='tags';e={$_.tag -join ','}}, @{n='op';e={$_.operator}}

id      name                       tags          op
--      ----                       ----          --
668001  Block legacy admin paths   custom,ops    AND
668002  Geo allowlist - APAC only  geo           AND
668003  Flag scraper user-agents   bots          OR
```

Custom rule definitions are **config-level**, not tied to a version in this
cmdlet — one library of rules the policies draw from.

## Read one rule's match logic

```text
PS> $rule = Get-AppSecCustomRule -ConfigName $cfg -RuleID 668001
PS> $rule.operator
AND
PS> $rule.conditions | Select-Object type, positiveMatch, name, value, valueWildcard

type              positiveMatch name           value                       valueWildcard
----              ------------- ----           -----                       -------------
pathMatch         True                         {/admin/*, /manage/*}       True
requestMethodMatch True         METHOD         {POST, PUT, DELETE}
ipMatch           False                        {203.0.113.0/24}
```

Read it as a sentence:

!!! tip "Rule 668001 in English"
    `operator AND` → **all** conditions must hold: path matches `/admin/*` or
    `/manage/*`, *and* method is POST/PUT/DELETE, *and* the client IP is **not**
    in `203.0.113.0/24` (`positiveMatch = False` negates).

- `operator` — `AND` (all conditions) or `OR` (any condition).
- `positiveMatch` — `True` = "matches when it's in the set"; `False` = "matches
  when it's *not*".
- `valueWildcard` / `valueCase` — whether `*`/`?` apply and whether case matters.
- Condition `type`s you'll see: `pathMatch`, `requestHeaderMatch`,
  `requestMethodMatch`, `ipMatch`, `geoMatch`, `requestCookieMatch`, `argsMatch`,
  `filenameMatch`, `extensionMatch`.

## Find the action each policy gives it

```text
PS> Get-AppSecPolicyCustomRule -ConfigName $cfg -VersionNumber latest -PolicyName 'Default' |
        Select-Object ruleId, action

ruleId action
------ ------
668001 deny
668002 deny
668003 alert
668004 none
```

| action | meaning |
| --- | --- |
| `alert` | Log the match as a security event. Request proceeds. |
| `deny` | Block with Akamai's standard 403. |
| `deny_custom_{id}` | Block using a custom deny action (custom status/page/redirect). |
| `none` | Rule is not applied by this policy at all. |

## Join the two halves into a review table

```powershell
$defs    = Get-AppSecCustomRule -ConfigName $cfg
$actions = Get-AppSecPolicyCustomRule -ConfigName $cfg -VersionNumber latest -PolicyName 'Default'

$defs | ForEach-Object {
    $d = $_
    $a = ($actions | Where-Object ruleId -eq $d.id).action
    [pscustomobject]@{
        Id      = $d.id
        Name    = $d.name
        Match   = "$($d.operator): " + (($d.conditions | ForEach-Object {
                    "$($_.type)$(if(-not $_.positiveMatch){' (NOT)'})" }) -join ' + ')
        Action  = if ($a) { $a } else { '(not in policy)' }
    }
} | Format-Table -AutoSize -Wrap
```

```text
Id     Name                      Match                                          Action
--     ----                      -----                                          ------
668001 Block legacy admin paths  AND: pathMatch + requestMethodMatch + ipMatch (NOT)  deny
668002 Geo allowlist - APAC only AND: geoMatch (NOT)                             deny
668003 Flag scraper user-agents  OR: requestHeaderMatch + requestHeaderMatch     alert
668004 Old test rule             AND: pathMatch                                  none
```

## What to flag in a review

- **Attack-blocking rule on `alert`** — 668003 flags scrapers but never stops
  them.  Intended, or forgotten after a tuning window?
- **Rule on `none`** — 668004 is dead weight.  Remove it, or wire it up.
- **Broad `deny`** — a single-condition `deny` on `pathMatch /api/*` blocks a
  whole surface.  Check the condition is really as narrow as intended.
- **Negated allowlists** — 668002 denies everything *not* in APAC.  Confirm the
  geo set is complete; one missing country = an outage.
- **Sample rate** — `$rule.sampleRate` below 100 on a `deny` rule means it only
  fires on a fraction of matches.  Almost always wrong for a block rule.
- **Different action across policies** — repeat the per-policy action lookup for every policy; a rule that's
  `deny` in "Default" but `alert` in "Partners" may be deliberate or may be drift.

## Optional — retune an action

If the review says a rule should move from `alert` to `deny`:

```powershell
$v = (New-AppSecConfigurationVersion -ConfigName $cfg -CreateFromVersion latest).version
Set-AppSecPolicyCustomRule -ConfigName $cfg -VersionNumber $v `
    -PolicyName 'Default' -RuleID 668003 -Action deny
New-AppSecActivation -ConfigName $cfg -VersionNumber $v `
    -Network STAGING -NotificationEmails 'you@company.com' -Note '668003 alert->deny'
```

!!! danger "Production — deferred"
    Moving a rule to `deny` in production starts blocking traffic immediately.
    Soak on staging, watch the rule's security events for false positives for a
    real traffic cycle, then promote.  Covered later.

## Where custom rules run

In request evaluation, custom rules fire **after** network lists / client lists
and rate controls, and **before** Akamai's managed WAF (KRS/ASE) attack groups
and Bot Manager.  So a custom `deny` short-circuits the managed rules — useful,
but it means a false positive here is a hard block with no managed-rule nuance.
(Full order: the
[AppSec execution order](https://techdocs.akamai.com/application-security/reference/what-the-firewall-does)
reference.)

!!! example "Try it — produce a custom-rule review report"
    Run this join against a real config and policy.  Then answer, in writing,
    for each rule: *does the action match the intent in the name?*

    ```powershell
    $cfg    = 'YOUR-CONFIG'
    $policy = 'YOUR-POLICY'

    $defs    = Get-AppSecCustomRule -ConfigName $cfg
    $actions = Get-AppSecPolicyCustomRule -ConfigName $cfg -VersionNumber latest -PolicyName $policy

    $report = $defs | ForEach-Object {
        $d = $_
        $a = ($actions | Where-Object ruleId -eq $d.id).action
        [pscustomobject]@{
            Id     = $d.id
            Name   = $d.name
            Op     = $d.operator
            Conds  = ($d.conditions | ForEach-Object {
                       "$($_.type)$(if(-not $_.positiveMatch){'(NOT)'})" }) -join ' + '
            Sample = $d.sampleRate
            Action = if ($a) { $a } else { '(not in policy)' }
        }
    }
    $report | Format-Table -AutoSize -Wrap
    $report | Where-Object { $_.Action -in 'alert','none','(not in policy)' }   # the flags
    $report | Export-Csv $HOME\customrule-review-$cfg.csv -NoTypeInformation
    ```

    ??? note "Show how to read your report"
        - **Anything in the "flags" filter** deserves a sentence of
          justification.  "alert while we tune" is fine *if* someone owns the
          tuning; "none" almost never is.
        - **A rule named "Block…" with action `alert`** — the name and the action
          disagree.  Either rename or re-action.
        - **`Sample` below 100 on a deny** — flag it hard.
        - **Empty `Conds`** — a rule with no conditions matches everything.  If its
          action is `deny`, that's a full outage waiting to be activated.
        - Re-run for each policy from
          `Get-AppSecPolicy -ConfigName $cfg -VersionNumber latest` to catch
          per-policy drift.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">A custom rule exists in the config but its action in the Default policy is <code>none</code>. For requests hitting that policy:</p>
<button class="opt">The rule logs every match as an event but never blocks it</button>
<button class="opt">The rule is not evaluated by that policy at all — it's inert</button>
<button class="opt">The rule blocks matches using Akamai's standard 403 response</button>
<p class="fb"
   data-correct="Right — none means the policy doesn't apply the rule; alert is the log-only action."
   data-incorrect="none = not applied by that policy. The log-only action is alert, not none."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">A condition shows <code>type geoMatch</code>, <code>positiveMatch False</code>, value <code>{JP, KR, SG}</code>. The rule matches when the request comes from:</p>
<button class="opt">Any of Japan, Korea, or Singapore — the three listed countries</button>
<button class="opt">A country Akamai cannot geolocate from the client IP address</button>
<button class="opt">Anywhere except Japan, Korea, or Singapore — the set is negated</button>
<p class="fb"
   data-correct="Yes — positiveMatch False negates: it matches everything outside the listed set."
   data-incorrect="positiveMatch False inverts the match — it fires for requests NOT from JP/KR/SG."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">To change only what a rule <em>does</em> when it matches, without touching its conditions, you use:</p>
<button class="opt"><code>Set-AppSecPolicyCustomRule</code> with a new <code>-Action</code> value</button>
<button class="opt"><code>Set-AppSecCustomRule</code> with the rule's full updated body</button>
<button class="opt"><code>New-AppSecMatchTarget</code> pointing the rule at a new policy</button>
<p class="fb"
   data-correct="Correct — the action lives on the policy binding; Set-AppSecPolicyCustomRule changes just that."
   data-incorrect="Action is the policy binding. Set-AppSecPolicyCustomRule -Action changes it; Set-AppSecCustomRule edits conditions."></p>
</div>

!!! quote "Primary source — read this next"
    [Application Security API — *Custom rules*](https://techdocs.akamai.com/application-security/reference/get-config-custom-rules)
    (condition types, operators) and
    [*Custom rule actions*](https://techdocs.akamai.com/application-security/reference/get-policy-custom-rules).

!!! question "Ask your teacher"
    Paste me one rule as
    `Get-AppSecCustomRule -ConfigName $cfg -RuleID <id> | ConvertTo-Json -Depth 6`
    and tell me what you think it's supposed to do — I'll help you confirm the
    conditions actually express that, and whether the action fits.

<div id="lesson-meta" data-slug="09-review-custom-rule-action" hidden></div>

# Lesson 07 · Update a property: new version → edit a rule → activate to staging

~18 min<br>:material-pencil: Writes — staging only<br>Needs Lesson 06<br>Production = deferred
{ .lesson-meta }

**The first change you make.  Learn the safe workflow once and every future edit
follows it.**

Lesson 06 read a property.  This one changes one.  The mechanics are three cmdlets,
but the *discipline* around them is the real lesson: you never touch a live
version, you validate before you activate, and you go to **staging** first —
always.

**Goal:** a new property version with a real edit, validated clean, active on
the staging network, confirmed by polling — and production left untouched until
you decide.

!!! danger "Before you run anything in this lesson"
    `Get-AccountID | Get-AccountName` — say the account name out loud.

    Then pick a **low-risk property** to practise on (a test property, or one
    where a staging activation is harmless).  Do not practise on a
    customer-critical property even though we only touch staging.

## The workflow — memorise this

```text
1.  New-PropertyVersion   ── copy the latest version to a fresh, editable one
2.  Update-PropertyRule    ── change one setting  (or Set-PropertyRules for a whole-tree edit)
    └─ -ValidateRules       ── check for errors + warnings
3.  New-PropertyActivation -Network Staging
4.  Get-PropertyActivation ── poll until status = ACTIVE
5.  verify on staging
   ────────────────────────────────────────────────
6.  (later, deliberately)  New-PropertyActivation -Network Production
```

!!! tip "Why a new version"
    An active version is immutable — Akamai will reject edits to it.
    `New-PropertyVersion` clones it so your edits land somewhere safe.  This
    mirrors the Control Center "New Version" button.

## Create the new version

```text
PS> $name = 'www.example.com'
PS> $new  = New-PropertyVersion -PropertyName $name -CreateFromVersion latest
PS> $ver  = $new.propertyVersion
PS> $ver
15
```

`-CreateFromVersion latest` copies the newest saved version.  You now have v15 to
edit; the live version is unchanged.

## Edit — two approaches

### A · Targeted change with `Update-PropertyRule`

Best for a single, known setting.  `-Path` is a **JSON Pointer** into the rule
tree; `-Value` is the replacement object.

```powershell
# find the index of the behavior you want to change
$r = Get-PropertyRules -PropertyName $name -PropertyVersion $ver
$r.rules.behaviors | Select-Object @{n='i';e={[array]::IndexOf($r.rules.behaviors,$_)}}, name
```

```text
i name
- ----
0 origin
1 cpCode
2 caching
3 allowPost
```

```powershell
# replace the caching behavior (index 2) with a new setting
$caching = @{
    name = 'caching'
    options = @{ behavior = 'MAX_AGE'; mustRevalidate = $false; ttl = '7d' }
}
Update-PropertyRule -PropertyName $name -PropertyVersion $ver `
    -Path '/rules/behaviors/2' -Value $caching `
    -VersionNotes 'raise default TTL to 7d' -ValidateRules
```

Common paths: `/rules/behaviors/<i>` (a default behavior), `/rules/children/<i>`
(a whole child rule), `/rules/children/0/behaviors/1/options/ttl` (one deep
option).

### B · Whole-tree edit with `Set-PropertyRules`

Best for several changes, or when you'd rather edit JSON in an editor.

```powershell
Get-PropertyRules -PropertyName $name -PropertyVersion $ver `
    -OutputToFile -OutputFileName www-v15.json

# ... edit www-v15.json in VS Code / Notepad++ / Notepad, save ...

Set-PropertyRules -PropertyName $name -PropertyVersion $ver `
    -InputFile www-v15.json -ValidateRules `
    -VersionNotes 'raise TTL; add far-future images rule'
```

## Read the validation result

Both cmdlets, with `-ValidateRules`, return the tree plus `errors` and `warnings`
arrays.  Check them:

```powershell
$res = Set-PropertyRules -PropertyName $name -PropertyVersion $ver `
           -InputFile www-v15.json -ValidateRules -PassThru
$res.errors
$res.warnings | Select-Object type, detail
```

- **errors** non-empty → activation will be refused.  Fix and re-save.
- **warnings** → allowed, but you must acknowledge them at activation time.  Read
  every one.
- Want to check without saving?  Add `-DryRun -ValidateRules` to
  `Update-PropertyRule`.

## Activate to staging

```text
PS> $act = New-PropertyActivation -PropertyName $name -PropertyVersion $ver `
    -Network Staging `
    -NotifyEmails 'you@company.com' `
    -Note 'lesson 07 — TTL change, staging test'

PS> $act.activationId
9182736
```

- `-Network Staging` — the isolated test network.  No customer traffic.
  Propagates in a few minutes.
- `-NotifyEmails` is required — who gets the "activation complete" mail.
- If the version has warnings, the activation may come back asking you to
  acknowledge them.  Check `Get-Help New-PropertyActivation -Full` for the
  acknowledge parameter in your module version, then re-run with it.

## Poll until it's live on staging

```text
PS> do {
    Start-Sleep 20
    $s = Get-PropertyActivation -PropertyName $name |
          Where-Object activationId -eq $act.activationId
    "$(Get-Date -Format T)  $($s.status)"
} while ($s.status -notin 'ACTIVE','FAILED','ABORTED')

14:02:11  PENDING
14:02:52  PENDING
14:03:33  ACTIVE
```

## Verify on staging

Staging has its own edge IPs.  Point your request at a staging edge while keeping
the real `Host` header:

```powershell
$edge = 'www.example.com.edgekey-staging.net'
curl.exe -sI --resolve www.example.com:443:$(
    (Resolve-DnsName $edge -Type A)[0].IPAddress
  ) https://www.example.com/ | Select-String -Pattern 'HTTP/|Cache-Control|X-Cache'
```

Compare headers to production.  Akamai's *Edge Diagnostics* (also in the module)
can do a deeper staging check.

## Production — not in this lesson

!!! danger "Deliberately deferred"
    Production activation is the same cmdlet with `-Network Production`.  Do it
    only with: a reviewed diff (`Compare-PropertyRules` or Control Center's
    version compare), a change window, the right notification list, and someone
    watching traffic.  We'll cover a safe production push in a later lesson.  For
    now, leave staging as your finish line.

!!! example "Try it — a safe, reversible change"
    On your low-risk property, make the smallest possible real change: bump the
    **version notes** and adjust one comment/label, validate, activate to
    **staging**, poll.

    ```powershell
    $name = 'YOUR-LOW-RISK-PROPERTY'

    $ver = (New-PropertyVersion -PropertyName $name -CreateFromVersion latest).propertyVersion
    "new version: v$ver"

    # smallest real edit: set the default rule's comment
    $r = Get-PropertyRules -PropertyName $name -PropertyVersion $ver
    Update-PropertyRule -PropertyName $name -PropertyVersion $ver `
        -Path '/rules/comments' -Value "touched by PS101 lesson 07 on $(Get-Date -Format yyyy-MM-dd)" `
        -VersionNotes 'PS101 lesson 07 practice' -ValidateRules -PassThru |
        Select-Object -ExpandProperty errors

    $act = New-PropertyActivation -PropertyName $name -PropertyVersion $ver `
        -Network Staging -NotifyEmails 'you@company.com' -Note 'PS101 lesson 07'

    do { Start-Sleep 20
         $s = Get-PropertyActivation -PropertyName $name |
              Where-Object activationId -eq $act.activationId
         "$(Get-Date -Format T)  $($s.status)"
    } while ($s.status -notin 'ACTIVE','FAILED','ABORTED')
    ```

    ??? note "Show expected results & recovery"
        - `errors` line prints nothing → validation clean, good to activate.
        - Activation reaches `ACTIVE` in ~3–8 min on staging.  `FAILED` → run
          `Get-PropertyActivation` and read the full object; the message names
          the rule.
        - **Made a mess in the new version?** It's not active in production —
          just don't activate it there.  To discard it entirely:
          `Remove-PropertyVersion` (only unactivated versions).
        - **Activated the wrong thing to staging?** Staging has no customer
          impact.  Fix forward: new version, correct it, re-activate to staging.
        - Confirm the live production version never moved:
          `(Get-Property -PropertyName $name).productionVersion` is unchanged.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">You try <code>Update-PropertyRule</code> on the version that's live in production. Akamai:</p>
<button class="opt">Applies it and silently creates a new version to hold the change</button>
<button class="opt">Rejects it — an activated version cannot be edited, only cloned</button>
<button class="opt">Applies it in place, so production changes the moment you save it</button>
<p class="fb"
   data-correct="Right — active versions are immutable; you clone with New-PropertyVersion first."
   data-incorrect="Active versions are read-only. You must New-PropertyVersion first, then edit the clone."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">Validation returns an empty <code>errors</code> array but two <code>warnings</code>. You can:</p>
<button class="opt">Not activate at all until the two warnings are fully resolved</button>
<button class="opt">Activate immediately with no further step; warnings are advisory</button>
<button class="opt">Activate after reading and acknowledging both warnings explicitly</button>
<p class="fb"
   data-correct="Yes — warnings don't block, but activation makes you acknowledge them; read them first."
   data-incorrect="Warnings don't block activation, but you must acknowledge them — so read each one."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">The <code>-Path</code> parameter of <code>Update-PropertyRule</code> takes:</p>
<button class="opt">A JSON Pointer like <code>/rules/behaviors/2</code> into the rule tree</button>
<button class="opt">A Windows file path to the exported rule tree JSON file</button>
<button class="opt">The rule's display name exactly as shown in Control Center</button>
<p class="fb"
   data-correct="Correct — it's a JSON Pointer; index into behaviors/children arrays by position."
   data-incorrect="It's a JSON Pointer path, e.g. /rules/children/0/behaviors/1 — not a filename or a display name."></p>
</div>

!!! quote "Primary source — read this next"
    [Property Manager API — *Patch / update rules*](https://techdocs.akamai.com/property-mgr/reference/patch-property-version-rules)
    and [*Activate a property*](https://techdocs.akamai.com/property-mgr/reference/post-property-activations)
    for the status lifecycle (PENDING → ZONE_1/2/3 → ACTIVE).


<div id="lesson-meta" data-slug="07-update-a-property" hidden></div>

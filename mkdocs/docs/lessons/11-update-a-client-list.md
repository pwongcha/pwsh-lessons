# Lesson 11 · Update a client list

~12 min<br>:material-pencil: Writes — staging first<br>Needs Lesson 10
{ .lesson-meta }

**The fast-path change: edit a list and activate just the list — the
lowest-friction change on the platform.  No security-config version, no property
version.**

A security policy that references the list picks up the change the moment the
list is active.  This is why blocklists and allowlists live in client lists rather
than in rules.

**Goal:** a client list with a new, tagged, self-expiring entry active on
staging.

!!! danger "Before any write"
    `Get-AccountID | Get-AccountName` — confirm the account.

## The change model (recap)

```text
edit the list  →  activate the list  →  done
                  (no security-config version, no property version)
```

A security policy that references the list picks up the change the moment the
list is active.  This is why blocklists and allowlists live in client lists rather
than in rules.

## Add entries

```powershell
$id = '91_BLOCKABUSE'

# rich entries — value + metadata
$items = @(
    @{ value = '198.51.100.44/32'; description = 'SOC ticket 5099'; tags = @('soc','manual') }
    @{ value = '198.51.100.45/32'; description = 'scraper burst';   tags = @('auto');
       expirationDate = (Get-Date).AddDays(30).ToString('yyyy-MM-ddTHH:mm:ssZ') }
)
Add-ClientListItem -ListID $id -Items $items

# quick shorthand — values only
Add-ClientListItem -ListID $id -Items '203.0.113.10/32,203.0.113.11/32'
```

!!! warning "Set an expiry on temporary blocks"
    An entry with `expirationDate` auto-removes itself.  Without one, "temporary"
    blocks become permanent cruft nobody dares delete.

## Change or remove an entry

```powershell
Set-ClientListItem -ListID $id -Value '198.51.100.44/32' `
    -Description 'SOC ticket 5099 - confirmed botnet' -Tags 'soc','confirmed'

Remove-ClientListItem -ListID $id -Value '203.0.113.10/32'
```

## Bulk import from a file

```powershell
# ips.csv:  value,description,tags,expirationDate
Import-ClientListItem -ListID $id -File .\ips.csv
```

## Check what's pending before you activate

```text
PS> Get-ClientList -ListID $id | Select-Object version, stagingActivationStatus, productionActivationStatus
version stagingActivationStatus productionActivationStatus
------- ----------------------- --------------------------
     56 MODIFIED                MODIFIED

PS> Get-ClientListItem -ListID $id | Where-Object stagingStatus -ne 'ACTIVE' |
        Select-Object value, stagingStatus, description
```

## Activate

```powershell
$act = New-ClientListActivation -ListID $id -Network STAGING `
    -Comments 'lesson 11 — add SOC + auto blocks' `
    -NotificationRecipients 'you@company.com'

do {
    Start-Sleep 15
    $st = Get-ClientListActivationStatus -ListID $id -Environment STAGING
    "$(Get-Date -Format T)  $($st.activationStatus)"
} while ($st.activationStatus -notin 'ACTIVE','FAILED')
```

!!! tip "Parameter quirk"
    `New-ClientListActivation` uses `-Network STAGING`.
    `Get-ClientListActivationStatus` uses `-Environment STAGING`.  Same values,
    different parameter name — one of the module's few inconsistencies.

!!! danger "Production & allowlists"
    Blocklist production activation is low-risk and fast.  **Allowlist** changes
    are not: removing an entry from an allowlist that gates access can lock out
    staff or partners instantly.  Stage allowlist changes and verify before
    `-Network PRODUCTION`.

!!! example "Try it — one client-list change"
    On a test list, add a tagged, 7-day-expiring entry and activate to staging:

    ```powershell
    $id = 'YOUR-TEST-LIST'
    $item = @{ value = '192.0.2.99/32'; description = 'PS101 lesson 11 test'
               tags = @('ps101'); expirationDate = (Get-Date).AddDays(7).ToString('yyyy-MM-ddTHH:mm:ssZ') }

    Add-ClientListItem -ListID $id -Items @($item)
    Get-ClientListItem -ListID $id | Where-Object value -eq '192.0.2.99/32'

    $act = New-ClientListActivation -ListID $id -Network STAGING `
        -Comments 'PS101 lesson 11' -NotificationRecipients 'you@company.com'
    do { Start-Sleep 15
         $st = Get-ClientListActivationStatus -ListID $id -Environment STAGING
         "$(Get-Date -Format T)  $($st.activationStatus)"
    } while ($st.activationStatus -notin 'ACTIVE','FAILED')
    ```

    ??? note "Show expected results & recovery"
        - List version bumps, status goes `MODIFIED` → activation reaches
          `ACTIVE` in ~1–3 min (client-list staging is quick).  The entry
          disappears on its own in 7 days.
        - **Added the wrong value?**
          `Remove-ClientListItem -ListID $id -Value '192.0.2.99/32'`, re-activate
          staging.  Production untouched.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">You add an IP to a client list and activate the list to production. To make the referencing WAF config enforce it, you must also:</p>
<button class="opt">Clone the security config to a new version and activate that too</button>
<button class="opt">Nothing — the config reads the list live once the list is active</button>
<button class="opt">Re-select the hostnames on the config so it rereads the list</button>
<p class="fb"
   data-correct="Right — the config references the list by ID; activating the list is the entire change."
   data-incorrect="No config version needed. The reference is by ID; the active list is read directly."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">Which client-list change carries the most risk of an immediate outage?</p>
<button class="opt">Removing an entry from an allowlist that gates access to a service</button>
<button class="opt">Adding an entry to a blocklist referenced by a deny-mode policy</button>
<button class="opt">Adding a 30-day expiring entry to an alert-only reputation list</button>
<p class="fb"
   data-correct="Right — shrinking an allowlist can lock out legitimate users the instant it activates."
   data-incorrect="Allowlist removals are the dangerous ones — they revoke access immediately on activation."></p>
</div>

!!! quote "Primary source — read this next"
    [Client Lists API — *Activate a list*](https://techdocs.akamai.com/client-lists/reference/post-activate-list)
    and the [Client Lists product docs](https://techdocs.akamai.com/client-lists/docs)
    for the activation lifecycle.


<div id="lesson-meta" data-slug="11-update-a-client-list" hidden></div>

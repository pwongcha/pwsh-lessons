# Lesson 10 · View a client list

~12 min<br>:material-lock-open-variant: Read-only — safe<br>Needs a working `.edgerc`<br>Prep for Lesson 11
{ .lesson-meta }

**Find your lists, read their entries, and check what's active on each network —
before you change anything in Lesson 11.**

A **client list** is a reusable named set of values — IP ranges, countries, ASNs,
TLS fingerprints — that security policies and property rules point at instead of
hard-coding the values.  One list, many references.  This lesson reads them;
[Lesson 11](11-update-a-client-list.md) edits one.

**Goal:** a profile of any client list — its type, how many entries, which are
tagged or expiring, and exactly what's live on staging vs production.

## What a client list is

- **Types:** `IP` (addresses/CIDRs), `GEO` (country codes), `ASN`,
  `TLS_FINGERPRINT`, `FILE_HASH`, `USER_ID`.  A list holds one type.
- **Versioned and activated on its own.** A client list has its own `version`
  and its own staging/production activation — *separate* from any security
  config.  You can add an IP to a blocklist and push just the list, without
  touching the WAF config version.  This is the whole point: fast, low-risk
  changes.
- **Referenced, not embedded.** Security policies (network controls, custom rule
  conditions) and property rules refer to a list by its `listId`.  Editing the
  list changes behaviour everywhere it's used.

## List every client list

```text
PS> Get-ClientList |
        Select-Object listId, name, type, itemsCount, version,
                      stagingActivationStatus, productionActivationStatus

listId       name                    type  itemsCount version stagingActivationStatus productionActivationStatus
------       ----                    ----  ---------- ------- ----------------------- --------------------------
84_ALLOWOFFICE Office egress IPs      IP            12       7 ACTIVE                  ACTIVE
91_BLOCKABUSE  Abuse - auto blocklist IP           340      55 ACTIVE                  MODIFIED
77_APACGEO     APAC countries         GEO            8       3 ACTIVE                  ACTIVE
```

Filters:

```powershell
Get-ClientList -Type IP
Get-ClientList -Search "203.0.113"     # matches list OR entry details
Get-ClientList -Name "Abuse - auto blocklist"
```

!!! tip "Reading the status column"
    `ACTIVE` — live version matches current.  `MODIFIED` — the list has saved
    edits *newer* than what's active on that network (91_BLOCKABUSE above has
    unreleased changes for production).  `PENDING_ACTIVATION` /
    `PENDING_DEACTIVATION` — mid-flight.  `INACTIVE` — never activated there.

## Read one list and its entries

```text
PS> $id = '91_BLOCKABUSE'
PS> Get-ClientList -ListID $id -IncludeItems

# just the entries:
PS> Get-ClientListItem -ListID $id |
        Select-Object value, description, @{n='tags';e={$_.tags -join ','}},
                      expirationDate, productionStatus, stagingStatus

value            description              tags        expirationDate       productionStatus stagingStatus
-----            -----------              ----        --------------       ---------------- -------------
198.51.100.23/32 scraper burst 2026-08-14 auto,scrape 2026-09-14T00:00:00Z ACTIVE           ACTIVE
203.0.113.77/32  manual - SOC ticket 4821 soc                              PENDING          ACTIVE
```

- `value` — the entry (CIDR, country code, ASN…).
- `expirationDate` — if set, the entry is auto-removed after this time.  Great for
  temporary blocks.
- `productionStatus` / `stagingStatus` per entry — `ACTIVE`, `PENDING` (added,
  not yet activated), `STAGED`.

## Check activation state precisely

```powershell
Get-ClientListActivationStatus -ListID $id -Environment PRODUCTION
Get-ClientListActivationStatus -ListID $id -Environment STAGING

# recent activation history:
Get-ClientListActivation -ListID $id |
    Sort-Object createDate -Descending |
    Select-Object activationId, network, activationStatus, createDate, comments -First 5
```

If production shows `MODIFIED`, compare versions to see how far behind it is:
`(Get-ClientList -ListID $id).version` against the activation's version.

## Where is this list used?

Before you change a list, know its blast radius.  The list detail carries
reference links:

```powershell
(Get-ClientList -ListID $id).links      # or .references, depending on module version
```

Cross-check against security configs — a list appears in custom-rule
`ipMatch`/`geoMatch` conditions or network-layer controls:

```powershell
Get-AppSecCustomRule -ConfigName 'Example-Account Main WAF' |
    Where-Object { ($_ | ConvertTo-Json -Depth 8) -match $id } |
    Select-Object id, name
```

Control Center's client-list page shows the same "References" list if the API
view is unclear.

## Tags and expiry — the housekeeping view

```powershell
# entries expiring in the next 7 days
Get-ClientListItem -ListID $id |
    Where-Object { $_.expirationDate -and
        [datetime]$_.expirationDate -lt (Get-Date).AddDays(7) } |
    Select-Object value, expirationDate, description

# entry count by tag
Get-ClientListItem -ListID $id |
    ForEach-Object { $_.tags } |
    Group-Object | Select-Object Name, Count
```

!!! example "Try it — profile a client list"
    ```powershell
    $id = 'YOUR-LIST-ID'

    $list  = Get-ClientList -ListID $id
    $items = Get-ClientListItem -ListID $id

    "=== $($list.name)  [$($list.type)]  v$($list.version) ==="
    "entries : $($items.Count)"
    "staging : $($list.stagingActivationStatus)    production : $($list.productionActivationStatus)"

    "`n-- by tag --"
    $items | ForEach-Object { $_.tags } | Group-Object | Select-Object Name, Count

    "`n-- expiring within 30 days --"
    $items | Where-Object { $_.expirationDate -and
            [datetime]$_.expirationDate -lt (Get-Date).AddDays(30) } |
        Select-Object value, expirationDate, description | Format-Table -AutoSize

    "`n-- entries not yet active in production --"
    $items | Where-Object productionStatus -ne 'ACTIVE' |
        Select-Object value, productionStatus, description | Format-Table -AutoSize
    ```

    ??? note "Show how to read the profile"
        - **production status `MODIFIED`** + entries showing `PENDING` → someone
          added entries that were never activated to production.  Find out if
          that's intentional before Lesson 11.
        - **entry count vs `itemsCount`** from `Get-ClientList` should match; a
          mismatch usually means paging — add `-PageSize 1000`.
        - **many untagged entries** → hard to audit later.  Tags are how you
          answer "why is this IP here" in six months.
        - **expired-but-still-present** entries mean expiry isn't being enforced
          as expected — check the entries actually have `expirationDate` set, not
          just a note.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">You add one IP to a client list and activate the list to production. The security config that references it:</p>
<button class="opt">Must also be cloned to a new version and activated to production</button>
<button class="opt">Picks up the new IP automatically — it references the list by ID</button>
<button class="opt">Keeps using the old list contents until its own cache expires</button>
<p class="fb"
   data-correct="Right — configs reference the list by ID; activating the list is the whole change."
   data-incorrect="The config points at the list by ID. Activating the list is all that's needed."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">A list's <code>productionActivationStatus</code> is <code>MODIFIED</code>. This means:</p>
<button class="opt">The last production activation failed and the list rolled back</button>
<button class="opt">Another user is editing the list right now and holds a lock</button>
<button class="opt">The list has saved edits newer than the version live in production</button>
<p class="fb"
   data-correct="Yes — MODIFIED = unreleased changes; the live production version is behind the current one."
   data-incorrect="MODIFIED means the current list is ahead of what's activated in production — unreleased edits."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">An entry has an <code>expirationDate</code> two days from now. On that date Akamai will:</p>
<button class="opt">Remove the entry from the list automatically</button>
<button class="opt">Send a reminder email but keep the entry active</button>
<button class="opt">Deactivate the entire client list until reviewed</button>
<p class="fb"
   data-correct="Correct — expirationDate auto-removes just that entry; ideal for temporary blocks."
   data-incorrect="expirationDate auto-removes that one entry on the date. The rest of the list is untouched."></p>
</div>

!!! quote "Primary source — read this next"
    [Client Lists API — *List client lists / Get items*](https://techdocs.akamai.com/client-lists/reference/get-lists)
    and the [Client Lists product docs](https://techdocs.akamai.com/client-lists/docs)
    for the activation lifecycle.


<div id="lesson-meta" data-slug="10-view-a-client-list" hidden></div>

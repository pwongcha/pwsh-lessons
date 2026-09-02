# Lesson 04 · Map your account: contracts, groups, products

~12 min<br>:material-lock-open-variant: Read-only — totally safe<br>Needs a working `.edgerc`<br>Build your account map
{ .lesson-meta }

**The IDs every later cmdlet asks for — where they come from, how they nest, and
how to never type them by hand.**

[Lesson 03](03-api-client-and-edgerc.md) got `Get-AccountID` working.  Every cmdlet
from Lesson 05 onward — inspect a certificate, find a property, create a security
config version, make a client list — wants a **contract ID** and/or a **group ID**.  This lesson shows
you where they live and how to pull them once into a reusable "account map."

**Goal:** a small table showing every group you can work in, its contract, and
the products on that contract — and the two or three IDs you'll paste all week
held in variables.

## How Akamai IDs nest

```text
Account  (1-2ABCDE)
 ├─ Contract  (1-3CV382)      ── Products: Ion, DSA, AAP, ...
 │   └─ Group  (183542)        ← properties & security configs live here
 │        └─ Group  (183544)   ← groups form a tree
 └─ Contract  (1-3CV383)      ── Products: ...
```

- **Contract** — Contract agreement.  Determines which **products** you can use.
- **Group** — an access-control folder.  Properties, includes, and security
  configs belong to one group.  Groups nest, and a group is tied to one or more
  contracts.
- **Product** — e.g. `Fresca` (Ion), `SPM` (AAP).  Needed when you
  *create* a property.

!!! tip "What the IDs look like"
    Account and contract IDs are short codes like `1-3CV382`.  Group, property,
    and activation IDs are plain numbers like `183542`.  Most cmdlets also take
    the **name** instead of the ID — see [below](#you-can-often-pass-a-name-not-an-id).

## Pull the IDs

### Account

```text
PS> $acct = Get-AccountID
PS> $acct
1-2ABCDE
```

### Contracts

```text
PS> Get-PropertyContract
1-3CV382
1-3CV383

# richer detail (contract type, status):
PS> Get-Contract | Select-Object contractId, contractTypeName
```

### Groups — the tree

```text
PS> $groups = Get-Group
PS> $groups | Select-Object groupName, groupId, parentGroupId, contractIds

groupName            groupId  parentGroupId  contractIds
---------            -------   -------------  -----------
Example-Account - Top       183542                  {1-3CV382}
Example-Account - Web       183544   183542         {1-3CV382}
Example-Account - Security  183551   183542         {1-3CV382}
```

Find one by name instead of scrolling:

```powershell
Get-Group -GroupName "*Security*"
```

### Products on a contract

```text
PS> Get-Product -ContractID 1-3CV382 | Select-Object productId, productName
productId  productName
---------  -----------
Fresca     Ion
SPM        App & API Protector
```

## You can often pass a name, not an ID

The module keeps an in-memory **data cache** that resolves names → IDs for you.
 So many cmdlets accept `-GroupName "Example-Account - Web"` and look up `183544`
themselves.  That is convenient, but:

- Names are not unique across the tree; IDs are.  For anything you *write*, use
  the ID.
- If a lookup seems stale after you create a group/property, refresh it:
  `Clear-AkamaiDataCache` then `New-AkamaiDataCache`.

## Turn on the safety options (once)

These make every later lesson more forgiving.  Run once per session (or add to
`$PROFILE`):

```powershell
Set-AkamaiOptions -EnableErrorRetries $true `
                  -EnableRateLimitRetries $true `
                  -EnableRateLimitWarnings $true
Get-AkamaiOptions   # confirm
```

Retries handle transient `5xx`/`429` responses; the warning tells you when you're
near an endpoint's rate limit before it bites.

## The escape hatch

No cmdlet for something?  Every Akamai REST endpoint is reachable directly, still
EdgeGrid-signed:

```powershell
Invoke-AkamaiRestMethod -Method GET -Path "/papi/v1/contracts"
Invoke-AkamaiRestMethod -Method GET -Path "/papi/v1/groups" -Section example-account
```

Useful for reading a brand-new API before the module wraps it — and for learning
what a cmdlet does under the hood (`Get-Help <cmdlet> -Full` often names the
endpoint).

!!! example "Try it — build your account map"
    Run this.  It joins groups to their products so you can see, in one table,
    where you can work and what's available there.

    ```powershell
    $contracts = Get-PropertyContract
    $groups    = Get-Group

    foreach ($c in $contracts) {
        $products = (Get-Product -ContractID $c).productName -join ', '
        $groups |
          Where-Object { $_.contractIds -contains $c } |
          Select-Object @{n='Group';e={$_.groupName}},
                        @{n='GroupId';e={$_.groupId}},
                        @{n='Contract';e={$c}},
                        @{n='Products';e={$products}}
    } | Format-Table -AutoSize
    ```

    Then pick the group you'll use for the property lessons and stash its ID:

    ```powershell
    $grp = 'XXXXXX'   ;   $ctr = 'X-XXXXXX'
    ```

    ??? note "Show expected shape & notes"
        - A table: one row per (group × contract), with a comma-joined product
          list.  Groups tied to two contracts appear twice — expected.
        - `@{n='Name';e={...}}` is a **calculated property** — it builds a custom
          column with `Select-Object`.  You'll reuse this pattern constantly.
        - Empty `Products` for a contract usually means your API client lacks the
          *Products* API grant — harmless for the rest of the course.
        - Save it for later: append
          `| Export-Csv $HOME\akamai-account-map.csv -NoTypeInformation`.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">A cmdlet asks for a Contract ID. Which determines what that contract can even offer you?</p>
<button class="opt">The parent group that the contract is nested directly beneath</button>
<button class="opt">The set of products that are enabled on that contract</button>
<button class="opt">The account switch key currently applied to the session</button>
<p class="fb"
   data-correct="Right — products hang off the contract; the contract defines what you can deploy."
   data-incorrect="Products are attached to the contract. That's what a contract gates."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">You just created a new group and a lookup by name still fails. The fix is to:</p>
<button class="opt">Restart Windows so the module reloads its group list fully</button>
<button class="opt">Re-download your <code>.edgerc</code> credentials from Control Center</button>
<button class="opt">Run <code>Clear-AkamaiDataCache</code> then <code>New-AkamaiDataCache</code></button>
<p class="fb"
   data-correct="Yes — the name-to-ID cache is stale; clearing and rebuilding it picks up the new group."
   data-incorrect="It's the data cache. Clear it and rebuild; no restart or new credentials needed."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">There's no cmdlet for an endpoint you need. Your next move is:</p>
<button class="opt"><code>Invoke-AkamaiRestMethod -Method GET -Path "/the/endpoint"</code></button>
<button class="opt">Build the EdgeGrid signature yourself with <code>Invoke-RestMethod</code></button>
<button class="opt">Wait for the module to add a wrapper in its next monthly release</button>
<p class="fb"
   data-correct="Correct — it signs the request for you and reaches any Akamai REST path."
   data-incorrect="Use Invoke-AkamaiRestMethod — it handles EdgeGrid signing for any path."></p>
</div>

!!! quote "Primary source — read this next"
    [Akamai — *Base IDs*](https://techdocs.akamai.com/powershell/docs/base-ids.md)
    (account, contract, group, product — the canonical retrieval guide).  See also
    [Error handling and options](https://techdocs.akamai.com/powershell/docs/error-handling-and-options.md)
    for the safety options above.

<div id="lesson-meta" data-slug="04-account-base-ids" hidden></div>

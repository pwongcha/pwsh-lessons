# Lesson 05 · Inspect and update a certificate (CPS)

~16 min<br>:material-pencil: Writes — staging first<br>Needs a working `.edgerc`<br>Certificate lifecycle
{ .lesson-meta }

**Read a certificate's configuration, see where it's deployed, then make a
change — add a SAN — and walk it through CPS's gates to the staging network.**

The **Certificate Provisioning System (CPS)** issues and renews the TLS
certificates that terminate on Akamai edge hostnames.  You work with three things:

- **Enrollment** — one certificate's configuration and lifecycle.  Its
  `validationType` is `dv`, `ov`, `ev`, or `third-party`; DV enrollments are
  issued by Let's Encrypt, the rest by a CA you nominate.
- **Deployment** — the certificate actually live on a network.  Staging and
  production are tracked separately and can differ while a change is in flight.
- **Change** — any modification (new cert, added SAN, renewal).  A change moves
  through a series of states and, depending on the enrollment, waits for your
  acknowledgement before it deploys.

**Goal:** a certificate you can describe fully from the shell — its SANs,
its issuer, its expiry on each network — plus one SAN added and paused on
staging for review.

!!! danger "Before any write"
    `Get-AccountID | Get-AccountName` — confirm the account.  A certificate change
    touches live TLS termination: a wrong SAN list, or a cancelled renewal, can
    cause an outage or a silent expiry.  Keep **change management** enabled on
    enrollments you care about — it forces the staging pause you're about to use.

## List and read enrollments

```powershell
# every enrollment on a contract
Get-CPSEnrollment -ContractID 1-ABC123 |
    Select-Object id,
                  @{n='cn';   e={ $_.csr.cn }},
                  @{n='sans'; e={ $_.csr.sans -join ', ' }},
                  validationType, certificateType, pendingChanges

# one enrollment, whole object
$enr = Get-CPSEnrollment -EnrollmentID 123456
$enr | Format-List *
```

!!! warning "`-ContractID` and `-EnrollmentID` are either/or"
    They belong to different parameter sets.  `-ContractID` **lists** every
    enrollment on a contract; `-EnrollmentID` **fetches one**.  Passing both gives
    *"Parameter set cannot be resolved"*.  And the parameter is `-EnrollmentID`
    (or `-Enr…`), **not** `-id` — that alias only exists on the deployment and
    history cmdlets below.

`Get-CPSActiveCertificate -ContractID 1-ABC123` is the fast inventory view —
every enrollment with a currently active certificate, without the full config.

## Wrangling the output — table, CSV, JSON

CPS objects are deep — an enrollment nests `csr`, `networkConfiguration`, `org`,
contacts, `pendingChanges[]`.  Three ways to make a pile of them usable:

**A readable table** — choose columns, let PowerShell size them:

```powershell
Get-CPSEnrollment -ContractID 1-ABC123 |
    Select-Object id,
                  @{ n = 'cn';    e = { $_.csr.cn } },
                  @{ n = 'sans';  e = { $_.csr.sans.Count } },
                  validationType, certificateType |
    Format-Table -AutoSize
```

`Format-Table` (and `Format-List` / `Format-Wide`) is **display only** — never
pipe its output onward or into a file.  Shape with `Select-Object` first, format
last.  Use `$enr | Get-Member` to discover what fields exist.

**Export to CSV** — flatten nested fields to strings first; a CSV column can't
hold an array or object (it lands as `System.Object[]`):

```powershell
Get-CPSEnrollment -ContractID 1-ABC123 |
    Select-Object id,
                  @{ n = 'cn';   e = { $_.csr.cn } },
                  @{ n = 'sans'; e = { $_.csr.sans -join ';' } },
                  validationType, certificateType,
                  @{ n = 'pendingChange'; e = { [bool]$_.pendingChanges } } |
    Export-Csv .\cps-enrollments.csv -NoTypeInformation -Encoding UTF8
```

**Full JSON** — keep every field, for diffing or feeding back into a change.
CPS nests deeper than `ConvertTo-Json`'s default of 2 levels, so raise `-Depth`:

```powershell
Get-CPSEnrollment -EnrollmentID 123456 |
    ConvertTo-Json -Depth 20 |
    Set-Content .\enr-123456.json -Encoding UTF8

# read it back later:
$enr = Get-Content .\enr-123456.json -Raw | ConvertFrom-Json
```

## Where the certificate is deployed

```powershell
Get-CPSDeployment           -EnrollmentID 123456   # both networks
Get-CPSStagingDeployment    -EnrollmentID 123456
Get-CPSProductionDeployment -EnrollmentID 123456
```

A deployment object carries the deployed certificate itself — expiry,
SAN list, signature algorithm, deployment date.  Compare staging and production
before you change anything: if they already differ, a change is mid-flight.

## Certificate and change history

```powershell
Get-CPSCertificateHistory -EnrollmentID 123456   # every certificate ever deployed
Get-CPSChangeHistory      -EnrollmentID 123456   # every modification, with outcome
Get-CPSDVHistory          -EnrollmentID 123456   # domain-validation results over time
```

## Make a change — add a SAN

The pattern mirrors Property Manager: read the object, modify it, submit it,
then walk it through its gates.

```powershell
$enr = Get-CPSEnrollment -EnrollmentID 123456
$enr.csr.sans += 'new.example.com'

# submit — CPS opens a change
Set-CPSEnrollment -EnrollmentID 123456 -Body $enr

# the new change is now the enrollment's pending change
$changeId = (Get-CPSEnrollment -EnrollmentID 123456).pendingChanges[0].location.Split('/')[-1]
```

!!! warning "One change at a time"
    An enrollment holds a single pending change.  If one is already open,
    `Set-CPSEnrollment` fails unless you pass `-AllowCancelPendingChanges`
    (which discards the in-flight one — don't do that on a live renewal).

## Walk the change to staging

Never guess the next step — `Get-CPSChangeStatus` tells you which acknowledgement
CPS is waiting for in its `allowedInput` list.

```powershell
Get-CPSChangeStatus -EnrollmentID 123456 -ChangeID $changeId |
    Select-Object -ExpandProperty statusInfo

# typical gates for a Let's Encrypt DV change:
Get-CPSLetsEncryptChallenges             -EnrollmentID 123456 -ChangeID $changeId
Confirm-CPSLetsEncryptChallengesCompleted -EnrollmentID 123456 -ChangeID $changeId
Confirm-CPSPreVerificationWarnings  -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
Confirm-CPSPostVerificationWarnings -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
```

With **change management on**, the certificate now deploys to the **staging
network** and stops.  Verify it there, then promote:

```powershell
Get-CPSChangeStagingStatus -EnrollmentID 123456 -ChangeID $changeId

# final gate — this is the step that sends it to production:
Complete-CPSChange -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
```

With change management **off**, there is no pause — the change flows straight to
production once verification passes.  That's why the danger note above matters.

## Cancel a stuck change

```powershell
Remove-CPSChange -EnrollmentID 123456 -ChangeID $changeId
```

!!! example "Try it — read one enrollment end to end"
    Pick a real enrollment on your account.

    ```powershell
    $id = 123456

    Get-CPSEnrollment -EnrollmentID $id |
        Select-Object id, @{n='cn';e={$_.csr.cn}},
                      @{n='sans';e={$_.csr.sans -join ', '}}, validationType

    Get-CPSStagingDeployment    -EnrollmentID $id | Select-Object -ExpandProperty deploymentDate
    Get-CPSProductionDeployment -EnrollmentID $id | Select-Object -ExpandProperty deploymentDate

    Get-CPSChangeHistory -EnrollmentID $id |
        Select-Object -First 5 createdOn, changeType, @{n='status';e={$_.status}}
    ```

    **Optional, on a test enrollment only:** add a SAN, submit it, and take the
    change as far as `Confirm-CPSPreVerificationWarnings`.  **Stop before
    `Complete-CPSChange`** — that's the production step.

    ??? note "Show expected results & recovery"
        - Read side: `deploymentDate` on staging and production usually match.  A
          gap means an in-flight or failed change — check `Get-CPSChangeHistory`.
        - Write side: after `Set-CPSEnrollment`, `Get-CPSChangeStatus` reports a
          status like `wait-review-pre-verification-warnings`; its `allowedInput`
          names the next cmdlet.  Nothing has deployed yet.
        - **Want to back out?** `Remove-CPSChange -EnrollmentID $id -ChangeID $changeId`.
          The active certificate on both networks is untouched until a change
          actually deploys.
        - `Get-CPSEnrollment` returns nothing → your API client lacks the **CPS**
          grant, or the contract ID is wrong (Lesson 04).

## Quiz

<div class="quiz" data-answer="1">
<p class="q">What decides whether a CPS change pauses on the staging network for your approval before it reaches production?</p>
<button class="opt">The network value you pass when you submit the enrollment change</button>
<button class="opt">Whether change management is enabled on that enrollment</button>
<button class="opt">Whether the enrollment uses DV validation instead of third-party</button>
<p class="fb"
   data-correct="Right — change management on = deploy to staging, then wait for Complete-CPSChange before production."
   data-incorrect="It's the change-management setting on the enrollment. With it off, a verified change flows straight to production."></p>
</div>

<div class="quiz" data-answer="1">
<p class="q">A pending change isn't advancing and you're unsure what it needs next. Best move?</p>
<button class="opt">Re-submit the same enrollment body with Set-CPSEnrollment again</button>
<button class="opt">Read Get-CPSChangeStatus and act on its allowedInput list</button>
<button class="opt">Cancel the change with Remove-CPSChange and start the edit over</button>
<p class="fb"
   data-correct="Correct — allowedInput names exactly which acknowledgement or challenge cmdlet CPS expects next."
   data-incorrect="Check Get-CPSChangeStatus first — its allowedInput tells you the next step without guessing or cancelling."></p>
</div>

!!! quote "Primary source — read this next"
    [Certificate Provisioning System API](https://techdocs.akamai.com/cps/reference/api)
    — enrollments, changes, deployments, and the full change lifecycle diagram.

!!! question "Ask your teacher"
    Paste `Get-CPSEnrollment -EnrollmentID <id> | ConvertTo-Json -Depth 8` and
    tell me what you want to change — I'll help you find the right field and the
    gates that specific change will hit.

<div id="lesson-meta" data-slug="05-inspect-and-update-a-certificate" hidden></div>

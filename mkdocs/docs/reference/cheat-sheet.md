# Cheat sheet

The commands you reach for again and again.  `Ctrl/Cmd+P` → *Print* for a paper copy.

## PowerShell core

<div class="grid cards" markdown>

-   __Inspect & discover__

    ```powershell
    Get-Command *Property*      # find cmdlets
    Get-Help <cmd> -Examples
    Get-Help <cmd> -Online
    <obj> | Get-Member          # list properties
    <obj> | Format-List *       # see every field
    ```

-   __Shape a result__

    ```powershell
    ... | Where-Object { $_.x -eq 'y' }
    ... | Select-Object name, version
    ... | Select-Object -First 5
    ... | Sort-Object version -Descending
    ... | Measure-Object            # count
    ```

-   __Word operators__

    ```text
    -eq  -ne   equals / not
    -gt  -lt   greater / less
    -ge  -le   greater-eq / less-eq
    -like  'www*'    wildcard
    -match '^api\.'  regex
    -contains / -in  membership
    ```

-   __Variables & JSON__

    ```powershell
    $p = Get-Property -PropertyName x
    $p.latestVersion

    $o = $json | ConvertFrom-Json
    Get-Content .\c.json -Raw | ConvertFrom-Json
    $o | ConvertTo-Json -Depth 20
    ```

-   __Splatting (long param lists)__

    ```powershell
    $params = @{
      PropertyName = 'www.example.com'
      GroupID      = '123'
      ContractID   = '1-ABC'
    }
    New-Property @params
    ```

-   __Save & reuse output__

    ```powershell
    $props = Get-Group | ForEach-Object { $g=$_
        $g.contractIds | ForEach-Object { Get-Property -GroupID $g.groupId -ContractId $_ } }
    $props | Where-Object propertyName -like '*example*'
    $props | Export-Csv props.csv -NoTypeInformation
    $props | ConvertTo-Json -Depth 20 > props.json
    ```

</div>

## Akamai — setup

<div class="grid cards" markdown>

-   __Install (PS 5.1+)__

    ```powershell
    Install-Module Akamai -Scope CurrentUser
    # or one product at a time:
    Install-Module Akamai.Common
    Install-Module Akamai.Property
    Get-Module Akamai* -ListAvailable
    ```

-   __.edgerc (in your home folder)__

    ```ini
    [default]
    client_secret = xxxx
    host          = akab-xxxx.luna.akamaiapis.net
    access_token  = akab-xxxx
    client_token  = akab-xxxx

    [example-account]
    ...
    ```

-   __Pick credentials__

    ```text
    -EdgeRCFile C:\Users\you\.edgerc   # default path if omitted
    -Section example-account           # default: "default"
    # env vars instead: AKAMAI_HOST, AKAMAI_CLIENT_TOKEN, ...
    ```

-   __Account switching__

    ```powershell
    Get-AccountSwitchKey -Search "Example-Account"
    <any cmdlet> -AccountSwitchKey 1-ABC123:1-8BYUX
    # or AKAMAI_ACCOUNT_KEY env var
    ```

</div>

## Akamai — task → cmdlet map

One entry per lesson (05–12): the cmdlet sequence in call order, and — where the
syntax is fiddly enough to want it — a runnable snippet with real values.  Full
parameter lists and the reasoning are in the lesson linked from each heading.

### Inspect / update a certificate — CPS ([Lesson 05](../lessons/05-inspect-and-update-a-certificate.md))

1. `Get-CPSEnrollment` — `-ContractID` lists all; `-EnrollmentID` opens one
2. `Get-CPSStagingDeployment` / `Get-CPSProductionDeployment` — what's live now
3. `Get-CPSChangeHistory` — past modifications and outcomes (`Get-CPSCertificateHistory` = certs deployed)
4. Edit `$enr.csr.sans`, then `Set-CPSEnrollment -Body $enr` — submit the change
5. `Get-CPSChangeStatus` — read `allowedInput` for the next step it wants
6. `Confirm-CPSPreVerificationWarnings -Acknowledgement acknowledge`
7. `Complete-CPSChange -Acknowledgement acknowledge` — staging, then production

```powershell
# read
Get-CPSEnrollment -ContractID 1-ABC123 |
  Select id, @{n='cn';e={$_.csr.cn}}, @{n='sans';e={$_.csr.sans -join ','}}, validationType
$enr = Get-CPSEnrollment -EnrollmentID 123456
Get-CPSStagingDeployment    -EnrollmentID 123456
Get-CPSProductionDeployment -EnrollmentID 123456
Get-CPSChangeHistory        -EnrollmentID 123456   # modifications + outcome
Get-CPSCertificateHistory   -EnrollmentID 123456   # certs deployed

# add a SAN
$enr.csr.sans += 'new.example.com'
Set-CPSEnrollment -EnrollmentID 123456 -Body $enr
$changeId = (Get-CPSEnrollment -EnrollmentID 123456).pendingChanges[0].location.Split('/')[-1]

# walk the change → staging → production
Get-CPSChangeStatus -EnrollmentID 123456 -ChangeID $changeId   # read .allowedInput
Confirm-CPSLetsEncryptChallengesCompleted -EnrollmentID 123456 -ChangeID $changeId
Confirm-CPSPreVerificationWarnings  -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
Confirm-CPSPostVerificationWarnings -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
Complete-CPSChange  -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
Remove-CPSChange    -EnrollmentID 123456 -ChangeID $changeId   # cancel a stuck change
```

!!! note "Watch out"
    `-EnrollmentID` is not `-id`, and can't be combined with `-ContractID`.

### Find a property ([Lesson 06](../lessons/06-find-a-property.md))

1. `Find-Property -PropertyName www.example.com` — exact, no wildcards (or `-PropertyHostname`)
2. `Get-Property` → `Get-PropertyVersion` → `Get-PropertyHostname`
3. `Get-PropertyRules -PropertyVersion latest` — the rule tree

```powershell
Find-Property -PropertyName www.example.com                     # exact
Find-Property -PropertyHostname www.example.com
Find-Property -PropertyName www.example.com -JustProductionActive
$p = Get-Property -PropertyName www.example.com
$p.propertyId ; $p.latestVersion ; $p.productionVersion ; $p.stagingVersion

Get-PropertyVersion  -PropertyName x -PropertyVersion latest
Get-PropertyActivation -PropertyName x |
  Sort-Object submitDate -Descending |
  Select-Object -First 5 network, status, note
Get-PropertyHostname -PropertyName x -PropertyVersion latest |
  Select-Object cnameFrom, cnameTo, certStatus

$r = Get-PropertyRules -PropertyName x -PropertyVersion latest  # large JSON
$r.rules.children.name
$r.rules.behaviors | Where-Object name -eq 'origin'
```

*Fragment search:* enumerate `Get-Group` → `Get-Property -GroupID … -ContractId …`,
then `Where-Object propertyName -like '*www*'`.

### Update a property ([Lesson 07](../lessons/07-update-a-property.md))

1. `New-PropertyVersion -CreateFromVersion latest` — never edit the live version
2. `Get-PropertyRules … -OutputToFile` — pull the JSON, edit it
3. `Set-PropertyRules` (whole tree) / `Update-PropertyRule` (one rule) — push it back
4. `New-PropertyActivation -Network STAGING`
5. `Get-PropertyActivation` — poll until active

```powershell
$ver = (New-PropertyVersion -PropertyName x -CreateFromVersion latest).propertyVersion
Get-PropertyRules -PropertyName x -PropertyVersion $ver `
  -OutputToFile -OutputFileName x-v$ver.json                  # edit the file
# one setting:
Update-PropertyRule -PropertyName x -PropertyVersion $ver -Path '/…' -Body $behavior
# whole tree:
Set-PropertyRules   -PropertyName x -PropertyVersion $ver -InputFile x-v$ver.json -ValidateRules
New-PropertyActivation -PropertyName x -PropertyVersion $ver -Network STAGING -Note '...'
Get-PropertyActivation -PropertyName x | Sort-Object submitDate -Descending | Select -First 3
```

### Add a hostname to a security config ([Lesson 08](../lessons/08-add-hostname-to-security-config.md))

1. `Get-AppSecSelectableHostnames` — preflight: is the host addable?
2. `New-AppSecConfigurationVersion -CreateFromVersion latest`
3. `Add-AppSecSelectedHostnames` — add the hostname to the config
4. `Get-AppSecMatchTarget` — if it lists specific hosts, `Add-AppSecPolicySelectedHostnames` too
5. `New-AppSecActivation -Network STAGING -NotificationEmails …`
6. `Get-AppSecActivationStatus`

```powershell
Get-AppSecConfiguration | Select id,name,latestVersion,stagingVersion,productionVersion
Get-AppSecSelectableHostnames -ConfigName 'Main WAF' -VersionNumber latest

$v = (New-AppSecConfigurationVersion -ConfigName 'Main WAF' -CreateFromVersion latest).version
$body = @{ hostnameList = @( @{ hostname = 'new.example.com' } ) }
Add-AppSecSelectedHostnames -ConfigName 'Main WAF' -VersionNumber $v -Body $body

Get-AppSecMatchTarget -ConfigName 'Main WAF' -VersionNumber $v
# only if a match target lists specific hosts:
Add-AppSecPolicySelectedHostnames -ConfigName 'Main WAF' -VersionNumber $v -PolicyName 'Default' -Body $body

$a = New-AppSecActivation -ConfigName 'Main WAF' -VersionNumber $v `
       -Network STAGING -NotificationEmails 'you@co.com' -Note '...'
# if invalid hosts:  add -AcknowledgedInvalidHosts 'new.example.com'
Get-AppSecActivationStatus -ActivationID $a.activationId
```

### Review a custom rule + action ([Lesson 09](../lessons/09-review-custom-rule-action.md))

1. `Get-AppSecCustomRule -ConfigName …` — list rule definitions
2. `Get-AppSecCustomRule -RuleID …` — operator and conditions for one
3. `Get-AppSecPolicyCustomRule -PolicyName …` — the per-policy `action`
   (`alert` / `deny` / `deny_custom_{id}` / `none`)
4. `Set-AppSecPolicyCustomRule -Action deny` — retune

### View a client list ([Lesson 10](../lessons/10-view-a-client-list.md))

1. `Get-ClientList` — all lists (`-Type IP`, `-Search`, `-Name` to narrow)
2. `Get-ClientList -ListID … -IncludeItems` — one list with its entries
3. `Get-ClientListItem -ListID …` — just the entries
4. `Get-ClientListActivationStatus -ListID … -Environment PRODUCTION`

### Update a client list ([Lesson 11](../lessons/11-update-a-client-list.md))

1. Change entries: `Add-ClientListItem` / `Set-ClientListItem` /
   `Remove-ClientListItem` / `Import-ClientListItem -File ips.csv`
2. `New-ClientListActivation -ListID … -Network STAGING -Comments … -NotificationRecipients …`
3. `Get-ClientListActivationStatus -Environment STAGING`

### IAM / IDM management ([Lesson 12](../lessons/12-iam-idm-basics.md))

1. `Get-IAMUser` — all users; add `-UIIdentityID … -AuthGrants -Actions` for one
2. `Get-IAMRole`, `Get-IAMGrantableRole -GroupID …`, `Get-IAMGroup` — what you can assign
3. Change users: `New-IAMUser -SendEmail`, `Set-IAMUser`,
   `Lock-IAMUser` / `Unlock-IAMUser`, `Remove-IAMUser`

!!! warning "Golden rules"
    1. Reads (`Get-*`, `Find-*`) are always safe — explore freely.
    2. You never edit an active version; you make a *new* version, change that, then activate.
    3. Activate to `STAGING` first, verify, then `PRODUCTION`.
    4. `-AccountSwitchKey` on the wrong account is the most common expensive mistake — confirm with `Get-AccountSwitchKey` first.

!!! note "Parameter names vary by module version"
    Confirm with `Get-Help <cmdlet> -Full` or
    [techdocs.akamai.com/powershell](https://techdocs.akamai.com/powershell/docs/overview).
    Lessons 05–12 pin the exact syntax per task.

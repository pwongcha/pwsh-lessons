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
    -Section example-account                  # default: "default"
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

| Task | Cmdlets, in order |
| --- | --- |
| **Inspect / update a certificate (CPS)** | `Get-CPSEnrollment -ContractID …` (list) **or** `-EnrollmentID …` (one — not `-id`; can't combine with `-ContractID`) → `Get-CPSStagingDeployment` / `Get-CPSProductionDeployment` → `Get-CPSChangeHistory` → edit `$enr.csr.sans` → `Set-CPSEnrollment -EnrollmentID … -Body $enr` → `Get-CPSChangeStatus -ChangeID …` (read `allowedInput`) → `Confirm-CPSPreVerificationWarnings … -Acknowledgement acknowledge` → `Complete-CPSChange … -Acknowledgement acknowledge` (staging → production) |
| **Find a property** | `Find-Property -PropertyName www.example.com` (exact — no wildcards; or `-PropertyHostname`) → `Get-Property` → `Get-PropertyVersion` → `Get-PropertyHostname` → `Get-PropertyRules -PropertyVersion latest`.  Fragment search: enumerate `Get-Group` → `Get-Property -GroupID … -ContractId …` then `Where-Object propertyName -like '*www*'` |
| **Update a property** | `New-PropertyVersion -CreateFromVersion latest` → `Get-PropertyRules … -OutputToFile` (edit JSON) → `Set-PropertyRules` / `Update-PropertyRule` → `New-PropertyActivation -Network STAGING` → `Get-PropertyActivation` |
| **Add hostname to security config** | `Get-AppSecSelectableHostnames` (preflight) → `New-AppSecConfigurationVersion -CreateFromVersion latest` → `Add-AppSecSelectedHostnames -Body @{hostnameList=@(@{hostname='new.example.com'})}` → check `Get-AppSecMatchTarget` (else `Add-AppSecPolicySelectedHostnames`) → `New-AppSecActivation -Network STAGING -NotificationEmails …` → `Get-AppSecActivationStatus` |
| **Review a custom rule + action** | `Get-AppSecCustomRule -ConfigName …` (list defs) → `Get-AppSecCustomRule -RuleID …` (operator + conditions) → `Get-AppSecPolicyCustomRule -VersionNumber latest -PolicyName …` (per-policy `action`: alert / deny / deny_custom_{id} / none) → retune with `Set-AppSecPolicyCustomRule -Action deny` |
| **View a client list** | `Get-ClientList` (all; `-Type IP`, `-Search`, `-Name`) → `Get-ClientList -ListID … -IncludeItems` → `Get-ClientListItem -ListID …` → `Get-ClientListActivationStatus -ListID … -Environment PRODUCTION` |
| **Update a client list** | `Add-ClientListItem -ListID … -Items @(@{value='1.2.3.4/32';tags=@('soc');expirationDate='…Z'})` / `Set-ClientListItem -Value …` / `Remove-ClientListItem -Value …` / `Import-ClientListItem -File ips.csv` → `New-ClientListActivation -ListID … -Network STAGING -Comments … -NotificationRecipients …` → `Get-ClientListActivationStatus -Environment STAGING` |
| **IAM / IDM management** | `Get-IAMUser` / `Get-IAMUser -UIIdentityID … -AuthGrants -Actions` → `Get-IAMRole`, `Get-IAMGrantableRole -GroupID …`, `Get-IAMGroup` → `New-IAMUser -Body @{firstName;lastName;email;country;authGrants=@(@{groupId;roleId})} -SendEmail`, `Set-IAMUser`, `Lock-IAMUser` / `Unlock-IAMUser`, `Remove-IAMUser` |

!!! warning "Golden rules"
    1. Reads (`Get-*`, `Find-*`) are always safe — explore freely.
    2. You never edit an active version; you make a *new* version, change that, then activate.
    3. Activate to `STAGING` first, verify, then `PRODUCTION`.
    4. `-AccountSwitchKey` on the wrong account is the most common expensive mistake — confirm with `Get-AccountSwitchKey` first.

!!! note "Parameter names vary by module version"
    Confirm with `Get-Help <cmdlet> -Full` or
    [techdocs.akamai.com/powershell](https://techdocs.akamai.com/powershell/docs/overview).
    Lessons 05–11 pin the exact syntax per task.

## Certificates — CPS ([Lesson 05](../lessons/05-inspect-and-update-a-certificate.md))

<div class="grid cards" markdown>

-   __Read enrollments & deployments__

    ```powershell
    Get-CPSEnrollment -ContractID 1-ABC123 |
      Select id, @{n='cn';e={$_.csr.cn}}, @{n='sans';e={$_.csr.sans -join ','}}, validationType
    $enr = Get-CPSEnrollment -EnrollmentID 123456
    Get-CPSStagingDeployment    -EnrollmentID 123456
    Get-CPSProductionDeployment -EnrollmentID 123456
    Get-CPSCertificateHistory   -EnrollmentID 123456
    ```

-   __Submit a change (add a SAN)__

    ```powershell
    $enr.csr.sans += 'new.example.com'
    Set-CPSEnrollment -EnrollmentID 123456 -Body $enr
    $changeId = (Get-CPSEnrollment -EnrollmentID 123456).pendingChanges[0].location.Split('/')[-1]
    ```

-   __Walk the change → staging → production__

    ```powershell
    Get-CPSChangeStatus -EnrollmentID 123456 -ChangeID $changeId   # read .allowedInput
    Confirm-CPSLetsEncryptChallengesCompleted -EnrollmentID 123456 -ChangeID $changeId
    Confirm-CPSPreVerificationWarnings  -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
    Confirm-CPSPostVerificationWarnings -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
    Complete-CPSChange  -EnrollmentID 123456 -ChangeID $changeId -Acknowledgement acknowledge
    Remove-CPSChange    -EnrollmentID 123456 -ChangeID $changeId   # cancel a stuck change
    ```

</div>

## Property — read & inspect ([Lesson 06](../lessons/06-find-a-property.md))

<div class="grid cards" markdown>

-   __Find & open__

    ```powershell
    Find-Property -PropertyName www.example.com      # exact, no wildcards
    Find-Property -PropertyHostname www.example.com
    Find-Property -PropertyName www.example.com -JustProductionActive
    $p = Get-Property -PropertyName www.example.com
    $p.propertyId ; $p.latestVersion
    $p.productionVersion ; $p.stagingVersion
    ```

-   __Versions & activations__

    ```powershell
    Get-PropertyVersion -PropertyName x            # list all
    Get-PropertyVersion -PropertyName x -PropertyVersion latest
    Get-PropertyActivation -PropertyName x |
      Sort-Object submitDate -Descending |
      Select-Object -First 5 network, status, note
    ```

-   __Hostnames__

    ```powershell
    Get-PropertyHostname -PropertyName x -PropertyVersion latest |
      Select-Object cnameFrom, cnameTo, certStatus
    ```

-   __Rule tree (large JSON)__

    ```powershell
    $r = Get-PropertyRules -PropertyName x -PropertyVersion latest
    $r.rules.children.name                  # top-level rule names
    $r.rules.behaviors | Where-Object name -eq 'origin'
    Get-PropertyRules -PropertyName x -PropertyVersion latest `
      -OutputToFile -OutputFileName x-latest.json
    ```

</div>

## AppSec — hostnames & activation ([Lesson 08](../lessons/08-add-hostname-to-security-config.md))

<div class="grid cards" markdown>

-   __Find config & preflight__

    ```powershell
    Get-AppSecConfiguration | Select id,name,latestVersion,stagingVersion,productionVersion
    Get-AppSecConfiguration -ConfigName 'Main WAF'
    Get-AppSecSelectableHostnames -ConfigName 'Main WAF' -VersionNumber latest
    ```

-   __New version + add hostname__

    ```powershell
    $v = (New-AppSecConfigurationVersion -ConfigName 'Main WAF' `
            -CreateFromVersion latest).version
    $body = @{ hostnameList = @( @{ hostname = 'new.example.com' } ) }
    Add-AppSecSelectedHostnames -ConfigName 'Main WAF' -VersionNumber $v -Body $body
    (Get-AppSecSelectedHostnames -ConfigName 'Main WAF' -VersionNumber $v).hostnameList.hostname
    ```

-   __Policy / match target__

    ```powershell
    Get-AppSecMatchTarget -ConfigName 'Main WAF' -VersionNumber $v
    Get-AppSecPolicy      -ConfigName 'Main WAF' -VersionNumber $v
    # only if match target lists specific hosts:
    Add-AppSecPolicySelectedHostnames -ConfigName 'Main WAF' -VersionNumber $v `
      -PolicyName 'Default' -Body $body
    ```

-   __Activate & poll__

    ```powershell
    $a = New-AppSecActivation -ConfigName 'Main WAF' -VersionNumber $v `
          -Network STAGING -NotificationEmails 'you@co.com' -Note '...'
    # if invalid hosts: add -AcknowledgedInvalidHosts 'new.example.com'
    Get-AppSecActivationStatus -ActivationID $a.activationId
    ```

</div>

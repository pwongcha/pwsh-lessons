# Lesson 12 · IAM / IDM basics

~10 min<br>:material-pencil: Writes — staging first
{ .lesson-meta }

**A working tour of Identity & Access Management from the shell: users, roles,
and groups.**

Last one.  IAM (also called IDM — Identity Management) is how you administer
*who* can operate the account and *where* their permissions apply.

**Goal:** an IAM audit you can run against your account today.

!!! danger "Before any write"
    `Get-AccountID | Get-AccountName` — confirm the account.  IAM changes
    especially: you can lock yourself out.

## The model

```text
Identity (user)
   └─ authGrants[]  ──  role  ×  group      "roleId 340 in 183544"
API client                                  (Lesson 03 — same grant model)
Role   = a named bundle of permissions
Group  = where the role applies (the access-control tree from Lesson 04)
```

## Read

```powershell
Get-IAMUser | Select-Object uiIdentityId, firstName, lastName, email, lastLoginDate, isLocked

# one user, with their grants and what you can do to them
Get-IAMUser -UIIdentityID 'B-1-ABC123' -AuthGrants -Actions

# roles, and which you're allowed to grant in a group
Get-IAMRole | Select-Object roleId, roleName
Get-IAMGrantableRole -GroupID 183544

# the group tree (IAM view)
Get-IAMGroup | Select-Object groupId, groupName, parentGroupId
```

## Common changes

```powershell
# create a user with one role in one group, email them a one-time password
$body = @{
    firstName = 'Aiko'; lastName = 'Tanaka'; email = 'aiko.tanaka@company.com'
    country = 'Japan'
    authGrants = @( @{ groupId = 183544; roleId = 340 } )
}
New-IAMUser -Body $body -SendEmail

# update, lock, unlock, remove
Set-IAMUser -UIIdentityID 'B-1-ABC123' -Body @{ jobTitle = 'SOC Lead' }
Lock-IAMUser   -UIIdentityID 'B-1-ABC123'   # suspend access immediately
Unlock-IAMUser -UIIdentityID 'B-1-ABC123'
Remove-IAMUser -UIIdentityID 'B-1-ABC123'
```

!!! danger "Don't lock yourself out"
    Changing your own `authGrants`, or locking the account you're authenticated
    as, can end your session with no way back except another admin.  Test grant
    changes on a low-privilege user first.

## An audit you can run today

```powershell
$users = Get-IAMUser -AuthGrants

# stale: no login in 90+ days
$users | Where-Object { $_.lastLoginDate -and
        [datetime]$_.lastLoginDate -lt (Get-Date).AddDays(-90) } |
    Select-Object email, lastLoginDate

# locked accounts still holding grants
$users | Where-Object isLocked | Select-Object email, isLocked

# never logged in at all
$users | Where-Object { -not $_.lastLoginDate } | Select-Object email, createDate
```

!!! example "Try it — one IAM audit"
    Run the stale-user and locked-user checks from "An audit you can run today"
    against your account.  Write down how many of each you find.

    ??? note "Show expected results & recovery"
        - Most accounts have a few stale users — that's the point of running it.
          Locked users with live grants are the ones to raise.
        - `Get-IAMUser` returns nothing → your API client lacks the *User Admin*
          grant.  Read-only IAM still needs an explicit grant in Control Center.

## Quiz

<div class="quiz" data-answer="2">
<p class="q">In IAM, a role determines <em>what</em> a user can do. What determines <em>where</em> it applies?</p>
<button class="opt">The user's country field, set on their identity profile record</button>
<button class="opt">The API client section chosen in the <code>.edgerc</code> for the call</button>
<button class="opt">The group the role is granted in, from the access-control tree</button>
<p class="fb"
   data-correct="Correct — an authGrant pairs a roleId with a groupId; the group scopes the permissions."
   data-incorrect="Scope is the group. An authGrant is roleId x groupId — the group says where the role applies."></p>
</div>

## Course complete — the 12 lessons vs your mission

| Task | Lessons |
| --- | --- |
| Install & set up | [02](02-install-the-module.md)–[04](04-account-base-ids.md) |
| Inspect / update a certificate | [05](05-inspect-and-update-a-certificate.md) |
| Find / update a property | [06](06-find-a-property.md)–[07](07-update-a-property.md) |
| Add a hostname to a security config | [08](08-add-hostname-to-security-config.md) |
| Review a custom rule + action | [09](09-review-custom-rule-action.md) |
| View / update a client list | [10](10-view-a-client-list.md)–[11](11-update-a-client-list.md) |
| IAM / IDM management | [12](12-iam-idm-basics.md) |

**To make it stick:** pick one real task from your week and do it in PowerShell
instead of Control Center.  Keep the [cheat sheet](../reference/cheat-sheet.md)
open.  Come back to the lessons only when a step doesn't behave.

**Wisdom — test your skills with people:**

- [Akamai Community](https://community.akamai.com/) — staffed; the place for "is
  this the right cmdlet / why does this activation fail" questions.
- [akamai/PowerShell GitHub Issues](https://github.com/akamai/PowerShell/issues) —
  check here first when a cmdlet misbehaves; parameter names shift between versions.
- [r/PowerShell](https://www.reddit.com/r/PowerShell/) — for the PowerShell
  technique itself (pipelines, objects, scripting), not Akamai specifics.


!!! quote "Primary source — read this next"
    [Identity & Access Management API](https://techdocs.akamai.com/iam-user-admin/reference/api)
    — users, roles, groups, and the grant model.


<div id="lesson-meta" data-slug="12-iam-idm-basics" hidden></div>

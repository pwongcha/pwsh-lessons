# Lesson 02 · Install the Akamai module

~10 min<br>:material-lock-open-variant: No credentials yet<br>Windows 10/11<br>One-time setup
{ .lesson-meta }

**Install the toolset and prove your environment is ready** — before you go near
a credential.

In [Lesson 01](01-powershell-primer.md) you learned to shape objects.  Now you
install the Akamai PowerShell module.  It is published on the **PowerShell
Gallery** (Microsoft's public module repository) — one command pulls it down.  No
credentials are involved yet; that is [Lesson 03](03-api-client-and-edgerc.md).

**Goal:** `Import-Module Akamai` succeeds and `Get-Command -Module Akamai*`
lists hundreds of cmdlets.  Your machine can now talk to Akamai — it just needs
keys.

## Check which PowerShell you have

Open PowerShell from the Start menu and run:

```text
PS> $PSVersionTable.PSVersion

Major  Minor  Build  Revision
-----  -----  -----  --------
5      1      19041  4894
```

The Akamai module needs **version 5.1 or higher**.  Every Windows 10/11 machine
ships with **Windows PowerShell 5.1**, so you are already good to go.

!!! tip "Two different apps, similar names"
    **Windows PowerShell 5.1** — blue icon, pre-installed, based on .NET
    Framework, Windows-only.  Fine for this course.

    **PowerShell 7** — black icon, installed separately, faster, cross-platform,
    actively developed.  Recommended if you will live in the shell.

### Optional: install PowerShell 7

Skip this if you want to keep moving — you can switch later.

```powershell
winget install --id Microsoft.PowerShell --source winget
```

Then open "PowerShell 7" (or `pwsh`) instead of the blue one.  *The rest of this
course works identically in both.*

## Prepare the PowerShell Gallery (Windows PowerShell 5.1 only)

By default, Windows PowerShell 5.1 tries to reach the Gallery over an outdated
security protocol and fails with `Unable to resolve package source`.  Force modern
TLS for this session:

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
```

If you are on **PowerShell 7**, you do not need this line.

!!! note "Make it permanent (optional)"
    Add that line to your profile so you never think about it again:
    `notepad $PROFILE` → paste the line → save.  New windows run it automatically.

    Prefer another editor?  `code $PROFILE`, or for Notepad++:
    `& 'C:\Program Files\Notepad++\notepad++.exe' $PROFILE`.  If the profile
    doesn't exist yet, run `New-Item -ItemType File -Path $PROFILE -Force` first.

## Remove the old v1 module if it is there

Akamai PowerShell **v2** is a rewrite and cannot coexist with the old
`AkamaiPowershell` (v1) module.

```powershell
Get-Module AkamaiPowershell -ListAvailable

# if anything is listed:
Uninstall-Module AkamaiPowershell -AllVersions
```

Nothing listed?  Good — you are on a clean machine, move on.

## Install the module

Install the **full** module.  It is a bundle of product submodules
(`Akamai.Property`, `Akamai.AppSec`, `Akamai.IAM`, `Akamai.Common`, and ~15
more) — for this course you want all of them.

```powershell
Install-Module Akamai -Scope CurrentUser
```

- `-Scope CurrentUser` installs into your profile — **no admin rights needed**.
- First time from the Gallery you will be asked to trust the repository and/or
  install the NuGet provider — answer `Y` (or `A` for "yes to all").

!!! warning "Later, if you want a smaller footprint"
    You can install one product at a time instead — `Install-Module Akamai.Common`
    then `Install-Module Akamai.Property`.  `Akamai.Common` is always required; it
    holds the authentication and account plumbing every other submodule depends on.

## Load it and read the warning

```text
PS> Import-Module Akamai

WARNING: The names of some imported commands from the module 'Akamai'
include unapproved verbs that might make them less discoverable...
```

That warning is **expected and harmless** — you met it in Lesson 01.  Some Akamai
cmdlets use verbs like `Activate` or `Purge` that are not on PowerShell's
approved list.  The module works normally.

In **PowerShell 7** and recent `Install-Module` versions, importing is automatic
the first time you call any Akamai cmdlet — you may not need `Import-Module` at all.

## Verify

```text
PS> Get-Module Akamai* | Select-Object Name, Version

Name            Version
----            -------
Akamai.Common   2.x.x
Akamai.Property  2.x.x
Akamai.AppSec   2.x.x
...

PS> Get-Command -Module Akamai* | Measure-Object

Count : 600+

PS> Get-Command *AppSecCustomRule*

CommandType  Name                        Version  Source
-----------  ----                        -------  ------
Function     Get-AppSecCustomRule        2.x.x    Akamai.AppSec
Function     Get-AppSecPolicyCustomRule  2.x.x    Akamai.AppSec
Function     New-AppSecCustomRule        2.x.x    Akamai.AppSec
```

Getting cmdlet names back — even though every real call would fail right now with
an authentication error — means the install is done.  That error is the subject of
Lesson 03.

## Keeping it current

```powershell
Update-Module Akamai        # pull the latest
Get-InstalledModule Akamai  # what you have now
```

Check for an update whenever a cmdlet behaves oddly — the module tracks Akamai's
APIs and moves quickly.

!!! example "Try it — the readiness checklist"
    Run these five in order.  Compare each against the reveal.  If all five pass,
    you are ready for Lesson 03.

    ```powershell
    # 1
    $PSVersionTable.PSVersion
    # 2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    # 3
    Install-Module Akamai -Scope CurrentUser
    # 4
    Import-Module Akamai
    # 5
    Get-Command -Module Akamai* | Measure-Object | Select-Object Count
    ```

    ??? note "Show expected results & common snags"
        - **1** — Major `5` Minor `1` (or Major `7`).  Anything lower: stop,
          install PowerShell 7.
        - **2** — no output at all.  That is success.  (Skip on PowerShell 7.)
        - **3** — a one-time trust prompt, then a progress bar, then back to the
          prompt.  *"Unable to resolve package source"* → you skipped step 2.
          *"Administrator rights are required"* → you left off `-Scope CurrentUser`.
        - **4** — the unapproved-verbs WARNING.  Expected.  Not an error.
        - **5** — `Count` in the hundreds.  If it is `0`, the import did not take —
          close PowerShell, reopen, run `Import-Module Akamai` again.

## Quiz

<div class="quiz" data-answer="2">
<p class="q">You run <code>Install-Module Akamai</code> and it says administrator rights are required. The fix is to:</p>
<button class="opt">Right-click PowerShell and choose the Run as administrator option</button>
<button class="opt">Switch your account type to Administrator in Windows Settings</button>
<button class="opt">Re-run the command adding the <code>-Scope CurrentUser</code> parameter</button>
<p class="fb"
   data-correct="Right — CurrentUser scope installs into your profile and needs no elevation."
   data-incorrect="No elevation needed. -Scope CurrentUser installs into your own profile folder."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">Importing the module prints a yellow WARNING about unapproved verbs. You should:</p>
<button class="opt">Carry on — it is cosmetic and every Akamai session shows it</button>
<button class="opt">Uninstall, then reinstall the module with the force option set</button>
<button class="opt">Run the import again inside an administrator PowerShell window</button>
<p class="fb"
   data-correct="Correct — Activate/Purge aren't approved verbs; nothing is broken."
   data-incorrect="It's cosmetic. The module loaded fine; the warning appears every time."></p>
</div>

<div class="quiz" data-answer="1">
<p class="q">On Windows PowerShell 5.1, <code>Install-Module</code> fails with unable to resolve package source. The cause is:</p>
<button class="opt">The PowerShell Gallery is down and you must wait and retry</button>
<button class="opt">The session is using old TLS; set <code>SecurityProtocol</code> to Tls12</button>
<button class="opt">The Akamai module was pulled from the Gallery and renamed</button>
<p class="fb"
   data-correct="Yes — 5.1 defaults to old TLS; the Gallery requires TLS 1.2."
   data-incorrect="It's TLS. Windows PowerShell 5.1 defaults to old TLS; the Gallery needs TLS 1.2."></p>
</div>

!!! quote "Primary source — read this next"
    [Akamai — *PowerShell Module Overview*](https://techdocs.akamai.com/powershell/docs/overview)
    (install options, submodule architecture, v1→v2 notes).  Secondary:
    [Microsoft — *Installing PowerShell on Windows*](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows)
    if you want PowerShell 7.

<div id="lesson-meta" data-slug="02-install-the-module" hidden></div>

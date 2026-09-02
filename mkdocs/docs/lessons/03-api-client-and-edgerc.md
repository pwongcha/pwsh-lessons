# Lesson 03 · Create an API client and set up `.edgerc`

~15 min<br>:material-key: Needs a Control Center login<br>One-time setup<br>First real API call
{ .lesson-meta }

**Turn Control Center access into API credentials, store them safely, and make
your first real authenticated call.**

[Lesson 02](02-install-the-module.md) left you with hundreds of cmdlets that all
fail with an authentication error.  This lesson fixes that.  You will create an
**API client** in Control Center, save its four secret values into a file called
`.edgerc`, and prove it works with `Get-AccountID`.

**Goal:** `Get-AccountID` returns your account identifier.  Every later lesson —
property, security, client lists, IAM — just works from here.

## How Akamai API auth works (30 seconds)

Akamai uses a scheme called **EdgeGrid**.  An **API client** is a set of four
values that together sign every request:

| Value | What it is |
| --- | --- |
| `host` | Your account's API endpoint, like `akab-xxxx.luna.akamaiapis.net` |
| `client_token` | Identifies the API client |
| `client_secret` | Signs the request (the actual secret) |
| `access_token` | Grants the client its permissions |

The module reads these from a plain-text file named `.edgerc` in your home
folder.

## Create a Basic API client in Control Center

1. Log in to [Control Center](https://control.akamai.com).
2. Open the **☰** menu → **Account Admin** → **Identity & access**.
3. Select the **API clients** tab → **Create API client** → **Quick**.
4. "Quick" gives the client **your own access level** for the **first 99 APIs**
   on the account.  Select **Create API client**.
5. On the client's page, open the **Credentials** section → **⋯** → **Download**
   (or **Show** and copy each value).

!!! danger "Security — read before you click Create"
    - **Least privilege.** A "Quick" client inherits *all* your permissions.  If
      you only need to read this week, create an **Advanced** client scoped to
      *read-only* for Property Manager / AppSec instead.  You can widen it later.
    - **The `client_secret` is shown once.** If you lose it, you rotate the
      credential, you don't recover it.
    - Set an **expiry** on the credential (Control Center lets you).  Rotate on a
      schedule.

## Build the `.edgerc` file

The downloaded file is *almost* right — it is missing a section header.  The
module needs each credential set wrapped in a named section in square brackets.
Open the file in your home folder for editing:

```powershell
notepad $HOME\.edgerc
```

Say **Yes** to "create new file", then paste this — replacing the values with
yours:

```ini
[default]
host = akab-xxxxxxxxxxxxxxxx.luna.akamaiapis.net
client_token = akab-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx
client_secret = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
access_token = akab-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx
```

- The section name in brackets is `default` — the module uses that section
  unless you tell it otherwise.
- Order of the four lines does not matter.

!!! tip "Prefer Notepad++ or VS Code?"
    Neither is on `PATH` by default.  Call the full path once, or add a function
    to your `$PROFILE` so you can reuse it:

    ```powershell
    # Notepad++
    function npp { & 'C:\Program Files\Notepad++\notepad++.exe' @args }
    npp $HOME\.edgerc

    # VS Code — its installer usually does add `code` to PATH
    code $HOME\.edgerc
    ```

    Both write a dot-file cleanly, with no "Save as type → All Files".  If
    `$HOME\.edgerc` doesn't exist yet they open a blank buffer — you must
    **Save** it to create the file (Notepad prompts you; the others don't).

!!! warning "The Notepad gotcha"
    Notepad may save the file as `.edgerc.txt`.  In the Save dialog set **"Save as
    type" → "All Files"** and type the literal path
    `C:\Users\YOURNAME\.edgerc`.  Verify afterwards:

    ```powershell
    Test-Path $HOME\.edgerc       # must say True
    Get-ChildItem $HOME\.edgerc   # name must be exactly ".edgerc"
    ```

!!! danger "Protect the file"
    `.edgerc` is plain text.  Never put it in a folder that syncs to a repo, a
    shared drive, or OneDrive-with-sharing.  Never paste its contents into chat,
    tickets, or screenshots.

## Make your first real call

```text
PS> Import-Module Akamai
PS> Get-AccountID

1-2ABCDE
```

An account ID back means **authentication works**.  Confirm what the module loaded:

```powershell
Get-EdgegridCredentials            # shows host + which section was used
Get-AccountID | Get-AccountName    # check you're on the right account
```

!!! warning "Reading auth errors"
    - **401 Unauthorized / "signature does not match"** — a value in `.edgerc`
      is wrong or has a stray space/line break.  Re-paste all four.
    - **403 Forbidden** — credentials are valid but the client lacks permission
      for that API.  Widen the client's grants in Control Center.
    - **"Could not find EdgeRC file"** — file is not at `$HOME\.edgerc`, or is
      named `.edgerc.txt`.
    - **"Section 'default' not found"** — you pasted the values but forgot the
      `[default]` header line.

## More than one credential: sections

One `.edgerc` can hold many sections — one per account, environment, or
permission level:

```ini
[default]
host = akab-aaaa.luna.akamaiapis.net
...

[example-account]
host = akab-bbbb.luna.akamaiapis.net
...

[readonly]
host = akab-cccc.luna.akamaiapis.net
...
```

Pick a non-default section on any cmdlet with `-Section`.  Every Akamai cmdlet
also accepts `-EdgeRCFile` for a file in a non-standard location:

```powershell
Get-AccountID -Section example-account
Get-Property -Section readonly -EdgeRCFile D:\keys\.edgerc
```

## Working across accounts: switch keys

If your API client is enabled for multiple accounts (common for partners and
internal teams), you stay in one `.edgerc` section and *switch* the target
account per call.

```text
PS> Get-AccountSwitchKey -Search "Example-Account"

accountId        accountName
---------        -----------
1-2ABCDE:1-8BYUX  Example-Account ...

PS> Get-AccountID -AccountSwitchKey "1-2ABCDE:1-8BYUX"
```

- `-Search` needs at least three characters; it matches account name or ID.
- Add `-AccountSwitchKey` to **every** cmdlet you want to run against that account.
- Prefer to set it once for a session?  Use the environment variable:
  `$env:AKAMAI_ACCOUNT_KEY = "1-2ABCDE:1-8BYUX"`.

!!! danger "The expensive mistake"
    Running a `Set-`, `New-`, or `Activate-` cmdlet against the wrong account.
    **Always** run `Get-AccountID | Get-AccountName` first and read it out loud
    before any write.

## Alternative: environment variables

On a shared or locked-down machine where you would rather not leave a file, set
these instead of using `.edgerc`:

```powershell
$env:AKAMAI_HOST          = "akab-xxxx.luna.akamaiapis.net"
$env:AKAMAI_CLIENT_TOKEN  = "akab-xxxx"
$env:AKAMAI_CLIENT_SECRET = "xxxx="
$env:AKAMAI_ACCESS_TOKEN  = "akab-xxxx"
```

For a named section use `AKAMAI_<SECTION>_HOST` etc.  These live only for the
current window unless you set them permanently.

!!! example "Try it — from zero credentials to a verified call"
    1. Create a **Quick** (or read-only Advanced) API client in Control Center
       and download the credentials.
    2. Run `notepad $HOME\.edgerc` (or `npp` / `code` — see the tip above),
       paste a `[default]` section with your four values, save.
    3. Run each of these and compare to the reveal:

    ```powershell
    Test-Path $HOME\.edgerc
    Import-Module Akamai
    Get-AccountID
    Get-EdgegridCredentials
    Get-AccountID | Get-AccountName
    ```

    If your client sees more than one account, also run
    `Get-AccountSwitchKey -Search "<3+ letters of the account>"`.

    ??? note "Show expected results & troubleshooting"
        - `Test-Path` → `True`.  `False` means wrong name/location (check for
          `.edgerc.txt`).
        - `Get-AccountID` → a string like `1-2ABCDE`.  An error here is auth —
          see the Reading auth errors list above.
        - `Get-EdgegridCredentials` → shows the `host` and section in use.
          Confirms the file parsed.
        - `Get-AccountName` → the human account name.  **Read it.  Is it the
          account you meant?**
        - `401` → re-paste all four values, watch for trailing spaces and the
          `=` at the end of `client_secret`.  `403` → client needs more
          permission in Control Center.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">You paste your four credential values into <code>.edgerc</code> but the call says section default not found. You forgot to:</p>
<button class="opt">Wrap every one of the four values in matching double quotes</button>
<button class="opt">Put the <code>[default]</code> header line above the four values</button>
<button class="opt">Run the PowerShell window with administrator rights enabled</button>
<p class="fb"
   data-correct="Right — the module keys credentials by bracketed section name; default is just the fallback name."
   data-incorrect="The module needs a [section] header. default is the section name it looks for by default."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">Your API client works for three accounts. To read a property on the second one, you:</p>
<button class="opt">Add a second <code>[default]</code> section holding that account's own keys</button>
<button class="opt">Log into Control Center as that account and download fresh keys</button>
<button class="opt">Pass <code>-AccountSwitchKey</code> from <code>Get-AccountSwitchKey</code> on the call</button>
<p class="fb"
   data-correct="Yes — one credential, switch the target account per call with the switch key."
   data-incorrect="Multi-account clients use -AccountSwitchKey per call; you don't need separate credentials."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">Before running any <code>Set-</code> or <code>New-</code> cmdlet, the habit that prevents the costliest mistake is:</p>
<button class="opt">Run <code>Get-AccountID | Get-AccountName</code> and confirm the account</button>
<button class="opt">Run <code>Update-Module Akamai</code> to be sure the module is current</button>
<button class="opt">Run <code>Clear-EdgeGridCredentials</code> so no stale keys are cached</button>
<p class="fb"
   data-correct="Correct — writing to the wrong account is the expensive error; name it before you act."
   data-incorrect="The costly mistake is writing to the wrong account. Confirm the account name first, every time."></p>
</div>

!!! quote "Primary source — read this next"
    [Akamai — *PowerShell Authentication*](https://techdocs.akamai.com/powershell/docs/authentication.md)
    (API client types, `.edgerc` format, sections, environment variables,
    account switching).  Background:
    [Akamai — *Create authentication credentials*](https://techdocs.akamai.com/developer/docs/set-up-authentication-credentials).

<div id="lesson-meta" data-slug="03-api-client-and-edgerc" hidden></div>

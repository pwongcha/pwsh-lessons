# Lesson 01 · PowerShell primer

~12 min<br>:material-lock-open-variant: No credentials needed<br>Windows 10/11
{ .lesson-meta }

**The five PowerShell ideas you need before touching the Akamai module** —
cmdlets, the pipeline, objects, `Get-Help`, and JSON — practised on a real
Akamai response, no credentials required.

You already know Akamai — properties, security configs, client lists.  What is new is the *shell*.  The Akamai PowerShell module is just a
set of commands that call the same APIs behind Control Center.  But every one of
those commands returns a PowerShell **object**, and if objects and the pipeline
feel foreign, every later lesson will feel like guesswork.

By the end, you can take a raw Akamai JSON response, turn it into
objects, filter it, and pull out exactly the fields you want — the core move you
will repeat in every lesson that follows.

## Where you type

On Windows you have **Windows PowerShell 5.1** pre-installed (search the Start
menu for "PowerShell").  It works with the Akamai module.  Later we will suggest
installing **PowerShell 7** — a newer, cross-platform version — but for this
lesson either is fine.

The blinking `PS C:\Users\you>` is the **prompt**.  You type a command, press
Enter, read what comes back.  That is the whole loop.

!!! warning "One-time, do it now"
    Open PowerShell and run `Get-ExecutionPolicy`.  If it says `Restricted`, run
    `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and answer `Y`.  This
    lets installed modules load.  It affects only your user account.

## Cmdlets are always `Verb-Noun`

A **cmdlet** ("command-let") is a built-in command.  Its name is always a verb, a
hyphen, and a singular noun:

```powershell
Get-Date
Get-ChildItem           # lists files — like "dir" or "ls"
Get-Help Get-ChildItem  # docs for a cmdlet
```

The approved verbs are a fixed vocabulary: `Get` reads, `Set` changes, `New`
creates, `Remove` deletes, `Add` appends, `Find`/`Search` looks up.  The Akamai
module follows this exactly, so you can often guess the command:

| In Control Center you… | The cmdlet is almost certainly… |
| --- | --- |
| Open a property to look at it | `Get-Property` |
| Search the property list by name | `Find-Property` |
| Create a new property version | `New-PropertyVersion` |
| Add a hostname to a security config | `Add-AppSecSelectedHostnames` |
| View a client list | `Get-ClientList` |

!!! warning "Expected warning"
    When the Akamai module loads it complains about "unapproved verbs" (like
    `Activate` or `Purge`).  That is cosmetic — the module works fine.  Ignore it.

## Everything is an object, not text

This is the idea that makes PowerShell different from the old Command Prompt.
 When a cmdlet prints something, what you see is a *formatted view* of a
structured **object** underneath — a value with named **properties** you can
reach into.

```text
PS> Get-Date
Monday, 31 August 2026 09:14:07

PS> (Get-Date).Year        # reach into the .Year property
2026

PS> (Get-Date).DayOfWeek
Monday
```

To see *every* property an object has, pipe it to `Get-Member`:

```text
PS> Get-Date | Get-Member
   TypeName: System.DateTime
   Name        MemberType   ...
   Day         Property
   DayOfWeek   Property
   Year        Property
   AddDays     Method
   ...
```

You will run `... | Get-Member` constantly against Akamai results to discover
what you can pull out.

## The pipeline passes objects along

The `|` character sends the objects from one cmdlet into the next.  Three cmdlets
do 90% of the shaping work:

- `Where-Object` — keep only the objects that match a condition (a filter / `WHERE`)
- `Select-Object` — keep only the properties you care about, or the first N objects
- `Sort-Object` — order them

```powershell
Get-ChildItem C:\Windows |
    Where-Object { $_.Length -gt 1MB } |
    Sort-Object Length -Descending |
    Select-Object Name, Length -First 5
```

`$_` means "the current object flowing through the pipe."  Read it as "this one."
 The comparison operators are words, not symbols: `-eq`, `-ne`, `-gt`, `-lt`,
`-like` (wildcards), `-match` (regex).

!!! tip "Map to Akamai"
    "Show me staging activations for the property whose name contains *www*"
    becomes `Get-PropertyActivation … | Where-Object { $_.network -eq 'STAGING' }`.
     Same three verbs, Akamai objects instead of files.

## `Get-Help` is your manual

```powershell
Get-Help Find-Property            # summary + syntax
Get-Help Find-Property -Examples
Get-Help Find-Property -Full
Get-Help Find-Property -Online    # opens techdocs in your browser
```

Also useful: `Get-Command *Property*` lists every cmdlet with "Property" in its
name — how you discover what the module offers.

## JSON ⇄ objects

Akamai APIs speak JSON.  The module usually converts it to objects for you, but
you must be fluent in the conversion because you will paste sample responses,
read exported configs, and build request bodies.

```powershell
# a here-string (@' ... '@) is the paste-safe way to hold multi-line text
$json = @'
{ "propertyName": "www.example.com", "latestVersion": 7,
  "productionVersion": 5, "contractId": "1-ABC" }
'@

$prop = $json | ConvertFrom-Json     # text -> object
$prop.propertyName                    # -> www.example.com
$prop | ConvertTo-Json                # object -> text
```

The closing `'@` must sit at the very start of its line — no spaces before it —
or PowerShell won't see it as the end of the string.

Read a JSON file from disk the same way:
`Get-Content .\config.json -Raw | ConvertFrom-Json`.

!!! example "Try it — shape a real Akamai response (offline)"
    Paste this into PowerShell.  It is a trimmed `Find-Property`-style result —
    the kind of thing Lesson 06 produces for real.

    ```powershell
    $raw = @'
    [
      { "propertyName": "www.example.com",  "latestVersion": 12, "productionVersion": 11, "stagingVersion": 12 },
      { "propertyName": "api.example.com",  "latestVersion": 4,  "productionVersion": 4,  "stagingVersion": 4  },
      { "propertyName": "img.example.com",  "latestVersion": 9,  "productionVersion": 7,  "stagingVersion": 9  },
      { "propertyName": "shop.example.com", "latestVersion": 21, "productionVersion": 21, "stagingVersion": 21 }
    ]
    '@

    $props = $raw | ConvertFrom-Json
    ```

    Now write one pipeline that answers: **which properties have a staging
    version that is ahead of production?**  Show only the name and the two version
    numbers.

    ??? note "Show one correct answer"
        ```powershell
        $props |
            Where-Object { $_.stagingVersion -gt $_.productionVersion } |
            Select-Object propertyName, stagingVersion, productionVersion
        ```

        ```text
        propertyName      stagingVersion productionVersion
        ------------      -------------- -----------------
        www.example.com               12                11
        img.example.com                9                 7
        ```

        If you got `www` and `img`, you have the core skill this whole course
        rests on.  If `$_` or the `{ }` braces tripped you up, that is the #1
        thing to ask your teacher about before Lesson 02.

## Quiz

<div class="quiz" data-answer="1">
<p class="q">A cmdlet prints a neat table. You need one field from it in a variable. What do you do?</p>
<button class="opt">Copy the printed text and trim the spaces off by hand</button>
<button class="opt">Assign the result, then read the property with a dot</button>
<button class="opt">Re-run the command and redirect the output to a file</button>
<p class="fb"
   data-correct="Right — the table is just a view; the object underneath has named properties."
   data-incorrect="The printed table is only a view. Capture the object, then use the dot notation."></p>
</div>

<div class="quiz" data-answer="2">
<p class="q">Which pipeline keeps only objects where the network equals STAGING?</p>
<button class="opt">pipe into Select-Object with a brace block assigning the network</button>
<button class="opt">pipe into Get-Member naming the network and the value wanted</button>
<button class="opt">pipe into Where-Object with a brace block testing network eq</button>
<p class="fb"
   data-correct="Yes — Where-Object filters, -eq compares, and the current object is the pipeline item."
   data-incorrect="Filtering is Where-Object; the word operator for equals is -eq; the current object is the pipeline item."></p>
</div>

<div class="quiz" data-answer="0">
<p class="q">The Akamai module loads with an unapproved-verbs warning. This means:</p>
<button class="opt">Nothing is wrong — the message is cosmetic and safe to ignore here</button>
<button class="opt">The install is corrupt and must be removed and reinstalled now</button>
<button class="opt">Your execution policy is blocking the module from any loading</button>
<p class="fb"
   data-correct="Correct — some Akamai verbs aren't on PowerShell's approved list; the module still works."
   data-incorrect="It's cosmetic. Some Akamai verbs (Activate, Purge) aren't on the approved list; nothing is broken."></p>
</div>

!!! quote "Primary source — read this next"
    [Microsoft — *PowerShell 101*](https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/01-getting-started),
    chapters 1–4 (Getting Started, Help System, Objects, One-Liners and the
    Pipeline).  The single best free beginner text; ~30 min covers everything
    above in more depth.

<div id="lesson-meta" data-slug="01-powershell-primer" hidden></div>

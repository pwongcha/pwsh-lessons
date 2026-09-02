# Akamai PowerShell Lessons — MkDocs Material site

Static course site built with [MkDocs](https://www.mkdocs.org/) +
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

## Status

All 12 lessons, the cheat sheet, glossary, and resources pages are complete
Markdown.  Custom theme, quiz widget, progress tracking, per-lesson timer, and
per-page favicons are in place.  (Older hand-written HTML lives in `../lessons/`
and `../reference/` — superseded by this site.)

## Run locally

Run these from the `mkdocs/` directory (this folder — the one holding
`mkdocs.yml`).  Needs Python 3.9+.

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
mkdocs serve                   # http://127.0.0.1:8000  (live reload)
```

**Windows (PowerShell)**

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
mkdocs serve                   # http://127.0.0.1:8000  (live reload)
```

Once the venv is activated, `mkdocs` is on your `PATH`.  In a new shell, re-run
the `activate` line first.  To stop the server: `Ctrl+C`.

## Build

```bash
mkdocs build            # -> site/   (pure static HTML)
mkdocs build --strict   # same, but fail on any broken link / orphan page
```

## What's custom

| File | Purpose |
| --- | --- |
| `docs/stylesheets/akamai.css` | Maps Akamai brand colours onto Material's CSS tokens; header gradient; quiz + progress styling. **Palette is an approximation — see `../NOTES.md`.** |
| `docs/javascripts/quiz.js` | The graded quiz widget. Material has no native quiz; this scans `.quiz` blocks. Re-runs on every page swap via Material's `document$`. |
| `docs/javascripts/progress.js` | Per-browser completion tracking in `localStorage` — a "mark complete" button on each lesson, ticks + a summary on the home page. No backend. |

### Authoring a quiz

Raw HTML inside the Markdown page.  Keep every option the same length.

```html
<div class="quiz" data-answer="1">
<p class="q">Question text?</p>
<button class="opt">Option A</button>
<button class="opt">Option B</button>   <!-- index 1 == data-answer -->
<button class="opt">Option C</button>
<p class="fb"
   data-correct="Why it's right."
   data-incorrect="Nudge toward the idea."></p>
</div>
```

### Marking a page as a trackable lesson

Add at the end of the Markdown file (the slug must match the filename minus
`.md`):

```html
<div id="lesson-meta" data-slug="01-powershell-primer" hidden></div>
```

## Deploy to a Linode / Akamai Cloud instance

`mkdocs build` produces `site/` — serve it as static files.

```
Linode (Nanode 1 GB, Ubuntu 24.04)
 └─ Caddy  →  auto-HTTPS, serves /opt/ps101/site as a static root
```

**`/etc/caddy/Caddyfile`**

```
ps101.yourdomain.com {
    root * /opt/ps101/site
    file_server
    encode zstd gzip
}
```

Deploy on push with a GitHub Action (`mkdocs build` then `rsync site/` to the
box), or `mkdocs gh-deploy` for GitHub Pages.

Then put an Akamai delivery property in front with the Linode hostname as
origin — CDN caching (the site is static), TLS, and you can attach the
App & API Protector config from Lesson 07 to its hostname.

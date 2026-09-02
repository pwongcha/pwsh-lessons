# Akamai PowerShell Lessons

A short, practical course for operating Akamai from a Windows terminal instead of
clicking through Control Center. Twelve use-case-driven lessons: create API
credentials and an `.edgerc`, find and update properties, wire hostnames into
security configs, manage client lists, review custom WAF rules, and administer
IAM users and roles.

**Live site:** https://pwongcha.github.io/pwsh-lessons/

The course is an [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
site under `mkdocs/`. Lesson Markdown lives in `mkdocs/docs/`; everything else in
this repo is build and deploy plumbing.

## Run locally

From the `mkdocs/` directory (the one holding `mkdocs.yml`). Needs Python 3.9+.

```bash
python3 -m venv .venv
source .venv/bin/activate            # Windows: py -m venv .venv; .venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
mkdocs serve                         # http://127.0.0.1:8000  (live reload)
```

Once the venv is activated, `mkdocs` is on your `PATH`. In a new shell, re-run
the `activate` line first. Stop the server with `Ctrl+C`.

## Build

```bash
mkdocs build            # -> mkdocs/site/   (pure static HTML)
mkdocs build --strict   # same, but fail on any broken link / orphan page
```

## Run in Docker

The root `Dockerfile` builds the site and serves it with nginx on port 8080
(plain HTTP), under the path prefix `/pwsh-lessons` — the shape the Global
Services App Platform (GSAP) expects.

```bash
docker build -t pwsh-lessons .
docker run --rm -p 8080:8080 pwsh-lessons
# open http://localhost:8080/pwsh-lessons/
```

Podman works the same way (on macOS, start the VM once with `podman machine start`):

```bash
podman machine start                        # macOS only, first run per boot
podman build -t pwsh-lessons .
podman run --rm -p 8080:8080 pwsh-lessons
# open http://localhost:8080/pwsh-lessons/
```

`/` redirects to `/pwsh-lessons/`. The public URL is baked in at build time via
the `SITE_URL` build arg (default `https://gsap.akamai.com/pwsh-lessons/`); page
assets are relative, so the site also works unchanged at `/` or any other
prefix. To preview with a different prefix, rebuild with
`--build-arg SITE_URL=https://example.com/foo/` and adjust `nginx/default.conf`.

## What's custom

Relative to a stock Material site, all under `mkdocs/docs/`:

| File | Purpose |
| --- | --- |
| `stylesheets/akamai.css` | Maps Akamai brand colours onto Material's CSS tokens; header gradient; quiz + progress styling. |
| `javascripts/quiz.js` | The graded quiz widget. Material has no native quiz; this scans `.quiz` blocks. Re-runs on every page swap via Material's `document$`. |
| `javascripts/progress.js` | Per-browser completion tracking in `localStorage` — a "mark complete" button on each lesson, ticks + a summary on the home page. No backend. |
| `javascripts/timer.js` | Per-lesson reading timer. |
| `javascripts/favicon.js` | Per-page favicons. |

### Authoring a quiz

Raw HTML inside the Markdown page. Keep every option the same length.

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

## Deployment

`.github/workflows/deploy-docs.yml` builds `mkdocs/` with `--strict` and deploys
to GitHub Pages on every push to `main` that touches `mkdocs/**` (or the workflow
itself). Pages source is set to "GitHub Actions".

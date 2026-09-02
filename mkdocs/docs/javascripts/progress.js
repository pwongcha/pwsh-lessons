/* Akamai PowerShell Lessons — client-side progress tracking for MkDocs Material.
 *
 * No backend: completion is stored per-browser in localStorage.
 *   - On a lesson page (has <div id="lesson-meta" data-slug="...">), inject a
 *     "Mark this lesson complete" button at the end of the article.
 *   - On the course home (has <div id="course-home">), tick completed lessons in
 *     the grid-card list and show an "X / N complete" summary.
 *
 * Re-runs on every Material page swap via document$.
 */
(function () {
  var KEY = "ps101:progress:v1";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* private mode / storage disabled — degrade silently */
    }
  }

  function slugFromLessonLink(href) {
    // ".../lessons/01-powershell-primer/"  ->  "01-powershell-primer"
    var m = href && href.match(/lessons\/([^\/]+)\/?(?:#.*)?$/);
    return m ? m[1] : null;
  }

  function enhanceLessonPage() {
    var meta = document.getElementById("lesson-meta");
    if (!meta) return;
    var slug = meta.getAttribute("data-slug");
    if (!slug) return;

    var article = document.querySelector(".md-content article") || document.querySelector(".md-content");
    if (!article || article.querySelector(".ak-complete")) return;

    var state = load();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ak-complete";

    function render() {
      var done = !!state[slug];
      btn.setAttribute("data-done", done ? "true" : "false");
      btn.textContent = done ? "✓ Lesson complete — click to undo" : "Mark this lesson complete";
    }
    render();

    btn.addEventListener("click", function () {
      state = load();
      if (state[slug]) delete state[slug];
      else state[slug] = new Date().toISOString();
      save(state);
      render();
    });

    article.appendChild(btn);
  }

  function enhanceHome() {
    if (!document.getElementById("course-home")) return;
    var state = load();
    var links = document.querySelectorAll(".md-content a[href*='lessons/']");
    var seen = {}; // distinct slugs, for the count only

    links.forEach(function (a) {
      var slug = slugFromLessonLink(a.getAttribute("href"));
      if (!slug) return;
      seen[slug] = true;

      // Decorate every link for this slug (a lesson can be linked from both
      // its card and, e.g., the hero button) — not just the first one seen.
      if (!state[slug]) return;
      var card = a.closest(".grid.cards li");
      if (!card) return; // visuals only make sense inside a card
      card.classList.add("ak-card--done");
      if (!a.parentNode.querySelector(".ak-tick")) {
        var tick = document.createElement("span");
        tick.className = "ak-tick";
        tick.textContent = "✓";
        a.appendChild(tick);
      }
    });

    var doneCount = 0;
    Object.keys(seen).forEach(function (s) {
      if (state[s]) doneCount++;
    });
    var total = Object.keys(seen).length;

    var host = document.getElementById("course-home");
    var summary = host.querySelector(".ak-progress-summary");
    if (!summary) {
      summary = document.createElement("p");
      summary.className = "ak-progress-summary";
      host.appendChild(summary);
    }
    summary.textContent =
      total ? "Your progress: " + doneCount + " / " + total + " lessons complete" : "";
  }

  function run() {
    enhanceLessonPage();
    enhanceHome();
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(run);
  } else {
    document.addEventListener("DOMContentLoaded", run);
  }
})();

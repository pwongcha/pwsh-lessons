/* Akamai PowerShell Lessons — open "Primary source — read this next" links
 * in a new tab.
 *
 * Every `!!! quote` admonition on the site is a primary-source box, so we
 * target links inside `.admonition.quote`. Runs on each Material page swap.
 */
(function () {
  function wire() {
    document
      .querySelectorAll(".md-typeset .admonition.quote a[href]")
      .forEach(function (a) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      });
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(wire);
  } else {
    document.addEventListener("DOMContentLoaded", wire);
  }
})();

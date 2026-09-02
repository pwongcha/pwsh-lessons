/* Akamai PowerShell Lessons — auto-hide the fixed footer on scroll-down,
 * reveal it on scroll-up (mirrors Material's header.autohide behaviour).
 * Pairs with .md-footer / .md-footer--hidden rules in akamai.css.
 */
(function () {
  var footer = null;
  var lastY = 0;
  var ticking = false;

  function update() {
    ticking = false;
    if (!footer) return;
    var y = window.scrollY || window.pageYOffset;
    var doc = document.documentElement;
    var atBottom = window.innerHeight + y >= doc.scrollHeight - 4;

    if (atBottom || y < 72) {
      footer.classList.remove("md-footer--hidden"); // always show near top / at very bottom
    } else if (y > lastY + 4) {
      footer.classList.add("md-footer--hidden");    // scrolling down
    } else if (y < lastY - 4) {
      footer.classList.remove("md-footer--hidden");  // scrolling up
    }
    lastY = y;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  function init() {
    footer = document.querySelector(".md-footer");
    lastY = window.scrollY || window.pageYOffset;
    update();
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(init); // re-grab footer after each instant-nav page swap
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();

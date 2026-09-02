/* Akamai PowerShell Lessons — per-page browser-tab icon for MkDocs Material.
 *
 * Material injects one static favicon into every page. This swaps it for a
 * page-specific emoji, drawn as an inline SVG data-URI, so each tab is
 * distinguishable. Re-runs on every Material page swap via document$.
 *
 * Emoji are single code points on purpose — multi-code-point emoji (ZWJ
 * sequences, skin tones) don't render reliably as SVG-text favicons.
 */
(function () {
  // First matching pattern wins; order matters. Tested against location.pathname.
  var RULES = [
    [/\/lessons\/01-/, "📘"], // 📘 primer
    [/\/lessons\/02-/, "📦"], // 📦 install module
    [/\/lessons\/03-/, "🔑"], // 🔑 api client & .edgerc
    [/\/lessons\/04-/, "🧭"], // 🧭 account base IDs
    [/\/lessons\/05-/, "🔐"], // 🔐 inspect & update a certificate (CPS)
    [/\/lessons\/06-/, "🔎"], // 🔎 find a property
    [/\/lessons\/07-/, "🔧"], // 🔧 update a property
    [/\/lessons\/08-/, "🔒"], // 🔒 add hostname to security config
    [/\/lessons\/09-/, "🚦"], // 🚦 review a custom rule
    [/\/lessons\/10-/, "📋"], // 📋 view a client list
    [/\/lessons\/11-/, "➕"],       // ➕ update a client list
    [/\/lessons\/12-/, "👥"], // 👥 IAM / IDM basics
    [/\/reference\/cheat-sheet\//, "📄"], // 📄
    [/\/glossary\//, "📖"],   // 📖
    [/\/resources\//, "🔗"],  // 🔗
  ];
  var DEFAULT = "🌊"; // 🌊 course home

  function emojiFor(path) {
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(path)) return RULES[i][1];
    }
    return DEFAULT;
  }

  function dataUri(emoji) {
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
      "<text x='50' y='52' font-size='84' text-anchor='middle' " +
      "dominant-baseline='central'>" +
      emoji +
      "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function apply() {
    var href = dataUri(emojiFor(location.pathname));
    var links = document.querySelectorAll("link[rel~='icon']");
    if (links.length) {
      links.forEach(function (l) {
        l.href = href;
      });
    } else {
      var l = document.createElement("link");
      l.rel = "icon";
      l.href = href;
      document.head.appendChild(l);
    }
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(apply);
  } else {
    document.addEventListener("DOMContentLoaded", apply);
  }
})();

/* Akamai PowerShell Lessons — quiz widget for MkDocs Material.
 *
 * Material loads pages via XHR (navigation.instant), so DOMContentLoaded fires
 * only once. Material exposes `document$` (an RxJS subject) that emits on every
 * page swap — subscribe to that instead.
 *
 * Markup (raw HTML inside the Markdown page):
 *
 *   <div class="quiz" data-answer="1">
 *     <p class="q">Question text?</p>
 *     <button class="opt">Option A</button>
 *     <button class="opt">Option B</button>   <-- index 1 == data-answer
 *     <button class="opt">Option C</button>
 *     <p class="fb"
 *        data-correct="Why it's right."
 *        data-incorrect="Nudge toward the idea."></p>
 *   </div>
 *
 * Keep every option the same length — no formatting tells.
 */
(function () {
  function wire(quiz) {
    if (quiz.dataset.wired === "1") return;
    quiz.dataset.wired = "1";

    var answer = parseInt(quiz.getAttribute("data-answer"), 10);
    var opts = Array.prototype.slice.call(quiz.querySelectorAll(".opt"));
    var fb = quiz.querySelector(".fb");
    var done = false;

    opts.forEach(function (btn, i) {
      btn.type = "button";
      btn.addEventListener("click", function () {
        if (done) return;
        done = true;
        opts.forEach(function (b, j) {
          if (j === answer) b.classList.add("correct");
          else if (j === i) b.classList.add("incorrect");
          b.disabled = true;
        });
        var right = i === answer;
        if (fb) {
          fb.textContent =
            fb.getAttribute(right ? "data-correct" : "data-incorrect") || "";
          fb.className = "fb " + (right ? "correct" : "incorrect");
        }
      });
    });
  }

  function wireAll() {
    document.querySelectorAll(".quiz").forEach(wire);
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(wireAll);
  } else {
    document.addEventListener("DOMContentLoaded", wireAll);
  }
})();

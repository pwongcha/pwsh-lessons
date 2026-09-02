/* Akamai PowerShell 101 — reusable quiz widget.
   Markup:
   <div class="quiz" data-answer="1">
     <p class="q">Question text?</p>
     <button class="opt">Option A</button>
     <button class="opt">Option B</button>   <-- index 1, the answer
     <button class="opt">Option C</button>
     <p class="fb" data-correct="Nice — why it's right."
                   data-incorrect="Not quite — nudge toward the idea."></p>
   </div>
   Keep every option the same length (see SKILL.md). */
(function () {
  function wire(quiz) {
    var answer = parseInt(quiz.getAttribute('data-answer'), 10);
    var opts = Array.prototype.slice.call(quiz.querySelectorAll('.opt'));
    var fb = quiz.querySelector('.fb');
    var done = false;
    opts.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (done) return;
        done = true;
        opts.forEach(function (b, j) {
          b.classList.add(j === answer ? 'correct' : (j === i ? 'incorrect' : ''));
          b.disabled = true;
        });
        var right = i === answer;
        if (fb) {
          fb.textContent = fb.getAttribute(right ? 'data-correct' : 'data-incorrect') || '';
          fb.className = 'fb ' + (right ? 'correct' : 'incorrect');
        }
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.quiz').forEach(wire);
  });
})();

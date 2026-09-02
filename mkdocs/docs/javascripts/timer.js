/* Akamai PowerShell Lessons — per-lesson countdown timer for MkDocs Material.
 *
 * Reads the "~NN min" estimate from the `.lesson-meta` line and injects a
 * Start control just below it. On zero it fires an alert:
 *   - a loud two-tone klaxon (Web Audio square wave through a compressor —
 *     no asset to bundle or fetch), tunable via the ALARM object below;
 *   - a shake of the control;
 *   - navigator.vibrate() on phones;
 *   - the browser-tab title blinks until the tab is refocused.
 *
 * Ringing reliability:
 *   - The klaxon needs an AudioContext unlocked by a user gesture. The Start
 *     click provides that; any later click on the control re-arms it.
 *   - The "ring owed" state (mode:done, rung:false) is persisted, so if the
 *     timer expires while the tab is hidden or on another lesson, it rings on
 *     return (visibilitychange / pageshow / re-mount) once audio is available.
 *   - The shake fires once regardless; the sound retries until it succeeds.
 *   - Only gap left: a full page reload where the resumed timer expires and
 *     you never click anything — no gesture, so no sound (shake still fires).
 *
 * State lives in sessionStorage keyed by lesson slug. Re-mounts on every
 * Material page swap via document$.
 */
(function () {
  var KEY_PREFIX = "ps101:timer:v1:";
  var ctx = null; // shared AudioContext, created on the first gesture
  var ticker = null; // setInterval id for the mounted timer
  var current = null; // { refresh } hook for the mounted timer

  function clearTicker() {
    if (ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  function pageKey() {
    var meta = document.getElementById("lesson-meta");
    var slug = meta && meta.getAttribute("data-slug");
    return KEY_PREFIX + (slug || location.pathname);
  }

  function load(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null");
    } catch (e) {
      return null;
    }
  }
  function save(key, state) {
    try {
      if (state) sessionStorage.setItem(key, JSON.stringify(state));
      else sessionStorage.removeItem(key);
    } catch (e) {
      /* private mode / storage off — timer still runs, just won't resume */
    }
  }

  function armAudio() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {
      ctx = null;
    }
    return !!ctx;
  }

  // --- Alarm sound — tweak here -----------------------------------------
  // wave:   "sine"/"triangle" = soft · "square"/"sawtooth" = harsh & loud
  // A DynamicsCompressor keeps it hot without ugly clipping, so volume can
  // sit above 0.5.
  var ALARM = {
    wave: "square",
    volume: 0.62,
    tones: [784, 1175], // klaxon alternates between these two
    pulse: 0.13, // seconds of tone per beep
    gap: 0.02, // silence between beeps
    pulses: 6, // beeps per round
    rounds: 3, // rounds, separated by roundGap
    roundGap: 0.22,
  };

  // Schedules the alarm; returns true only if a live context accepted it.
  function chime() {
    if (!armAudio() || ctx.state !== "running") return false;
    try {
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -22;
      comp.knee.value = 12;
      comp.ratio.value = 12;
      comp.attack.value = 0.002;
      comp.release.value = 0.15;
      comp.connect(ctx.destination);

      var master = ctx.createGain();
      master.gain.value = ALARM.volume;
      master.connect(comp);

      var t0 = ctx.currentTime + 0.02;
      var at = 0;
      for (var r = 0; r < ALARM.rounds; r++) {
        for (var i = 0; i < ALARM.pulses; i++) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          var d = ALARM.pulse;
          osc.type = ALARM.wave;
          osc.frequency.value = ALARM.tones[i % ALARM.tones.length];
          osc.connect(gain);
          gain.connect(master);
          var t = t0 + at;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(1, t + 0.006);
          gain.gain.setValueAtTime(1, t + d - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
          osc.start(t);
          osc.stop(t + d + 0.03);
          at += d + ALARM.gap;
        }
        at += ALARM.roundGap;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Buzz on phones/tablets that support it.
  function buzz() {
    try {
      if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 400, 150, 800]);
    } catch (e) {
      /* ignore */
    }
  }

  // Blink the browser-tab title until the tab is focused again — covers the
  // case where the timer fires while you're on another tab.
  var titleFlash = null;
  var savedTitle = "";
  function onFocusStopFlash() {
    stopFlash(true);
  }
  function flashTitle() {
    if (titleFlash || document.hasFocus()) return;
    savedTitle = document.title;
    var on = false;
    titleFlash = setInterval(function () {
      document.title = (on = !on) ? "⏰ TIME'S UP — " + savedTitle : savedTitle;
    }, 1000);
    window.addEventListener("focus", onFocusStopFlash);
  }
  // restore=true puts the real title back; run() passes false and lets
  // Material's instant-nav set the title for the new page.
  function stopFlash(restore) {
    if (!titleFlash) return;
    clearInterval(titleFlash);
    titleFlash = null;
    window.removeEventListener("focus", onFocusStopFlash);
    if (restore && savedTitle) document.title = savedTitle;
  }

  function fmt(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function mount() {
    var meta = document.querySelector(".md-typeset .lesson-meta");
    if (!meta || document.querySelector(".ak-timer")) return;

    var match = meta.textContent.match(/~\s*(\d+)\s*min/i);
    if (!match) return;
    var totalMs = parseInt(match[1], 10) * 60000;
    var key = pageKey();

    var el = document.createElement("div");
    el.className = "ak-timer";
    el.innerHTML =
      '<button type="button" class="ak-timer__main"></button>' +
      '<button type="button" class="ak-timer__reset" title="Reset timer">↺</button>';
    meta.insertAdjacentElement("afterend", el);

    var main = el.querySelector(".ak-timer__main");
    var resetBtn = el.querySelector(".ak-timer__reset");

    // st: { mode:'idle'|'running'|'paused'|'done', endsAt, remaining, rung, notified }
    var st = load(key) || { mode: "idle", remaining: totalMs };

    function leftMs() {
      if (st.mode === "running") return st.endsAt - Date.now();
      if (st.mode === "done") return 0;
      return st.remaining;
    }

    function render() {
      el.dataset.mode = st.mode;
      if (st.mode === "idle") main.textContent = "▶  Start " + fmt(totalMs) + " timer";
      else if (st.mode === "running") main.textContent = "⏸  " + fmt(leftMs());
      else if (st.mode === "paused") main.textContent = "▶  " + fmt(leftMs()) + "  (paused)";
      else main.textContent = "⏰  Time's up — restart";
    }

    function shake() {
      el.classList.remove("ak-timer--ring");
      void el.offsetWidth; // reflow so the animation restarts
      el.classList.add("ak-timer--ring");
    }

    // Deliver the ring a done timer still owes: alert once, keep retrying sound.
    function ringIfDue() {
      if (st.mode !== "done") return;
      if (!st.notified) {
        shake();
        buzz();
        flashTitle();
        st.notified = true;
      }
      if (!st.rung && chime()) st.rung = true;
      save(key, st);
    }

    function toDone() {
      clearTicker();
      st = { mode: "done", rung: false, notified: false };
      save(key, st);
      render();
      ringIfDue();
    }

    function tick() {
      if (st.mode !== "running") {
        clearTicker();
        return;
      }
      if (Date.now() >= st.endsAt) {
        toDone();
        return;
      }
      render();
    }

    function runTicker() {
      clearTicker();
      ticker = setInterval(tick, 250);
    }

    main.addEventListener("click", function () {
      armAudio();
      stopFlash(true);
      if (st.mode === "idle" || st.mode === "done") {
        el.classList.remove("ak-timer--ring");
        st = { mode: "running", endsAt: Date.now() + totalMs };
        runTicker();
      } else if (st.mode === "running") {
        st = { mode: "paused", remaining: st.endsAt - Date.now() };
        clearTicker();
      } else {
        st = { mode: "running", endsAt: Date.now() + st.remaining };
        runTicker();
      }
      save(key, st);
      render();
    });

    resetBtn.addEventListener("click", function () {
      armAudio();
      stopFlash(true);
      st = { mode: "idle", remaining: totalMs };
      save(key, null);
      clearTicker();
      el.classList.remove("ak-timer--ring");
      render();
    });

    // Re-check on tab focus / bfcache restore (called by the module handlers).
    current = {
      refresh: function () {
        if (st.mode === "running") {
          if (Date.now() >= st.endsAt) toDone();
          else {
            render();
            if (!ticker) runTicker();
          }
        } else if (st.mode === "done") {
          ringIfDue();
        }
      },
    };

    // Resume from a prior instant-nav / reload.
    if (st.mode === "running" && Date.now() >= st.endsAt) toDone();
    else if (st.mode === "running") runTicker();
    else ringIfDue(); // no-op unless mode === 'done'
    render();
  }

  function run() {
    clearTicker();
    stopFlash(false); // Material sets the new page's title itself
    current = null;
    mount();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && current) current.refresh();
  });
  window.addEventListener("pageshow", function () {
    if (current) current.refresh();
  });

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(run);
  } else {
    document.addEventListener("DOMContentLoaded", run);
  }
})();

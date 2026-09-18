/* ==========================================================================
   Aking Huang — personal site behaviours
   1. Theme: auto (system) -> light -> dark, persisted in localStorage
   2. Header shadow on scroll
   3. Scroll-spy for nav highlighting
   4. Reveal-on-scroll
   5. Copy-to-clipboard
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var STORE_KEY = "aking-theme-mode";
  var ORDER = ["auto", "light", "dark"];
  var LABEL = { auto: "主题：跟随系统", light: "主题：浅色", dark: "主题：深色" };

  /* ---- 1. Theme --------------------------------------------------------- */

  function readMode() {
    try {
      var v = localStorage.getItem(STORE_KEY);
      return ORDER.indexOf(v) > -1 ? v : "auto";
    } catch (e) {
      return "auto";
    }
  }

  function applyMode(mode) {
    root.setAttribute("data-theme-mode", mode);
    if (mode === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", LABEL[mode] + "（点击切换）");
      btn.setAttribute("title", LABEL[mode]);
    }
    try {
      localStorage.setItem(STORE_KEY, mode);
    } catch (e) {
      /* storage unavailable — fine, session-only */
    }
  }

  // Apply before paint to avoid a flash of the wrong theme.
  applyMode(readMode());

  document.addEventListener("DOMContentLoaded", function () {
    applyMode(readMode());

    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = ORDER[(ORDER.indexOf(readMode()) + 1) % ORDER.length];
        applyMode(next);
      });
    }

    // Follow the OS live, as long as we're in auto mode.
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function () {
      if (readMode() === "auto") applyMode("auto");
    };
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);

    /* ---- 2. Header shadow ---------------------------------------------- */

    var header = document.querySelector(".site-header");
    var onScroll = function () {
      if (!header) return;
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---- 3. Scroll-spy -------------------------------------------------- */

    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
    var sections = navLinks
      .map(function (a) {
        var id = a.getAttribute("href").slice(1);
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    if (sections.length && "IntersectionObserver" in window) {
      var visible = {};
      var spy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0;
          });
          var bestId = null;
          var bestRatio = 0;
          Object.keys(visible).forEach(function (id) {
            if (visible[id] > bestRatio) {
              bestRatio = visible[id];
              bestId = id;
            }
          });
          navLinks.forEach(function (a) {
            a.classList.toggle("active", bestId !== null && a.getAttribute("href") === "#" + bestId);
          });
        },
        { rootMargin: "-80px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---- 4. Reveal on scroll -------------------------------------------- */

    var revealables = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var ro = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              ro.unobserve(en.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
      );
      revealables.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 6, 5) * 55 + "ms";
        ro.observe(el);
      });
    } else {
      revealables.forEach(function (el) { el.classList.add("in"); });
    }

    /* ---- 5. Copy to clipboard ------------------------------------------- */

    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () {
          btn.classList.add("done");
          window.setTimeout(function () { btn.classList.remove("done"); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) { /* ignore */ }
          document.body.removeChild(ta);
          done();
        }
      });
    });
  });
})();

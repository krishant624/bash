(function () {
  "use strict";

  var KEY = "bash-course-theme";
  var ZOOM_KEY = "bash-course-zoom";
  var OPEN_KEY = "bash-course-open-topics";
  var ZOOMS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

  function getTheme() {
    try { return localStorage.getItem(KEY) || "navy"; } catch (e) { return "navy"; }
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    document.querySelectorAll(".theme-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.theme === t ? "true" : "false");
    });
  }
  applyTheme(getTheme());

  function nearestZoom(z) {
    var best = ZOOMS[0], gap = Math.abs(z - best);
    ZOOMS.forEach(function (step) {
      var d = Math.abs(z - step);
      if (d < gap) { best = step; gap = d; }
    });
    return best;
  }
  function currentZoom() {
    var z = parseFloat(document.documentElement.style.zoom);
    return z >= 0.5 && z <= 2 ? z : 1;
  }
  function applyZoom(z) {
    z = nearestZoom(z);
    document.documentElement.style.zoom = String(z);
    try { localStorage.setItem(ZOOM_KEY, String(z)); } catch (e) { /* storage blocked */ }
    document.querySelectorAll(".zoom-pct").forEach(function (b) {
      b.textContent = Math.round(z * 100) + "%";
    });
  }
  function stepZoom(dir) {
    var z = nearestZoom(currentZoom());
    var i = ZOOMS.indexOf(z);
    applyZoom(ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + dir))]);
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getTheme());
    applyZoom(currentZoom());
    document.querySelectorAll(".zoom-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.zoom === "in") stepZoom(1);
        else if (b.dataset.zoom === "out") stepZoom(-1);
        else applyZoom(1);
      });
    });
    window.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      stepZoom(e.deltaY > 0 ? -1 : 1);
    }, { passive: false });
    window.addEventListener("keydown", function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === "-" || e.key === "_") { e.preventDefault(); stepZoom(-1); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); stepZoom(1); }
      else if (e.key === "0") { e.preventDefault(); applyZoom(1); }
    });

    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(OPEN_KEY) || "[]"); } catch (e) { saved = []; }
    document.querySelectorAll(".topic").forEach(function (li) {
      if (saved.indexOf(li.dataset.topic) !== -1) li.classList.add("open");
      var btn = li.querySelector(".twist");
      if (!btn) return;
      var name = btn.getAttribute("aria-label").replace(/^(Hide|Show) lessons in /, "");
      btn.setAttribute("aria-expanded", li.classList.contains("open") ? "true" : "false");
      btn.setAttribute("aria-label", (li.classList.contains("open") ? "Hide" : "Show") + " lessons in " + name);
      btn.addEventListener("click", function () {
        var open = li.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", (open ? "Hide" : "Show") + " lessons in " + name);
        var ids = [];
        document.querySelectorAll(".topic.open").forEach(function (item) { ids.push(item.dataset.topic); });
        try { localStorage.setItem(OPEN_KEY, JSON.stringify(ids)); } catch (e2) { /* storage blocked */ }
      });
    });
    var current = document.querySelector('.lessons a[aria-current="page"]');
    if (current && current.scrollIntoView) current.scrollIntoView({ block: "nearest" });

    document.querySelectorAll(".theme-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        try { localStorage.setItem(KEY, b.dataset.theme); } catch (e) { /* storage blocked */ }
        applyTheme(b.dataset.theme);
      });
    });
    var menu = document.querySelector(".menu-btn");
    if (menu) {
      menu.addEventListener("click", function () {
        var open = document.body.classList.toggle("menu-open");
        menu.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    var scroller = document.querySelector(".strip-scroll");
    document.querySelectorAll("[data-strip]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!scroller) return;
        scroller.scrollBy({ left: btn.dataset.strip === "left" ? -220 : 220, behavior: "smooth" });
      });
    });
    var active = document.querySelector(".strip-scroll a[aria-current='true']");
    if (active && active.scrollIntoView) active.scrollIntoView({ inline: "center", block: "nearest" });

    document.querySelectorAll("pre").forEach(function (pre) {
      if (pre.closest(".lab")) return;
      var b = document.createElement("button");
      b.className = "copy-btn";
      b.type = "button";
      b.textContent = "Copy";
      b.addEventListener("click", function () {
        var t = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText;
        if (navigator.clipboard) navigator.clipboard.writeText(t);
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = "Copy"; }, 1200);
      });
      pre.appendChild(b);
    });
    if (window.BashLab) window.BashLab.mountAll();
  });
})();

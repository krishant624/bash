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
    setupSearch();
    setupKeys();
    document.querySelectorAll("[data-widget]").forEach(function (w) {
      var fn = { perm: permWidget, raid: raidWidget, cron: cronWidget }[w.dataset.widget];
      if (fn) fn(w);
    });
    if (window.BashLab) window.BashLab.mountAll();
  });

  function typing(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
  }

  function setupSearch() {
    var box = document.querySelector(".side-search input");
    if (!box) return;
    var empty = document.querySelector(".search-empty");
    var topics = Array.prototype.slice.call(document.querySelectorAll(".topic"));
    var wasOpen = [];
    function remember() { wasOpen = topics.map(function (li) { return li.classList.contains("open"); }); }
    remember();
    box.addEventListener("focus", function () { if (!box.value.trim()) remember(); });
    box.addEventListener("input", function () {
      var q = box.value.trim().toLowerCase();
      var hits = 0;
      topics.forEach(function (li, i) {
        var name = li.querySelector(".topic-row > a").textContent.toLowerCase();
        var topicHit = q && name.indexOf(q) !== -1;
        var any = false;
        li.querySelectorAll(".lessons li").forEach(function (row) {
          var show = !q || topicHit || row.textContent.toLowerCase().indexOf(q) !== -1;
          row.hidden = !show;
          if (show && q) { any = true; hits++; }
        });
        li.hidden = !!q && !any;
        if (q) li.classList.toggle("open", any);
        else li.classList.toggle("open", wasOpen[i]);
      });
      if (empty) empty.hidden = !q || hits > 0;
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { box.value = ""; box.dispatchEvent(new Event("input")); box.blur(); }
      if (e.key === "Enter") {
        var first = document.querySelector(".topic:not([hidden]) .lessons li:not([hidden]) a");
        if (first && box.value.trim()) location.href = first.getAttribute("href");
      }
    });
    window.addEventListener("keydown", function (e) {
      if (e.key !== "/" || typing(document.activeElement) || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      if (window.innerWidth <= 760 && !document.body.classList.contains("menu-open")) {
        var menu = document.querySelector(".menu-btn");
        if (menu) menu.click();
      }
      box.focus();
    });
  }

  function setupKeys() {
    window.addEventListener("keydown", function (e) {
      if (typing(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      var rel = e.key === "ArrowLeft" ? "prev" : e.key === "ArrowRight" ? "next" : "";
      if (!rel) return;
      var a = document.querySelector('.next a[rel="' + rel + '"]');
      if (a) location.href = a.getAttribute("href");
    });
  }

  function permWidget(w) {
    var bits = w.querySelectorAll("[data-bit]");
    var specials = w.querySelectorAll("[data-special]");
    var octIn = w.querySelector('[data-in="octal"]');
    function out(name, v) { w.querySelector('[data-out="' + name + '"]').textContent = v; }
    function draw(fromInput) {
      var mode = 0, sp = 0;
      bits.forEach(function (b) { if (b.checked) mode |= 1 << (8 - +b.dataset.bit); });
      specials.forEach(function (b) { if (b.checked) sp |= 4 >> +b.dataset.special; });
      var sym = "-";
      for (var i = 0; i < 9; i++) sym += mode & (1 << (8 - i)) ? "rwx"[i % 3] : "-";
      sym = sym.split("");
      if (sp & 4) sym[3] = sym[3] === "x" ? "s" : "S";
      if (sp & 2) sym[6] = sym[6] === "x" ? "s" : "S";
      if (sp & 1) sym[9] = sym[9] === "x" ? "t" : "T";
      var oct = String(sp) + ((mode >> 6) & 7) + ((mode >> 3) & 7) + (mode & 7);
      out("octal", oct);
      out("sym", sym.join(""));
      out("cmd", "chmod " + (sp ? oct : oct.slice(1)) + " file");
      if (!fromInput) octIn.value = sp ? oct : oct.slice(1);
    }
    bits.forEach(function (b) { b.addEventListener("change", function () { draw(false); }); });
    specials.forEach(function (b) { b.addEventListener("change", function () { draw(false); }); });
    octIn.addEventListener("input", function () {
      var v = octIn.value.trim();
      if (!/^[0-7]{3,4}$/.test(v)) { octIn.setAttribute("aria-invalid", "true"); return; }
      octIn.removeAttribute("aria-invalid");
      if (v.length === 3) v = "0" + v;
      var sp = +v[0], mode = parseInt(v.slice(1), 8);
      bits.forEach(function (b) { b.checked = !!(mode & (1 << (8 - +b.dataset.bit))); });
      specials.forEach(function (b) { b.checked = !!(sp & (4 >> +b.dataset.special)); });
      draw(true);
    });
    draw(false);
  }

  function raidWidget(w) {
    var level = w.querySelector('[data-in="level"]');
    var disks = w.querySelector('[data-in="disks"]');
    var size = w.querySelector('[data-in="size"]');
    var MIN = { linear: 1, raid1: 2, raid5: 3, raid6: 4 };
    function out(name, v) { w.querySelector('[data-out="' + name + '"]').textContent = v; }
    function gib(n) { return (Math.round(n * 10) / 10) + " GiB"; }
    function draw() {
      var n = Math.max(1, Math.min(12, parseInt(disks.value, 10) || 1));
      var s = Math.max(1, parseFloat(size.value) || 1);
      var lv = level.value;
      var note = "";
      if (n < MIN[lv]) { note = "This layout needs at least " + MIN[lv] + " disks."; n = MIN[lv]; }
      var usable = lv === "linear" ? n * s : lv === "raid1" ? s : lv === "raid5" ? (n - 1) * s : (n - 2) * s;
      var survive = lv === "linear" ? 0 : lv === "raid1" ? n - 1 : lv === "raid5" ? 1 : 2;
      var raw = n * s;
      out("usable", gib(usable));
      out("prot", gib(raw - usable));
      out("survive", survive === 0 ? "no disk loss" : survive + (survive === 1 ? " disk" : " disks"));
      w.querySelector(".raid-bar .use").style.width = (usable / raw * 100) + "%";
      w.querySelector(".raid-bar .prot").style.width = ((raw - usable) / raw * 100) + "%";
      if (!note) {
        note = {
          linear: "Every byte is usable, but one dead disk loses the data on it (RAID 0 loses everything).",
          raid1: "Every disk holds a full copy. Reads can come from any disk.",
          raid5: "One disk worth of parity is spread across all disks. A rebuild reads every surviving disk.",
          raid6: "Two disks worth of parity. A second failure during a rebuild is still survivable."
        }[lv];
      }
      out("note", n + " × " + gib(s) + " = " + gib(raw) + " raw. " + note);
    }
    [level, disks, size].forEach(function (el) { el.addEventListener("input", draw); el.addEventListener("change", draw); });
    draw();
  }

  var DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var MON = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var CRON_FIELDS = [
    { name: "minute", lo: 0, hi: 59 },
    { name: "hour", lo: 0, hi: 23 },
    { name: "day of month", lo: 1, hi: 31 },
    { name: "month", lo: 1, hi: 12, names: MON },
    { name: "day of week", lo: 0, hi: 7, names: DOW }
  ];
  var CRON_SHORT = { "@hourly": "0 * * * *", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@weekly": "0 0 * * 0", "@monthly": "0 0 1 * *", "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *" };

  function cronPart(text, f) {
    function val(v) {
      var n = /^\d+$/.test(v) ? +v : NaN;
      if (isNaN(n) && f.names) {
        f.names.forEach(function (nm, i) { if (nm && nm.slice(0, 3).toLowerCase() === v.toLowerCase()) n = i; });
      }
      if (isNaN(n) || n < f.lo || n > f.hi) throw new Error(f.name + ": " + v + " is outside " + f.lo + "-" + f.hi);
      return f.names ? f.names[n] : String(n);
    }
    if (text === "*") return "every " + f.name;
    return text.split(",").map(function (item) {
      var step = item.split("/");
      if (step.length > 2) throw new Error(f.name + ": bad step " + item);
      var base = step[0], every = step[1];
      if (every !== undefined && !/^\d+$/.test(every)) throw new Error(f.name + ": bad step " + item);
      var desc;
      if (base === "*") desc = every ? "every " + every + " " + f.name + "s" : "every " + f.name;
      else if (base.indexOf("-") !== -1) {
        var r = base.split("-");
        desc = val(r[0]) + " to " + val(r[1]) + (every ? ", every " + every : "");
      } else desc = val(base) + (every ? " onward, every " + every : "");
      return desc;
    }).join(" and ");
  }

  function cronWidget(w) {
    var box = w.querySelector('[data-in="cron"]');
    var fieldsOut = w.querySelector('[data-out="fields"]');
    var say = w.querySelector('[data-out="say"]');
    function draw() {
      var raw = box.value.trim();
      var line = CRON_SHORT[raw.toLowerCase()] || raw;
      var parts = line.split(/\s+/);
      fieldsOut.innerHTML = "";
      try {
        if (parts.length !== 5) throw new Error("A cron schedule has exactly five fields: minute hour day-of-month month day-of-week.");
        var descs = parts.map(function (p, i) { return cronPart(p, CRON_FIELDS[i]); });
        parts.forEach(function (p, i) {
          var cell = document.createElement("div");
          var code = document.createElement("code");
          code.textContent = p;
          var name = document.createElement("span");
          name.textContent = CRON_FIELDS[i].name;
          var d = document.createElement("small");
          d.textContent = descs[i];
          cell.appendChild(code); cell.appendChild(name); cell.appendChild(d);
          fieldsOut.appendChild(cell);
        });
        var when;
        if (/^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) when = "At " + ("0" + parts[1]).slice(-2) + ":" + ("0" + parts[0]).slice(-2);
        else if (/^\d+$/.test(parts[0])) when = "At minute " + parts[0] + (parts[1] === "*" ? " of every hour" : " past the hour, for hours " + descs[1]);
        else when = "Runs " + (/^every/.test(descs[0]) ? "" : "at minute ") + descs[0] + ", " + (/^every/.test(descs[1]) ? "" : "hours ") + descs[1];
        var days = [];
        if (parts[2] !== "*") days.push("on day " + descs[2] + " of the month");
        if (parts[4] !== "*") days.push("on " + descs[4]);
        var dayText = days.length === 2 ? days.join(", or ") + " (cron runs when either day field matches)" : days[0] || "every day";
        var monthText = parts[3] === "*" ? "" : ", in " + descs[3];
        say.textContent = (raw !== line ? raw + " means " + line + ". " : "") + when + ", " + dayText + monthText + ".";
        box.removeAttribute("aria-invalid");
      } catch (err) {
        say.textContent = err.message;
        box.setAttribute("aria-invalid", "true");
      }
    }
    box.addEventListener("input", draw);
    w.querySelectorAll("[data-cron]").forEach(function (b) {
      b.addEventListener("click", function () { box.value = b.dataset.cron; draw(); });
    });
    draw();
  }
})();

var fs = require("fs");
var path = require("path");
var lab = require("../assets/lab.js");
var course = require("./course.js");

var root = path.join(__dirname, "..");

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function svg(w, h, label, inner) {
  return '<svg class="diagram" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '">' + inner + "</svg>";
}

function flow(parts, label) {
  var boxW = 128, gap = 26, pad = 14, h = 112;
  var w = pad * 2 + parts.length * boxW + (parts.length - 1) * gap;
  var x = pad, body = "";
  parts.forEach(function (p, i) {
    var lines = p.split("\n");
    body += '<rect class="dbox" x="' + x + '" y="20" width="' + boxW + '" height="72" rx="8"/>';
    lines.forEach(function (ln, li) {
      body += '<text class="' + (li ? "dsub" : "dtitle") + '" x="' + (x + boxW / 2) + '" y="' + (48 + li * 18) + '" text-anchor="middle">' + esc(ln) + "</text>";
    });
    if (i < parts.length - 1) {
      var x1 = x + boxW + 2, x2 = x + boxW + gap - 8;
      body += '<line class="darrow" x1="' + x1 + '" y1="56" x2="' + x2 + '" y2="56"/>';
      body += '<polygon class="dhead" points="' + (x2 + 7) + ',56 ' + x2 + ',51 ' + x2 + ',61"/>';
    }
    x += boxW + gap;
  });
  return { title: label, svg: svg(w, h, label, body), caption: label };
}

function fields(parts, label) {
  var x = 16, body = "", w = 24;
  parts.forEach(function (p) {
    var width = Math.max(70, p.text.length * 11 + 24);
    body += '<rect class="dbox ' + (p.cls || "") + '" x="' + x + '" y="28" width="' + width + '" height="36" rx="6"/>';
    body += '<text class="' + (p.textClass || "dtitle") + '" x="' + (x + width / 2) + '" y="52" text-anchor="middle">' + esc(p.text) + "</text>";
    if (p.note) body += '<text class="dsub" x="' + (x + width / 2) + '" y="84" text-anchor="middle">' + esc(p.note) + "</text>";
    x += width + 8;
    w = x + 16;
  });
  return { title: label, svg: svg(w, 100, label, body), caption: label };
}

function bars(rows, label) {
  var body = "";
  rows.forEach(function (row, i) {
    var y = 16 + i * 36;
    var width = Math.round(420 * row.value / row.max);
    body += '<text class="dsub" x="16" y="' + (y + 18) + '">' + esc(row.name) + "</text>";
    body += '<rect class="dbox" x="150" y="' + y + '" width="420" height="22" rx="4"/>';
    body += '<rect class="' + row.cls + '" x="150" y="' + y + '" width="' + width + '" height="22" rx="4"/>';
    body += '<text class="dtitle" x="580" y="' + (y + 16) + '">' + esc(row.note) + "</text>";
  });
  return { title: label, svg: svg(760, 24 + rows.length * 36, label, body), caption: label };
}

function command(text, parts, label) {
  var body = '<text class="dcode" x="16" y="36">' + esc(text) + "</text>";
  parts.forEach(function (p) {
    var x = 16 + p.start * 9.1;
    var width = Math.max(24, (p.end - p.start) * 9.1);
    body += '<line class="darrow" x1="' + x + '" y1="48" x2="' + (x + width) + '" y2="48"/>';
    body += '<text class="dsub" x="' + (x + width / 2) + '" y="' + (68 + (p.row || 0) * 16) + '" text-anchor="middle">' + esc(p.label) + "</text>";
  });
  return { title: label, svg: svg(Math.max(640, 40 + text.length * 9.1), 110, label, body), caption: label };
}

var pictures = {
  path: flow(["Start", "Files", "Text", "Host", "Network", "Bash", "Scripts"], "The path through the course"),
  shell: flow(["You type", "Bash", "Program", "Kernel"], "A command travels from your keyboard to the kernel"),
  places: flow(["Your screen", "ssh", "lab", "Bash prompt"], "Opening a shell on a host"),
  split: command("grep -n ERROR app.log", [
    { start: 0, end: 4, label: "command" },
    { start: 5, end: 7, label: "option" },
    { start: 8, end: 13, label: "pattern" },
    { start: 14, end: 21, label: "file" }
  ], "Four jobs on one line"),
  pipes: flow(["grep ERROR", "stdout", "wc -l", "1"], "A pipe connects output to the next command"),
  man: flow(["man grep", "NAME", "SYNOPSIS", "options"], "A manual page has a shape, then the flags"),
  pwd: flow(["/", "home", "ana", "work"], "pwd stands in work, under the root"),
  cd: flow(["~/work", "cd reports", "reports", "cd -"], "cd moves you, and cd - comes back"),
  ls: fields([
    { text: "-rw-r--r--", note: "type and bits" },
    { text: "ana", note: "owner" },
    { text: "ana", note: "group" },
    { text: "notes.txt", note: "name" }
  ], "One ls -l row, labeled"),
  globs: flow(["*.txt", "Bash expands", "notes.txt", "echo"], "The shell expands the star before echo runs"),
  echo: flow(["echo", "hello", "stdout"], "echo writes its arguments"),
  cat: flow(["notes.txt", "cat", "the screen"], "cat copies the file to the screen"),
  cp: flow(["notes.txt", "cp", "notes.txt", "notes.bak"], "cp leaves the original and writes a second file"),
  mv: flow(["notes.bak", "mv", "backup.txt"], "mv keeps one file and changes the name"),
  rm: flow(["backup.txt", "rm", "name gone"], "rm removes the name. There is no trash"),
  touch: flow(["no file", "touch", "empty file"], "touch creates a file with no text"),
  mkdir: flow(["work", "mkdir -p", "extra/deep"], "mkdir -p builds the missing parents"),
  link: flow(["notes-link", "arrow", "notes.txt"], "A symbolic link stores a path, not a copy"),
  find: flow([".", "walk", "*.txt", "paths"], "find walks folders and prints matching paths"),
  alias: flow(["ll", "expands", "ls -alF"], "An alias is replaced before the command runs"),
  head: fields([
    { text: "09:01 started", note: "head keeps this", cls: "good" },
    { text: "09:01 listen", note: "and this", cls: "good" },
    { text: "later lines", note: "head stops", cls: "" }
  ], "head keeps the first lines"),
  tail: fields([
    { text: "earlier lines", note: "tail skips" },
    { text: "WARN disk", note: "kept", cls: "warn" },
    { text: "ERROR config", note: "kept", cls: "bad" },
    { text: "retry ok", note: "newest", cls: "good" }
  ], "tail keeps the last lines"),
  grep: fields([
    { text: "09:03:40", note: "time" },
    { text: "ERROR", note: "the match", cls: "bad", textClass: "tbad" },
    { text: "read config failed", note: "rest of the line" }
  ], "grep keeps the line that contains ERROR"),
  cut: fields([
    { text: "09:03:40", note: "field 1" },
    { text: "ERROR", note: "field 2, kept", cls: "good", textClass: "tgood" },
    { text: "read config failed", note: "field 3 onward" }
  ], "cut -f2 keeps the second column"),
  sort: flow(["10, 2, 1", "sort -n", "1, 2, 10"], "Numeric sort is not text sort"),
  awk: fields([
    { text: "$1 time", note: "first field" },
    { text: "$2 ERROR", note: "print this", cls: "bad", textClass: "tbad" },
    { text: "$3 read", note: "next word" }
  ], "awk names fields $1, $2, $3"),
  sed: flow(["ERROR", "s/ERROR/FAIL/", "FAIL"], "sed writes a new stream and leaves the file"),
  ps: flow(["systemd\npid 1", "sshd\npid 412", "app\npid 880", "bash\npid 901"], "The process list on lab"),
  top: bars([
    { name: "app", value: 20, max: 100, note: "2.0 CPU", cls: "fillbad" },
    { name: "bash", value: 2, max: 100, note: "0.1 CPU", cls: "fillaccent" },
    { name: "sshd", value: 1, max: 100, note: "0.0 CPU", cls: "fillaccent" }
  ], "One frame of top. A real top keeps redrawing"),
  df: bars([
    { name: "/", value: 82, max: 200, note: "8.2G of 20G", cls: "fillwarn" }
  ], "df shows the whole disk, not one folder"),
  du: flow(["df: which disk", "du: which folder", "~/work"], "du is the second question, after df"),
  free: bars([
    { name: "used", value: 12, max: 38, note: "1.2Gi", cls: "fillwarn" },
    { name: "free", value: 21, max: 38, note: "2.1Gi", cls: "fillgood" }
  ], "Memory on lab, out of 3.8Gi"),
  kill: flow(["ps finds pid", "kill 880", "TERM", "process exits"], "TERM asks. KILL does not ask"),
  uptime: flow(["3 days up", "1 user", "load 0.15"], "uptime is the host's recent history"),
  ping: flow(["lab", "packet", "reply", "0% loss"], "ping checks for a reply, not for your app"),
  curl: flow(["curl -I", "lab:8080", "200 OK"], "Headers tell you the app answered"),
  wget: flow(["URL", "wget -O", "health.txt"], "wget leaves a file. curl prints"),
  ssh: flow(["your prompt", "ssh ana@other", "other's prompt"], "ssh moves your prompt to the other host"),
  scp: flow(["notes.txt", "scp", "ana@other:work/"], "The colon splits the login from the path"),
  rsync: flow(["compare", "send changes", "leave the rest"], "rsync does not copy what is already the same"),
  zip: flow(["notes.txt", "zip", "pack.zip", "notes.txt"], "The original stays. The archive is extra"),
  unzip: flow(["pack.zip", "unzip -l", "names", "then extract"], "List before you extract"),
  tar: command("tar -czf learn.tar.gz notes.txt", [
    { start: 0, end: 3, label: "tar" },
    { start: 4, end: 5, label: "c create", row: 0 },
    { start: 5, end: 6, label: "z gzip", row: 1 },
    { start: 6, end: 7, label: "f name", row: 0 },
    { start: 8, end: 20, label: "archive", row: 1 },
    { start: 21, end: 30, label: "files", row: 0 }
  ], "c, z, and f are three different jobs"),
  own: fields([
    { text: "ana", note: "owner bits" },
    { text: "ana", note: "group bits" },
    { text: "others", note: "world bits" }
  ], "Three classes, checked in this order"),
  chmod: fields([
    { text: "rw-", note: "6 owner" },
    { text: "r--", note: "4 group" },
    { text: "r--", note: "4 others" }
  ], "644 is rw- r-- r--"),
  chown: flow(["ana owns it", "chown root", "refused"], "Only root may give a file away"),
  chgrp: flow(["group ana", "chgrp staff", "group staff"], "You may chgrp to a group you belong to"),
  syntax: flow(["shebang", "comment", "command"], "A script is lines the shell could have typed"),
  script: flow(["set -e", "set -u", "pipefail", "then work"], "Stop at the first real failure"),
  variables: flow(["host=lab", "$host", "lab"], "The dollar sign reads the value"),
  quotes: flow(["' $HOME '", "literal", "\" $HOME \"", "/home/ana"], "Single quotes seal. Double quotes expand"),
  types: flow(["count=10", "text", "$((count+1))", "11"], "The value is text until arithmetic"),
  operators: flow(["3 * 4", "12", "+ 2", "14"], "Multiplication happens before addition"),
  exit: flow(["grep -q", "code 0", "$?", "if"], "Zero is success"),
  if: flow(["command", "code 0?", "then", "else"], "if follows the exit code"),
  for: flow(["notes.txt", "app.log", "body", "done"], "for visits each name once"),
  while: flow(["n < 3", "body", "n = n + 1", "test again"], "Something in the body must change the test"),
  functions: flow(["greet ana", "$1 is ana", "echo"], "The caller passes words. The function names them $1"),
  arrays: fields([
    { text: "8080", note: "index 0" },
    { text: "8443", note: "index 1" }
  ], "Indexes start at zero"),
  cron: fields([
    { text: "*/5", note: "minute" },
    { text: "*", note: "hour" },
    { text: "*", note: "day" },
    { text: "*", note: "month" },
    { text: "*", note: "weekday" },
    { text: "du -sh", note: "command" }
  ], "Five fields, then the command. This one is every five minutes"),
  case: flow(["start", "case $1", "match", "branch"], "case picks one branch from many patterns"),
  strings: flow(["path=/a/b.txt", "${path##*/}", "b.txt"], "Parameter expansion edits text without a second command"),
  args: flow(["-n -f file", "getopts", "flags set", "rest args"], "getopts walks short options one letter at a time"),
  traps: flow(["mktemp", "work", "EXIT", "cleanup"], "trap runs cleanup when the script ends"),
  debug: flow(["bash -n", "syntax ok", "bash -x", "trace lines"], "Check the text first, then watch it run"),
  flock: flow(["cron fires", "flock -n", "run or skip"], "A lock keeps two copies from overlapping"),
  jq: flow(["curl JSON", "jq .field", "plain text"], "jq pulls one field out of a JSON reply"),
  security: flow(["untrusted input", "no eval", "quoted \"$var\""], "Treat outside text as data, never as code"),
  pitfalls: flow(["unquoted $var", "word split", "wrong args"], "Most Bash bugs are quoting and word-splitting"),
  style: flow(["shebang", "set -euo", "main \"$@\""], "A short header, then one main entry"),
  sheet: fields([
    { text: "set -euo", note: "strict" },
    { text: "[[ ]]", note: "test" },
    { text: "\"$@\"", note: "args" },
    { text: "trap", note: "cleanup" }
  ], "Keep these four habits in every script"),
  projects: flow(["template", "backup", "logs", "hosts"], "Study a finished script, then change one piece"),
  template: flow(["getopts", "log/die", "trap", "main"], "The skeleton every project script starts from"),
  backup: flow(["source dir", "tar.gz", "keep N", "rotate"], "Dated archives, then delete the oldest"),
  logalyze: flow(["app.log", "grep counts", "top errors"], "Count ERROR, WARN, and INFO, then show samples"),
  diskmon: flow(["df -hP", "threshold", "ALERT or OK"], "Exit 1 when any filesystem is too full"),
  rename: flow(["*.txt", "lowercase", "dry-run", "--apply"], "Print the plan first. Rename only with --apply"),
  sshrun: flow(["hosts file", "ssh each", "ok / fail"], "One command on many hosts, with a summary"),
  iostat: flow(["df sample", "iostat?", "CSV row"], "Append timestamped metrics for later charts"),
  glossary: flow(["term", "plain meaning", "the lesson"], "Each word points back to the page that used it")
};

function transcript(commands, script) {
  var state = lab.createState();
  var lines = [];
  (commands || []).forEach(function (cmd) {
    var res = lab.runLine(state, cmd);
    var shown = "$ " + cmd;
    if (res.stdout) shown += "\n" + res.stdout.replace(/\n$/, "");
    if (res.stderr) shown += "\n" + res.stderr.replace(/\n$/, "");
    lines.push(shown);
  });
  var scriptOut = "";
  if (script) {
    var res2 = lab.runScript(lab.createState(), script);
    scriptOut = (res2.stdout || "") + (res2.stderr || "");
  }
  return { text: lines.join("\n"), scriptOut: scriptOut };
}

function labHtml(lesson) {
  var example = (lesson.run || []).join("\n");
  var script = lesson.script
    ? '<textarea class="lab-script" aria-label="Practice script">' + esc(lesson.script) + "</textarea>" +
      '<button type="button" class="lab-run-script">Run script</button>'
    : "";
  var tryBtn = example
    ? '<button type="button" class="lab-try">Try the example</button>'
    : "";
  return '<div class="lab" data-example="' + esc(example) + '">' +
    '<p class="lab-banner">Practice computer. This is not your PC. Reset puts the practice files back.</p>' +
    '<div class="lab-screen" role="log" aria-live="polite"></div>' +
    script +
    '<form class="lab-form"><label class="lab-prompt">ana@lab:~/work$</label>' +
    '<input class="lab-input" autocomplete="off" spellcheck="false" aria-label="Practice command"></form>' +
    '<div class="lab-actions">' + tryBtn + '<button type="button" class="lab-reset">Reset lab</button></div></div>';
}

function figure(name) {
  var pic = pictures[name];
  if (!pic) throw new Error("missing diagram " + name);
  var legend = '<div class="legend"><span><i style="background:var(--accent)"></i>Blue outline marks the step this page is about</span></div>';
  return '<figure class="chart-block wide"><h3>' + esc(pic.title) + "</h3>" + pic.svg + legend +
    '<p class="caption">' + esc(pic.caption) + "</p></figure>";
}

function tableHtml(table) {
  if (!table) return "";
  var head = "<tr>" + table.headers.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr>";
  var body = table.rows.map(function (row) {
    return "<tr>" + row.map(function (cell) { return "<td>" + esc(cell) + "</td>"; }).join("") + "</tr>";
  }).join("");
  return '<div class="table-wrap wide"><table><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";
}

function flatLessons(topics) {
  var list = [];
  topics.forEach(function (topic, ti) {
    topic.lessons.forEach(function (lesson, li) {
      list.push({
        topic: topic,
        topicIndex: ti + 1,
        lesson: lesson,
        num: (ti + 1) + "." + (li + 1)
      });
    });
  });
  return list;
}

function shell(page) {
  var zoom = '<script>try{var r=document.documentElement;r.setAttribute("data-theme",localStorage.getItem("bash-course-theme")||"navy");var z=parseFloat(localStorage.getItem("bash-course-zoom"));if(z>=0.5&&z<=2)r.style.zoom=z}catch(e){}</script>';
  return "<!DOCTYPE html>\n<html lang=\"en\" data-theme=\"navy\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>" +
    esc(page.title) + " · Bash</title>\n" + zoom + "\n<link rel=\"stylesheet\" href=\"assets/lesson.css\">\n</head>\n<body>\n" +
    '<header class="topbar"><button class="menu-btn" type="button" aria-expanded="false" aria-label="Show topics">☰ Topics</button>' +
    '<a class="course" href="index.html">Bash</a><span class="sep">/</span><p class="page-title">' + esc(page.title) + "</p>" +
    '<div class="zoom-switch" role="group" aria-label="Zoom. This percentage stays on every lesson.">' +
    '<button type="button" data-zoom="out" aria-label="Zoom out">−</button>' +
    '<button type="button" class="zoom-pct" data-zoom="reset" aria-label="Reset zoom to 100%">100%</button>' +
    '<button type="button" data-zoom="in" aria-label="Zoom in">+</button></div>' +
    '<div class="theme-switch" role="group" aria-label="Theme">' +
    '<button type="button" data-theme="navy" aria-pressed="true">Navy</button>' +
    '<button type="button" data-theme="white" aria-pressed="false">White</button></div></header>\n' +
    page.strip + "\n<div class=\"layout\">\n" + page.nav + "\n<main>\n<div class=\"card\">\n<article class=\"lesson\">\n" +
    page.article + "\n</article>\n</div>\n</main>\n</div>\n<script src=\"assets/lab.js\"></script>\n<script src=\"assets/lesson.js\"></script>\n</body>\n</html>\n";
}

function navHtml(topics, currentFile) {
  var items = topics.map(function (topic, ti) {
    var open = topic.lessons.some(function (ls) { return ls.file === currentFile; });
    var first = topic.lessons[0].file;
    var lessons = topic.lessons.map(function (ls, li) {
      var current = ls.file === currentFile ? ' aria-current="page"' : "";
      return '<li><a href="' + ls.file + '"' + current + '><span class="num">' + (ti + 1) + "." + (li + 1) + "</span><span>" + esc(ls.title) + "</span></a></li>";
    }).join("");
    return '<li class="topic' + (open ? " open" : "") + '" data-topic="' + topic.id + '"><div class="topic-row"><a href="' + first + '"' +
      (open ? ' aria-current="true"' : "") + '><span class="num">' + (ti + 1) + "</span><span>" + esc(topic.title) + "</span></a>" +
      '<button type="button" class="twist" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="lessons-' + topic.id + '" aria-label="' +
      (open ? "Hide" : "Show") + " lessons in " + esc(topic.title) + '"></button></div><ol class="lessons" id="lessons-' + topic.id + '">' + lessons + "</ol></li>";
  }).join("");
  return '<nav class="sidebar" aria-label="Topics"><h2>Topics</h2><ol class="topics">' + items +
    '</ol><p class="note">The practice terminal is not your computer. Reset puts the practice files back.</p></nav>';
}

function stripHtml(topics, currentTopic) {
  var links = topics.map(function (topic) {
    var current = topic.id === currentTopic ? ' aria-current="true"' : "";
    return '<a href="' + topic.lessons[0].file + '"' + current + ">" + esc(topic.title) + "</a>";
  }).join("");
  return '<div class="topicstrip" aria-label="Course topics"><button type="button" class="strip-arrow" data-strip="left" aria-label="Scroll topics left">❮</button><div class="strip-scroll">' +
    links + '</div><button type="button" class="strip-arrow" data-strip="right" aria-label="Scroll topics right">❯</button></div>';
}

function homeExtra() {
  return '<h2>Who it is for</h2><p>Someone who SSHes into a Linux host and needs the shell: to read a log, copy a file, see why a disk is full, and write a script that stops when something fails. The path runs from the prompt through Bash syntax, then into traps, getopts, locking, and finished project scripts under <code>scripts/</code>. The <a href="https://github.com/krishant624/linux-guide">Linux guide</a> is the wider map of a host.</p>' +
    '<h2>Where this course goes further</h2><div class="cards wide"><div class="mini"><h3>Pipes</h3><p>stdin, stdout, and stderr, drawn as a stream, not one example of |.</p></div><div class="mini"><h3>Globs and quotes</h3><p>Why <code>*.txt</code> and <code>\'*.txt\'</code> are different words by the time a command starts.</p></div><div class="mini"><h3>find and links</h3><p>Walking a tree, and a name that points at another file.</p></div><div class="mini"><h3>PATH and exit codes</h3><p>Why a command disappears, and why zero means it worked.</p></div><div class="mini"><h3>Traps and getopts</h3><p>Cleanup on EXIT, and short options a script can parse.</p></div><div class="mini"><h3>Project scripts</h3><p>Backup, log summary, disk alert, rename, SSH runner, and a CSV sampler.</p></div></div>' +
    '<h2>The practice files</h2><div class="table-wrap wide"><table><thead><tr><th>Path</th><th>What it is for</th></tr></thead><tbody>' +
    "<tr><td><code>~/work/app.log</code></td><td>Five log lines. One of them is ERROR.</td></tr>" +
    "<tr><td><code>~/work/notes.txt</code></td><td>A short note about the lab.</td></tr>" +
    "<tr><td><code>~/work/names.txt</code></td><td>Names, with ana twice, for sort and uniq.</td></tr>" +
    "<tr><td><code>~/work/sizes.txt</code></td><td>The numbers 10, 2, and 1, so text sort and numeric sort disagree.</td></tr>" +
    "<tr><td><code>~/work/reports/monday.txt</code></td><td>A file in a subfolder, so find has somewhere to walk.</td></tr>" +
    "<tr><td><code>~/.bashrc</code></td><td>A saved alias. <code>ls</code> hides it until you ask.</td></tr>" +
    "<tr><td><code>scripts/</code></td><td>Finished project scripts to study on a real host or in a disposable directory.</td></tr>" +
    "</tbody></table></div>" +
    '<h2>How to practice</h2><ol class="steps"><li>Read the point and the picture.</li><li>Read the worked example. The output is what this lab prints.</li><li>Press Try the example, or type the command yourself.</li><li>Press Reset lab if you want the original files back.</li><li>For project scripts, open the file under <code>scripts/</code> and run it in a VM, WSL, or temp folder.</li></ol>';
}

function article(item, prev, next) {
  var lesson = item.lesson;
  var ran = transcript(lesson.run, lesson.script);
  var example = "";
  if (lesson.run && lesson.run.length) {
    example = "<h2>Worked example</h2><pre><code>" + esc(ran.text) + "</code></pre>";
  }
  if (lesson.sample) {
    example += "<h2>Example</h2><pre><code>" + esc(lesson.sample) + "</code></pre>";
  }
  if (lesson.script) {
    example += "<h2>Script</h2><pre><code>" + esc(lesson.script) + "</code></pre>";
    if (ran.scriptOut.trim()) example += '<pre class="sample-out"><code>' + esc(ran.scriptOut.replace(/\n$/, "")) + "</code></pre>";
  }
  var kind = lesson.kind || "insight";
  var label = { insight: "Insight", mistake: "Mistake", analogy: "Analogy", caution: "Caution" }[kind] || "Insight";
  var nextHtml = '<div class="next">' +
    (prev ? '<a href="' + prev.lesson.file + '">← ' + esc(prev.lesson.title) + "</a>" : "<span></span>") +
    (next ? '<a href="' + next.lesson.file + '">' + esc(next.lesson.title) + " →</a>" : "<span></span>") +
    "</div>";
  return "<h1>" + esc(lesson.title) + "</h1>" +
    '<p class="point"><strong>Point of this page.</strong> ' + esc(lesson.point) + "</p>" +
    lesson.idea.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
    "<p>" + esc(lesson.more) + "</p>" +
    figure(lesson.diagram) +
    tableHtml(lesson.table) +
    (lesson.file === "index.html" ? homeExtra() : "") +
    example +
    '<div class="callout ' + kind + '"><span class="label">' + label + "</span>" + esc(lesson.call) + "</div>" +
    "<h2>Practice</h2>" + labHtml(lesson) + nextHtml;
}

function glossaryArticle(item, prev) {
  var rows = course.glossary.map(function (g) {
    return "<tr><td>" + esc(g[0]) + "</td><td>" + esc(g[1]) + '</td><td><a href="' + g[2] + '">Where it appeared</a></td></tr>';
  }).join("");
  return "<h1>Glossary</h1>" +
    '<p class="point"><strong>Point of this page.</strong> Each term, in plain words, and the lesson where it was used.</p>' +
    figure("glossary") +
    '<div class="table-wrap wide"><table><thead><tr><th>Term</th><th>Meaning</th><th>Lesson</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
    '<p>The <a href="https://github.com/krishant624/linux-guide">Linux guide</a> is the wider map of a host. Project scripts from this course live in <code>scripts/</code>.</p>' +
    '<div class="next"><a href="' + prev.lesson.file + '">← ' + esc(prev.lesson.title) + '</a><span></span></div>';
}

var topics = course.topics.slice();
topics.push({
  id: "glossary",
  title: "Glossary",
  lessons: [{ file: "glossary.html", title: "Glossary", diagram: "path" }]
});

var list = flatLessons(topics);
var missing = [];
list.forEach(function (item) {
  if (item.lesson.file !== "glossary.html" && !pictures[item.lesson.diagram]) missing.push(item.lesson.diagram);
});
if (missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}

list.forEach(function (item, i) {
  var prev = i > 0 ? list[i - 1] : null;
  var next = i < list.length - 1 ? list[i + 1] : null;
  var body = item.lesson.file === "glossary.html" ? glossaryArticle(item, prev) : article(item, prev, next);
  var html = shell({
    title: item.lesson.title,
    strip: stripHtml(topics, item.topic.id),
    nav: navHtml(topics, item.lesson.file),
    article: body
  });
  fs.writeFileSync(path.join(root, item.lesson.file), html);
});

console.log("wrote " + list.length + " pages");

/* Practice computer for the Bash course. It is not a real shell and it never touches the reader's files. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.BashLab = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BUILTIN = { cd: 1, alias: 1, unalias: 1, export: 1, set: 1, unset: 1, history: 1, help: 1, pwd: 1, echo: 1, printf: 1, "[": 1, "[[": 1, exit: 1, type: 1, crontab: 1, source: 1, ".": 1, read: 1, shopt: 1, ulimit: 1, jobs: 1, fg: 1, bg: 1, kill: 1, command: 1, umask: 1, fc: 1 };
  var ON_DISK_TOO = { pwd: 1, echo: 1, printf: 1, "[": 1, kill: 1, crontab: 1 };

  function file(text, mode) {
    return { kind: "file", mode: mode == null ? 420 : mode, owner: "ana", group: "ana", text: text };
  }
  function newDir(owner, mode) {
    return { kind: "dir", mode: mode == null ? 493 : mode, owner: owner || "ana", group: owner === "root" ? "root" : "ana", text: "" };
  }
  function sysFile(text, mode, group) {
    return { kind: "file", mode: mode, owner: "root", group: group || "root", text: text };
  }
  function systemFiles() {
    var passwd = [
      "root:x:0:0:root:/root:/bin/bash",
      "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
      "sshd:x:110:65534::/run/sshd:/usr/sbin/nologin",
      "ana:x:1000:1000:Ana Lee:/home/ana:/bin/bash",
      "ken:x:1001:1001:Ken Ito:/home/ken:/bin/bash",
      "mina:x:1002:1002:Mina Park:/home/mina:/bin/bash"
    ].join("\n") + "\n";
    var group = [
      "root:x:0:",
      "shadow:x:42:",
      "sudo:x:27:ana",
      "ana:x:1000:",
      "ken:x:1001:",
      "mina:x:1002:",
      "staff:x:1003:ana,mina"
    ].join("\n") + "\n";
    var fstab = [
      "# <file system>                           <mount point>  <type>  <options>          <dump> <pass>",
      "UUID=3f1c2a9e-5b7d-4c11-9a0e-6d2f8b1e7c40  /              ext4    defaults           0      1",
      "UUID=8a2d4e61-0c3f-4b59-8e7a-1f9c3d5b2a77  /boot          ext4    defaults           0      2",
      "# USB stick, added by ana. nofail keeps boot going if it is unplugged.",
      "# UUID=4E21-9F0A                          /mnt/usb       vfat    defaults,nofail    0      0"
    ].join("\n") + "\n";
    var crontab = [
      "# /etc/crontab: system-wide crontab. This one has a user field.",
      "SHELL=/bin/sh",
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "# m  h  dom mon dow user  command",
      "17 *  *   *   *   root  cd / && run-parts --report /etc/cron.hourly",
      "25 6  *   *   *   root  test -x /usr/sbin/anacron || run-parts --report /etc/cron.daily"
    ].join("\n") + "\n";
    var anacrontab = [
      "# /etc/anacrontab: jobs that should run even if the host was off at the time.",
      "SHELL=/bin/sh",
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "# period  delay  job-id        command",
      "1         5      cron.daily    run-parts --report /etc/cron.daily",
      "7         10     cron.weekly   run-parts --report /etc/cron.weekly",
      "@monthly  15     cron.monthly  run-parts --report /etc/cron.monthly"
    ].join("\n") + "\n";
    var timer = [
      "[Unit]",
      "Description=Nightly backup of /home",
      "",
      "[Timer]",
      "OnCalendar=*-*-* 02:30:00",
      "Persistent=true",
      "RandomizedDelaySec=5min",
      "",
      "[Install]",
      "WantedBy=timers.target"
    ].join("\n") + "\n";
    var service = [
      "[Unit]",
      "Description=Nightly backup of /home",
      "",
      "[Service]",
      "Type=oneshot",
      "ExecStart=/usr/local/bin/backup.sh /home /srv/backup 7"
    ].join("\n") + "\n";
    return {
      "/etc": newDir("root", 493),
      "/etc/passwd": sysFile(passwd, 420),
      "/etc/group": sysFile(group, 420),
      "/etc/shadow": sysFile("root:*:20000:0:99999:7:::\nana:$6$lab$hash:20750:0:99999:7:::\nken:$6$lab$hash2:20700:0:99999:7:::\nmina:$6$lab$hash3:20720:0:99999:7:::\n", 416, "shadow"),
      "/etc/cron.daily": newDir("root", 493),
      "/etc/cron.daily/logrotate": sysFile("#!/bin/sh\n/usr/sbin/logrotate /etc/logrotate.conf\n", 493),
      "/etc/cron.daily/man-db": sysFile("#!/bin/sh\nmandb --quiet\n", 493),
      "/etc/cron.weekly": newDir("root", 493),
      "/etc/cron.weekly/fstrim": sysFile("#!/bin/sh\nfstrim --all\n", 493),
      "/etc/profile": sysFile("# Read first by every login shell, for every user.\nPATH=\"/usr/local/bin:/usr/bin:/bin\"\nfor f in /etc/profile.d/*.sh; do . \"$f\"; done\n", 420),
      "/tmp/ken-notes.txt": { kind: "file", mode: 438, owner: "ken", group: "ken", text: "ken's scratch notes\n" },
      "/etc/sudoers": sysFile("Defaults env_reset\nroot ALL=(ALL:ALL) ALL\n%sudo ALL=(ALL:ALL) ALL\n", 288),
      "/etc/sudoers.d": newDir("root", 488),
      "/dev": newDir("root", 493),
      "/dev/disk": newDir("root", 493),
      "/dev/disk/by-id": newDir("root", 493),
      "/dev/disk/by-id/ata-LAB_SSD_21G_LAB0001": { kind: "link", mode: 511, owner: "root", group: "root", target: "../../sda", text: "" },
      "/dev/disk/by-id/usb-USB_Flash_Disk_USB4E219F0A": { kind: "link", mode: 511, owner: "root", group: "root", target: "../../sdb", text: "" },
      "/dev/disk/by-id/ata-LAB_HDD_10G_SN1001": { kind: "link", mode: 511, owner: "root", group: "root", target: "../../sdc", text: "" },
      "/dev/disk/by-id/ata-LAB_HDD_10G_SN1002": { kind: "link", mode: 511, owner: "root", group: "root", target: "../../sdd", text: "" },
      "/dev/disk/by-id/ata-LAB_HDD_10G_SN1003": { kind: "link", mode: 511, owner: "root", group: "root", target: "../../sde", text: "" },
      "/dev/disk/by-id/ata-LAB_HDD_10G_SN1004": { kind: "link", mode: 511, owner: "root", group: "root", target: "../../sdf", text: "" },
      "/etc/hostname": sysFile("lab\n", 420),
      "/etc/fstab": sysFile(fstab, 420),
      "/etc/crontab": sysFile(crontab, 420),
      "/etc/anacrontab": sysFile(anacrontab, 420),
      "/etc/skel": newDir("root", 493),
      "/etc/skel/.bashrc": sysFile("# Copied into every new home folder by useradd -m\nalias ll='ls -alF'\n", 420),
      "/etc/systemd": newDir("root", 493),
      "/etc/systemd/system": newDir("root", 493),
      "/etc/systemd/system/backup.timer": sysFile(timer, 420),
      "/etc/systemd/system/backup.service": sysFile(service, 420),
      "/tmp": newDir("root", 1023),
      "/usr": newDir("root", 493),
      "/usr/bin": newDir("root", 493),
      "/usr/bin/passwd": sysFile("", 2541),
      "/var": newDir("root", 493),
      "/var/log": newDir("root", 493),
      "/var/log/syslog": sysFile("Nov  2 09:00:01 lab CRON[812]: (ana) CMD (du -sh /home/ana/work)\nNov  2 09:05:01 lab CRON[840]: (ana) CMD (du -sh /home/ana/work)\n", 420),
      "/mnt": newDir("root", 493),
      "/mnt/usb": newDir("root", 493),
      "/boot": newDir("root", 493),
      "/boot/grub": newDir("root", 493),
      "/boot/vmlinuz-6.8.0-45-generic": sysFile("", 384),
      "/boot/initrd.img-6.8.0-45-generic": sysFile("", 420),
      "/media": newDir("root", 493),
      "/opt": newDir("root", 493),
      "/srv": newDir("root", 493),
      "/proc": newDir("root", 365),
      "/sys": newDir("root", 365),
      "/usr/local": newDir("root", 493),
      "/usr/local/bin": newDir("root", 493),
      "/var/lib": newDir("root", 493),
      "/root": newDir("root", 448),
      "/home/ken": newDir("ken", 488),
      "/home/mina": newDir("mina", 488)
    };
  }

  function createState() {
    var notes = "Lab notes\nHost: lab\nUser: ana\nThe app log is app.log\n";
    var log = [
      "2026-11-02T09:01:02 INFO app started",
      "2026-11-02T09:01:05 INFO listen port 8080",
      "2026-11-02T09:02:11 WARN disk 80 percent",
      "2026-11-02T09:03:40 ERROR read config failed",
      "2026-11-02T09:04:01 INFO retry ok"
    ].join("\n") + "\n";
    var st = {
      user: "ana",
      group: "ana",
      groups: ["ana", "sudo", "staff"],
      host: "lab",
      home: "/home/ana",
      cwd: "/home/ana/work",
      prev: "/home/ana/work",
      env: { HOME: "/home/ana", USER: "ana", LOGNAME: "ana", PATH: "/usr/bin", SHELL: "/bin/bash", TERM: "xterm-256color", LANG: "en_US.UTF-8", PS1: "\\u@\\h:\\w\\$ " },
      exported: { HOME: true, USER: true, LOGNAME: true, PATH: true, SHELL: true, TERM: true, LANG: true },
      loginShell: true,
      nullglob: false,
      dotglob: false,
      arrays: {},
      fns: {},
      aliases: {},
      pos: [],
      files: {
        "/": newDir("root", 493),
        "/home": newDir("root", 493),
        "/home/ana": newDir("ana", 493),
        "/home/ana/.bashrc": file("# Saved aliases for ana\nalias ll='ls -alF'\n"),
        "/home/ana/.profile": file("# Read by login shells. It loads .bashrc so both kinds of shell match.\nif [ -f \"$HOME/.bashrc\" ]; then\n  . \"$HOME/.bashrc\"\nfi\n"),
        "/home/ana/work": newDir("ana", 493),
        "/home/ana/work/notes.txt": file(notes),
        "/home/ana/work/app.log": file(log),
        "/home/ana/work/names.txt": file("ken\nana\nana\nmina\n"),
        "/home/ana/work/sizes.txt": file("10\n2\n1\n"),
        "/home/ana/work/reports": newDir("ana", 493),
        "/home/ana/work/reports/monday.txt": file("disk 80 percent\n")
      },
      remote: {},
      jobs: [],
      atjobs: [],
      nextIno: 131070,
      history: [],
      lastCode: 0,
      errexit: false,
      nounset: false,
      pipefail: false,
      crontab: "# m h dom mon dow command\n*/5 * * * * du -sh /home/ana/work\n",
      depth: 0
    };
    Object.assign(st.files, systemFiles());
    st.files["/home/ken"].group = "ken";
    st.files["/home/mina"].group = "mina";
    return st;
  }

  function reset(state) {
    var fresh = createState();
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, fresh);
  }

  function prompt(state) {
    var cwd = state.cwd;
    if (cwd === state.home) cwd = "~";
    else if (cwd.indexOf(state.home + "/") === 0) cwd = "~" + cwd.slice(state.home.length);
    return state.user + "@" + state.host + ":" + cwd + (state.user === "root" ? "#" : "$");
  }

  function ok(stdout, code) {
    return { stdout: stdout || "", stderr: "", code: code || 0, clear: false };
  }
  function bad(stderr, code, stdout) {
    var s = stderr || "error";
    if (s.charAt(s.length - 1) !== "\n") s += "\n";
    return { stdout: stdout || "", stderr: s, code: code == null ? 1 : code, clear: false };
  }
  function finish(state, res) {
    state.lastCode = res.code;
    return res;
  }

  function normalize(p) {
    var parts = [];
    String(p).split("/").forEach(function (part) {
      if (!part || part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });
    return "/" + parts.join("/");
  }
  function resolve(state, p) {
    if (p === "~" || p.indexOf("~/") === 0) p = state.home + p.slice(1);
    if (p.charAt(0) !== "/") p = state.cwd.replace(/\/$/, "") + "/" + p;
    return normalize(p);
  }
  function parent(p) {
    if (p === "/") return "/";
    return p.replace(/\/[^/]+$/, "") || "/";
  }
  function base(p) {
    return p.split("/").pop();
  }
  function join(dir, name) {
    if (dir === "/") return "/" + name;
    return dir.replace(/\/$/, "") + "/" + name;
  }

  function klass(node, state) {
    if (!node) return 0;
    if (state.user === "root") return 7;
    if (node.owner === state.user) return (node.mode >> 6) & 7;
    if (node.group === state.group || state.groups.indexOf(node.group) !== -1) return (node.mode >> 3) & 7;
    return node.mode & 7;
  }
  function allows(node, state, bit) {
    return (klass(node, state) & bit) !== 0;
  }
  function walk(state, path, bit) {
    if (!state.files[path]) return { missing: true };
    var parts = path.split("/").filter(Boolean);
    var cur = "";
    for (var i = 0; i < parts.length; i++) {
      cur += "/" + parts[i];
      var node = state.files[cur];
      if (!node) return { missing: true };
      var last = i === parts.length - 1;
      var need = last ? bit : 1;
      if (node.kind === "link" && !last) return { denied: true };
      if (!allows(node, state, need)) return { denied: true, node: node };
    }
    return { node: state.files[path] };
  }
  function follow(state, path, depth) {
    var node = state.files[path];
    if (!node) return null;
    if (node.kind !== "link") return { path: path, node: node };
    if (depth > 8) return null;
    var raw = node.target.charAt(0) === "/" ? node.target : join(parent(path), node.target);
    return follow(state, normalize(raw), (depth || 0) + 1);
  }

  function children(state, dir) {
    var names = [];
    Object.keys(state.files).forEach(function (key) {
      if (key === dir) return;
      if (dir === "/") {
        if (key !== "/" && key.indexOf("/", 1) === -1) names.push(key.slice(1));
      } else if (key.indexOf(dir + "/") === 0 && key.slice(dir.length + 1).indexOf("/") === -1) {
        names.push(key.slice(dir.length + 1));
      }
    });
    names.sort();
    return names.map(function (name) {
      var path = join(dir, name);
      return { name: name, path: path, node: state.files[path] };
    });
  }

  function modeStr(node) {
    var kind = node.kind === "dir" ? "d" : node.kind === "link" ? "l" : "-";
    var special = [2048, 1024, 512];
    var letter = ["s", "s", "t"];
    var s = kind;
    [6, 3, 0].forEach(function (shift, i) {
      var v = (node.mode >> shift) & 7;
      var x = v & 1 ? "x" : "-";
      if (node.mode & special[i]) x = v & 1 ? letter[i] : letter[i].toUpperCase();
      s += (v & 4 ? "r" : "-") + (v & 2 ? "w" : "-") + x;
    });
    if (node.acl && node.acl.length) s += "+";
    return s;
  }
  function sizeOf(node) {
    if (node.size != null) return node.size;
    if (node.kind === "dir") return 4096;
    if (node.kind === "link") return node.target.length;
    if (node.kind === "archive") {
      var sum = node.members.reduce(function (t, m) { return t + m.text.length; }, 0);
      var ratio = { gz: 0.55, bz2: 0.5, xz: 0.45, zip: 0.6, "7z": 0.42, tar: 1 }[node.format] || 1;
      return node.format === "tar" ? sum + 1024 : Math.max(20, Math.round(sum * ratio) + 20);
    }
    return (node.text || "").length;
  }
  function linkCount(state, node) {
    if (node.kind === "dir") return 2;
    var n = 0;
    Object.keys(state.files).forEach(function (k) { if (state.files[k] === node) n++; });
    return n || 1;
  }
  function inodeOf(state, node) {
    if (!node.ino) node.ino = ++state.nextIno;
    return node.ino;
  }
  var CLOCK = "2026-11-02 09:04:01";
  function touchTimes(node, which) {
    which.forEach(function (w) { node[w] = CLOCK; });
  }
  function human(n) {
    if (n < 1024) return n + "B";
    if (n < 1048576) return (n / 1024).toFixed(1) + "K";
    if (n < 1073741824) return (n / 1048576).toFixed(1) + "M";
    return (n / 1073741824).toFixed(1) + "G";
  }
  function bytesOf(state, path) {
    var node = state.files[path];
    if (!node) return 0;
    if (node.size != null) return node.size;
    if (node.kind === "file" || node.kind === "link") return (node.text || node.target || "").length;
    if (node.kind === "archive") {
      return node.members.reduce(function (sum, m) { return sum + m.text.length; }, 0);
    }
    var total = 0;
    children(state, path).forEach(function (ch) { total += bytesOf(state, ch.path); });
    return total;
  }

  function lookup(state, name) {
    if (name === "?") return String(state.lastCode || 0);
    if (name === "$") return "901";
    if (name === "#") return String((state.pos || []).length);
    if (/^[0-9]$/.test(name)) {
      if (name === "0") return "bash";
      var v = (state.pos || [])[Number(name) - 1];
      if (v == null) return missing(state, name);
      return v;
    }
    if (Object.prototype.hasOwnProperty.call(state.env, name)) return state.env[name];
    return missing(state, name);
  }
  function missing(state, name) {
    if (state.nounset) {
      var err = new Error("unbound");
      err.unbound = name;
      throw err;
    }
    return "";
  }
  function nounsetResult(e) {
    if (e && e.unbound) return bad("bash: " + e.unbound + ": unbound variable");
    return bad("bash: " + (e.message || "bad substitution"));
  }

  function expandBrace(state, body) {
    var len = body.match(/^#([A-Za-z_][A-Za-z0-9_]*)\[@\]$/);
    if (len) return String((state.arrays[len[1]] || []).length);
    var ix = body.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(@|\*|[0-9]+)\]$/);
    if (ix) {
      var arr = state.arrays[ix[1]] || [];
      if (ix[2] === "@" || ix[2] === "*") return arr.join(" ");
      return arr[Number(ix[2])] == null ? "" : String(arr[Number(ix[2])]);
    }
    var def = body.match(/^([A-Za-z_][A-Za-z0-9_]*):-(.*)$/);
    if (def) {
      var cur = Object.prototype.hasOwnProperty.call(state.env, def[1]) ? state.env[def[1]] : "";
      if (cur === "") return expandVars(state, def[2]);
      return cur;
    }
    var slen = body.match(/^#([A-Za-z_][A-Za-z0-9_]*)$/);
    if (slen) {
      var sv = Object.prototype.hasOwnProperty.call(state.env, slen[1]) ? String(state.env[slen[1]]) : "";
      return String(sv.length);
    }
    return lookup(state, body);
  }

  function evalExpr(s) {
    var i = 0;
    function skip() { while (s.charAt(i) === " ") i++; }
    function factor() {
      skip();
      if (s.charAt(i) === "+") { i++; return factor(); }
      if (s.charAt(i) === "-") { i++; return -factor(); }
      if (s.charAt(i) === "(") {
        i++;
        var v = expr();
        skip();
        if (s.charAt(i) === ")") i++;
        return v;
      }
      var num = "";
      while (/[0-9]/.test(s.charAt(i))) num += s.charAt(i++);
      if (!num) throw new Error("bad math");
      return Number(num);
    }
    function term() {
      var v = factor();
      skip();
      while (i < s.length && "*/%".indexOf(s.charAt(i)) !== -1) {
        var op = s.charAt(i++);
        var r = factor();
        if ((op === "/" || op === "%") && r === 0) throw new Error("division by zero");
        v = op === "*" ? v * r : op === "/" ? Math.trunc(v / r) : v % r;
        skip();
      }
      return v;
    }
    function expr() {
      var v = term();
      skip();
      while (s.charAt(i) === "+" || s.charAt(i) === "-") {
        var op = s.charAt(i++);
        var r = term();
        v = op === "+" ? v + r : v - r;
        skip();
      }
      return v;
    }
    return expr();
  }

  function arith(state, expr) {
    var replaced = expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, function (name) {
      var v = lookup(state, name);
      if (v === "") return "0";
      if (!/^-?[0-9]+$/.test(v)) throw new Error(name + " is not a whole number");
      return v;
    });
    if (!/^[-+*/%()\d\s]+$/.test(replaced)) throw new Error("only + - * / % are allowed here");
    return String(evalExpr(replaced));
  }

  function matching(s, i, open, close) {
    var depth = 0;
    for (var k = i; k < s.length; k++) {
      if (s.charAt(k) === open) depth++;
      else if (s.charAt(k) === close) {
        depth--;
        if (depth === 0) return k;
      }
    }
    return -1;
  }

  function expandVars(state, s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i) !== "$") { out += s.charAt(i); continue; }
      if (s.charAt(i + 1) === "(" && s.charAt(i + 2) === "(") {
        var end = s.indexOf("))", i + 3);
        if (end < 0) throw new Error("missing ))");
        out += arith(state, s.slice(i + 3, end));
        i = end + 1;
        continue;
      }
      if (s.charAt(i + 1) === "(") {
        var close = matching(s, i + 1, "(", ")");
        if (close < 0) throw new Error("missing )");
        if (state.depth > 4) throw new Error("too many nested commands");
        state.depth++;
        var sub = runLine(state, s.slice(i + 2, close));
        state.depth--;
        out += String(sub.stdout || "").replace(/\n$/, "");
        state.lastCode = sub.code;
        i = close;
        continue;
      }
      if (s.charAt(i + 1) === "{") {
        var brace = s.indexOf("}", i + 2);
        if (brace < 0) throw new Error("missing }");
        out += expandBrace(state, s.slice(i + 2, brace));
        i = brace;
        continue;
      }
      var n1 = s.charAt(i + 1);
      if (n1 === "?" || n1 === "$" || n1 === "#") {
        out += n1 === "?" ? String(state.lastCode || 0) : n1 === "$" ? "901" : String((state.pos || []).length);
        i++;
        continue;
      }
      if (/[0-9]/.test(n1)) {
        out += lookup(state, n1);
        i++;
        continue;
      }
      var j = i + 1;
      while (/[A-Za-z0-9_]/.test(s.charAt(j))) j++;
      if (j === i + 1) { out += "$"; continue; }
      out += lookup(state, s.slice(i + 1, j));
      i = j - 1;
    }
    return out;
  }

  function globToReg(base) {
    var re = "";
    for (var i = 0; i < base.length; i++) {
      var c = base.charAt(i);
      if (c === "*") re += ".*";
      else if (c === "?") re += ".";
      else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
    return new RegExp("^" + re + "$");
  }
  function globMany(state, pattern) {
    var slash = pattern.lastIndexOf("/");
    var dirPart = slash === -1 ? state.cwd : (pattern.slice(0, slash) || "/");
    var baseName = slash === -1 ? pattern : pattern.slice(slash + 1);
    var abs = dirPart.charAt(0) === "/" ? normalize(dirPart) : resolve(state, dirPart);
    var node = state.files[abs];
    if (!node || node.kind !== "dir") return [pattern];
    var showHidden = state.dotglob || baseName.charAt(0) === ".";
    var re = globToReg(baseName);
    var hits = children(state, abs).map(function (ch) { return ch.name; }).filter(function (name) {
      if (name === "." || name === "..") return false;
      if (!showHidden && name.charAt(0) === ".") return false;
      return re.test(name);
    });
    if (!hits.length) return [pattern];
    return hits.map(function (name) {
      if (slash === -1) return name;
      return join(abs, name);
    });
  }

  function lex(line) {
    var tokens = [];
    var i = 0;
    while (i < line.length) {
      while (line.charAt(i) === " " || line.charAt(i) === "\t") i++;
      if (i >= line.length) break;
      if (line.charAt(i) === "#") break;
      if (line.substr(i, 4) === "2>&1") { tokens.push({ op: "2>&1" }); i += 4; continue; }
      if (line.substr(i, 3) === "&>>") { tokens.push({ op: "&>>" }); i += 3; continue; }
      if (line.substr(i, 2) === "&>") { tokens.push({ op: "&>" }); i += 2; continue; }
      if (line.substr(i, 3) === "2>>") { tokens.push({ op: "2>>" }); i += 3; continue; }
      if (line.substr(i, 2) === "2>") { tokens.push({ op: "2>" }); i += 2; continue; }
      if (line.substr(i, 2) === ">>") { tokens.push({ op: ">>" }); i += 2; continue; }
      var ch = line.charAt(i);
      if (ch === ">" || ch === "<" || ch === "|") { tokens.push({ op: ch }); i++; continue; }
      var buf = "";
      var mode = "none";
      var quote = null;
      while (i < line.length) {
        var c = line.charAt(i);
        if (quote) {
          if (c === quote) { quote = null; i++; continue; }
          buf += c;
          i++;
          continue;
        }
        if (c === "'" || c === "\"") {
          quote = c;
          mode = c === "'" && mode !== "double" ? "single" : "double";
          i++;
          continue;
        }
        if (c === "\\") {
          buf += line.charAt(i + 1);
          i += 2;
          continue;
        }
        if (c === "$" && (line.charAt(i + 1) === "(" || line.charAt(i + 1) === "{")) {
          if (line.substr(i, 3) === "$((") {
            var mathEnd = line.indexOf("))", i + 3);
            if (mathEnd < 0) { buf += c; i++; continue; }
            buf += line.slice(i, mathEnd + 2);
            i = mathEnd + 2;
            continue;
          }
          var openCh = line.charAt(i + 1);
          var closeCh = openCh === "{" ? "}" : ")";
          var closeAt = matching(line, i + 1, openCh, closeCh);
          if (closeAt < 0) { buf += c; i++; continue; }
          buf += line.slice(i, closeAt + 1);
          i = closeAt + 1;
          continue;
        }
        if (c === " " || c === "\t" || c === "|" || c === ">" || c === "<") break;
        if (line.substr(i, 2) === "2>" || line.substr(i, 2) === "&>") break;
        buf += c;
        i++;
      }
      tokens.push({ word: buf, mode: mode });
    }
    return tokens;
  }

  function splitComma(s) {
    var parts = [];
    var buf = "";
    var depth = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "{") depth++;
      if (c === "}") depth--;
      if (c === "," && depth === 0) { parts.push(buf); buf = ""; continue; }
      buf += c;
    }
    parts.push(buf);
    return parts;
  }
  function expandBraces(word) {
    var start = -1;
    var depth = 0;
    for (var i = 0; i < word.length; i++) {
      var c = word.charAt(i);
      if (c === "{") { if (depth === 0) start = i; depth++; }
      else if (c === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          var inner = word.slice(start + 1, i);
          var alts = null;
          var range = inner.match(/^(-?\d+)\.\.(-?\d+)$/);
          if (range) {
            alts = [];
            var a = Number(range[1]);
            var b = Number(range[2]);
            var step = a <= b ? 1 : -1;
            var guard = 0;
            for (var n = a; step > 0 ? n <= b : n >= b; n += step) {
              alts.push(String(n));
              if (++guard > 40) break;
            }
          } else if (inner.indexOf(",") !== -1) alts = splitComma(inner);
          if (alts) {
            var pre = word.slice(0, start);
            var post = word.slice(i + 1);
            var out = [];
            alts.forEach(function (alt) {
              expandBraces(pre + alt + post).forEach(function (one) { out.push(one); });
            });
            return out;
          }
        }
      }
    }
    return [word];
  }
  function prepare(state, tok) {
    if (tok.mode === "single") return [tok.word];
    var pieces = tok.mode === "none" ? expandBraces(tok.word) : [tok.word];
    var out = [];
    pieces.forEach(function (piece) {
      if (piece === "~" || piece.indexOf("~/") === 0) piece = state.home + piece.slice(1);
      var expanded = expandVars(state, piece);
      if (tok.mode === "none" && /[*?]/.test(expanded)) {
        var hits = globMany(state, expanded);
        var missed = hits.length === 1 && hits[0] === expanded;
        if (missed && state.nullglob) return;
        out = out.concat(hits);
      } else out.push(expanded);
    });
    return out;
  }

  function linesOf(text) {
    var parts = String(text || "").split("\n");
    if (parts.length && parts[parts.length - 1] === "") parts.pop();
    return parts;
  }
  function asText(rows) {
    if (!rows.length) return "";
    return rows.join("\n") + "\n";
  }

  function readPath(state, path) {
    if (path === "/dev/null") return ok("");
    var got = walk(state, path, 4);
    if (got.missing) return bad("cat: " + path + ": No such file or directory");
    if (got.denied) return bad("cat: " + path + ": Permission denied");
    var hit = follow(state, path, 0);
    if (!hit) {
      var probe = path;
      for (var hop = 0; hop < 10 && state.files[probe] && state.files[probe].kind === "link"; hop++) {
        var t = state.files[probe].target;
        probe = normalize(t.charAt(0) === "/" ? t : join(parent(probe), t));
      }
      return bad("cat: " + path + ": " + (state.files[probe] ? "Too many levels of symbolic links" : "No such file or directory"));
    }
    if (hit.node.kind === "dir") return bad("cat: " + path + ": Is a directory");
    if (hit.node.kind === "archive") return bad("cat: " + path + ": this is an archive. Use tar -tzf or unzip -l");
    if (!allows(hit.node, state, 4)) return bad("cat: " + path + ": Permission denied");
    return ok(hit.node.text.charAt(hit.node.text.length - 1) === "\n" || hit.node.text === "" ? hit.node.text : hit.node.text + "\n");
  }

  function writeFile(state, path, text, append) {
    if (path === "/dev/null") return ok("");
    var dir = parent(path);
    var folder = state.files[dir];
    if (!folder || folder.kind !== "dir") return bad("bash: " + path + ": No such file or directory");
    if (!allows(folder, state, 2) || !allows(folder, state, 1)) return bad("bash: " + path + ": Permission denied");
    var existing = state.files[path];
    if (existing && existing.kind === "dir") return bad("bash: " + path + ": Is a directory");
    if (existing && existing.kind !== "link" && !allows(existing, state, 2) && existing.owner !== state.user) {
      return bad("bash: " + path + ": Permission denied");
    }
    if (existing && existing.kind === "file") {
      var frozen = attrBlock(state, path, "bash");
      if (frozen && !(append && existing.attrs.indexOf("a") !== -1)) return bad("bash: " + path + ": Operation not permitted");
      if (existing.attrs && existing.attrs.indexOf("a") !== -1 && !append) return bad("bash: " + path + ": Operation not permitted (append-only attribute)");
      delete existing.size;
      existing.text = append ? existing.text + text : text;
      touchTimes(existing, ["mtime", "ctime"]);
      return ok("");
    }
    state.files[path] = file(text, existing ? existing.mode : 420);
    state.files[path].owner = existing && existing.owner ? existing.owner : state.user;
    state.files[path].group = existing && existing.group ? existing.group : state.group;
    var defaults = (folder.acl || []).filter(function (e) { return e.def; });
    if (defaults.length) {
      var made = state.files[path];
      made.acl = defaults.map(function (e) { return { type: e.type, name: e.name, perms: e.perms.replace("x", "-"), def: false }; });
      made.groupBits = (made.mode >> 3) & 7;
      made.mode = (made.mode & ~56) | (aclMask(made) << 3);
    }
    if ((folder.mode & 1024) && !existing) state.files[path].group = folder.group;
    touchTimes(state.files[path], ["atime", "mtime", "ctime", "btime"]);
    return ok("");
  }

  function ensureDir(state, path) {
    if (state.files[path] && state.files[path].kind === "dir") return ok("");
    var dir = parent(path);
    if (!state.files[dir] || state.files[dir].kind !== "dir") return bad("mkdir: cannot create directory '" + path + "': No such file or directory");
    if (!allows(state.files[dir], state, 2)) return bad("mkdir: cannot create directory '" + path + "': Permission denied");
    state.files[path] = newDir(state.user, 493);
    state.files[path].group = state.group;
    var up = state.files[dir];
    if (up.mode & 1024) { state.files[path].group = up.group; state.files[path].mode |= 1024; }
    if (up.acl && up.acl.some(function (e) { return e.def; })) state.files[path].acl = up.acl.map(function (e) { return Object.assign({}, e); });
    return ok("");
  }

  function removePath(state, path, recursive, force) {
    var normal = normalize(path);
    if (normal === "/" || normal === "/home" || normal === "/home/ana" || normal === state.home) {
      return bad("rm: refusing to remove '" + normal + "'. The lab will not delete the home directory. On a real host this can wipe files.");
    }
    if (!state.files[normal]) return force ? ok("") : bad("rm: cannot remove '" + normal + "': No such file or directory");
    var node = state.files[normal];
    var holder = state.files[parent(normal)];
    if (node.attrs && /[ia]/.test(node.attrs)) return bad("rm: cannot remove '" + normal + "': Operation not permitted");
    if (holder && state.user !== "root") {
      if (!allows(holder, state, 2)) return bad("rm: cannot remove '" + normal + "': Permission denied");
      if ((holder.mode & 512) && node.owner !== state.user && holder.owner !== state.user) {
        return bad("rm: cannot remove '" + normal + "': Operation not permitted (sticky bit on " + parent(normal) + ")");
      }
    }
    if (node.kind === "dir") {
      if (!recursive) return bad("rm: cannot remove '" + normal + "': Is a directory");
      children(state, normal).forEach(function (ch) { removePath(state, ch.path, true, true); });
    }
    delete state.files[normal];
    return ok("");
  }

  function copyNode(state, from, to) {
    var src = state.files[from];
    if (!src) return bad("cp: cannot stat '" + from + "': No such file or directory");
    if (src.kind === "dir") return bad("cp: -r not set; omitting directory '" + from + "'");
    var dest = to;
    if (state.files[to] && state.files[to].kind === "dir") dest = join(to, base(from));
    var text = src.kind === "link" ? src.target : src.kind === "archive" ? "" : src.text;
    if (src.kind === "archive") {
      state.files[dest] = { kind: "archive", format: src.format, mode: src.mode, owner: state.user, group: state.group, members: src.members.map(function (m) { return { name: m.name, text: m.text }; }) };
      return ok("");
    }
    var written = writeFile(state, dest, src.kind === "link" ? "" : text, false);
    if (written.code !== 0) return written;
    if (src.kind === "link") {
      state.files[dest] = { kind: "link", mode: 511, owner: state.user, group: state.group, target: src.target, text: "" };
    }
    return ok("");
  }

  function moveNode(state, from, to) {
    if (!state.files[from]) return bad("mv: cannot stat '" + from + "': No such file or directory");
    var dest = to;
    if (state.files[to] && state.files[to].kind === "dir") dest = join(to, base(from));
    var keys = Object.keys(state.files).filter(function (k) { return k === from || k.indexOf(from + "/") === 0; });
    keys.sort(function (a, b) { return b.length - a.length; });
    keys.forEach(function (k) {
      state.files[dest + k.slice(from.length)] = state.files[k];
      delete state.files[k];
    });
    return ok("");
  }

  var MAN = {
    ls: "ls — list names in a directory\n\nls [options] [path]\n\n-l  long rows (type, permissions, owner, size, name)\n-a  include names that start with a dot",
    cd: "cd — change the current directory\n\ncd [path]\n\nWith no path, cd returns to your home directory.",
    pwd: "pwd — print the current directory",
    grep: "grep — print lines that contain a pattern\n\ngrep [options] pattern [file]\n\n-n  line numbers\n-i  ignore case\n-c  count matches\n-v  lines that do not match\n-q  no output, only a success or failure code",
    chmod: "chmod — change the permission bits\n\nchmod mode path\n\n644 means rw-r--r--. u+x adds execute for the owner.",
    ssh: "ssh — start a shell on another host\n\nssh user@host\n\nThis lab does not open a real connection.",
    tar: "tar — pack files into one archive\n\ntar -czf name.tar.gz files\ntar -tzf name.tar.gz\ntar -xzf name.tar.gz\n\nc create, x extract, t list, z gzip, f archive name",
    find: "find — walk directories and print matching paths\n\nfind . -name '*.txt'\n\nQuote the pattern so the shell does not expand * first."
  };

  function visible(state, cmd) {
    if (BUILTIN[cmd] || state.fns[cmd] || state.aliases[cmd]) return true;
    var dirs = String(state.env.PATH || "").split(":");
    return dirs.indexOf("/usr/bin") !== -1 && !!COMMANDS[cmd];
  }

  function cmdEcho(argv) {
    var nflag = false;
    var args = argv.filter(function (a, i) { if (i === 0 && a === "-n") { nflag = true; return false; } return true; });
    return ok(args.join(" ") + (nflag ? "" : "\n"));
  }
  function cmdPwd(state) { return ok(state.cwd + "\n"); }
  function cmdCd(state, argv) {
    var dest = argv[0] == null || argv[0] === "" ? state.home : argv[0] === "-" ? state.prev : resolve(state, argv[0]);
    var node = state.files[dest];
    if (node && node.kind === "link") {
      var hit = follow(state, dest, 0);
      if (hit) dest = hit.path;
      node = state.files[dest];
    }
    if (!node || node.kind !== "dir") return bad("cd: " + (argv[0] || "") + ": No such file or directory");
    if (!allows(node, state, 1) || !allows(node, state, 4)) return bad("cd: " + dest + ": Permission denied");
    state.prev = state.cwd;
    state.cwd = dest;
    state.env.PWD = dest;
    return ok("");
  }
  function cmdLs(state, argv) {
    var long = false, all = false, flagF = false, inode = false, dirOnly = false, humanSize = false;
    var paths = [];
    argv.forEach(function (a) {
      if (a.charAt(0) === "-" && a.length > 1) {
        if (a.indexOf("l") !== -1) long = true;
        if (a.indexOf("a") !== -1) all = true;
        if (a.indexOf("F") !== -1) flagF = true;
        if (a.indexOf("i") !== -1) inode = true;
        if (a.indexOf("d") !== -1) dirOnly = true;
        if (a.indexOf("h") !== -1) humanSize = true;
      } else paths.push(a);
    });
    if (!paths.length) paths = ["."];
    var blocks = [];
    var errors = [];
    var shownPaths = paths.length;
    paths = paths.slice().sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
    for (var p = 0; p < paths.length; p++) {
      var path = resolve(state, paths[p]);
      var node = state.files[path];
      if (!node) { errors.push("ls: cannot access '" + paths[p] + "': No such file or directory"); continue; }
      var rows = [];
      if (node.kind === "dir" && !dirOnly) {
        if (all) rows.push({ name: ".", path: path, node: node }, { name: "..", path: parent(path), node: state.files[parent(path)] || node });
        children(state, path).forEach(function (ch) {
          if (!all && ch.name.charAt(0) === ".") return;
          rows.push(ch);
        });
      } else rows.push({ name: paths[p], path: path, node: node });
      var text = rows.map(function (row) {
        var name = row.name;
        var n = row.node;
        if (flagF && n.kind === "dir") name += "/";
        if (flagF && n.kind === "link") name += "@";
        var ino = inode ? String(inodeOf(state, n)) + " " : "";
        if (!long) return ino + name;
        var shown = n.kind === "link" ? name + " -> " + n.target : name;
        var when = n.mtime === CLOCK ? "Nov  2 09:04" : "Nov  2 09:00";
        var sz = humanSize ? human(sizeOf(n)).replace(/B$/, "").replace(".0", "") : String(sizeOf(n));
        return ino + modeStr(n) + " " + linkCount(state, n) + " " + n.owner + " " + n.group + " " + sz.padStart(5, " ") + " " + when + " " + shown;
      }).join("\n");
      if (node.kind === "dir" && !dirOnly && shownPaths > 1) text = paths[p] + ":\n" + text;
      blocks.push({ text: text, single: !(node.kind === "dir" && !dirOnly) });
    }
    var singles = blocks.filter(function (b) { return b.single; }).map(function (b) { return b.text; });
    var dirs = blocks.filter(function (b) { return !b.single; }).map(function (b) { return b.text; });
    var all2 = (singles.length ? [singles.join("\n")] : []).concat(dirs).filter(Boolean);
    return { stdout: all2.join("\n\n") + (all2.length ? "\n" : ""), stderr: asText(errors), code: errors.length ? 2 : 0, clear: false };
  }

  function collectText(state, argv, stdin) {
    if (!argv.length) return { text: stdin || "", code: 0, stderr: "" };
    var all = "";
    for (var i = 0; i < argv.length; i++) {
      var path = resolve(state, argv[i]);
      var got = readPath(state, path);
      if (got.code !== 0) return { text: "", code: got.code, stderr: got.stderr };
      all += got.stdout;
    }
    return { text: all, code: 0, stderr: "" };
  }

  function cmdCat(state, argv, stdin) {
    if (!argv.length && !stdin) return bad("cat: no file named. This lab does not wait for keyboard input. Pass a file, or pipe text in.");
    var got = collectText(state, argv, stdin);
    if (got.code !== 0) return bad(got.stderr.trim());
    return ok(got.text);
  }
  function takeN(argv) {
    var n = 10;
    var files = [];
    for (var i = 0; i < argv.length; i++) {
      if (argv[i] === "-n") n = Number(argv[++i]);
      else if (/^-n-?[0-9]+$/.test(argv[i])) n = Number(argv[i].slice(2));
      else if (argv[i].charAt(0) === "-") return { error: "unknown option " + argv[i] };
      else files.push(argv[i]);
    }
    return { n: n, files: files };
  }
  function cmdHead(state, argv, stdin) {
    var spec = takeN(argv);
    if (spec.error) return bad("head: " + spec.error);
    var got = collectText(state, spec.files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text);
    var cut = spec.n < 0 ? rows.slice(0, rows.length + spec.n) : rows.slice(0, spec.n);
    return ok(asText(cut));
  }
  function cmdTail(state, argv, stdin) {
    var spec = takeN(argv);
    if (spec.error) return bad("tail: " + spec.error);
    var got = collectText(state, spec.files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text);
    var cut;
    if (String(argv.join(" ")).indexOf("-n +") !== -1 || (argv[0] === "-n" && String(argv[1]).charAt(0) === "+")) {
      var start = Math.abs(spec.n) - 1;
      cut = rows.slice(start < 0 ? 0 : start);
    } else cut = spec.n < 0 ? rows.slice(0, rows.length + spec.n) : rows.slice(Math.max(0, rows.length - spec.n));
    return ok(asText(cut));
  }
  function cmdGrep(state, argv, stdin) {
    var flags = {};
    var rest = [];
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a.charAt(0) === "-" && a !== "-") {
        a.slice(1).split("").forEach(function (ch) { flags[ch] = true; });
      } else rest.push(a);
    }
    if (!rest.length) return bad("grep: missing pattern");
    var pattern = rest[0];
    var files = rest.slice(1);
    if (flags.r || flags.R) {
      var start = files[0] || ".";
      var listed = [];
      (function walkAll(p, label) {
        var n = state.files[p];
        if (!n) return;
        if (n.kind === "dir") children(state, p).forEach(function (ch) { walkAll(ch.path, label.replace(/\/$/, "") + "/" + ch.name); });
        else if (n.kind === "file" && allows(n, state, 4)) listed.push(label);
      })(resolve(state, start), start);
      files = listed.sort();
      if (!files.length) return ok("", 1);
    }
    var source = flags.F ? pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : flags.E ? ereToJs(pattern) : breToJs(pattern);
    if (flags.w) source = "\\b(?:" + source + ")\\b";
    if (flags.x) source = "^(?:" + source + ")$";
    var re;
    try { re = new RegExp(source, flags.i ? "gi" : "g"); }
    catch (e) { return bad("grep: invalid regular expression: " + pattern, 2); }
    var many = files.length > 1;
    var matched = [];
    var hitFiles = [];
    var counts = [];
    var total = 0;
    var targets = files.length ? files : [null];
    for (var f = 0; f < targets.length; f++) {
      var got = collectText(state, targets[f] == null ? [] : [targets[f]], stdin);
      if (got.code) return bad(got.stderr.trim().replace(/^cat:/, "grep:"), 2);
      var rows = linesOf(got.text);
      var count = 0;
      for (var r = 0; r < rows.length; r++) {
        re.lastIndex = 0;
        var yes = re.test(rows[r]);
        if (flags.v) yes = !yes;
        if (!yes) continue;
        count++;
        var tag = (many ? targets[f] + ":" : "") + (flags.n ? (r + 1) + ":" : "");
        if (flags.o && !flags.v) {
          re.lastIndex = 0;
          var m;
          while ((m = re.exec(rows[r])) && m[0] !== "") matched.push(tag + m[0]);
        } else matched.push(tag + rows[r]);
      }
      total += count;
      if (count) hitFiles.push(targets[f] || "(standard input)");
      counts.push((many ? targets[f] + ":" : "") + count);
    }
    var code = total ? 0 : 1;
    if (flags.q) return ok("", code);
    if (flags.l) return ok(asText(hitFiles), code);
    if (flags.c) return ok(asText(counts), code);
    return ok(asText(matched), code);
  }
  function breToJs(p) {
    var out = "";
    for (var i = 0; i < p.length; i++) {
      var c = p.charAt(i);
      if (c === "\\" && i + 1 < p.length) {
        var n = p.charAt(i + 1);
        out += "+?|(){}".indexOf(n) !== -1 ? n : "\\" + n;
        i++;
      } else if ("+?|(){}".indexOf(c) !== -1) out += "\\" + c;
      else if (c === "[") {
        var close = p.indexOf("]", i + (p.charAt(i + 1) === "]" ? 2 : p.charAt(i + 1) === "^" && p.charAt(i + 2) === "]" ? 3 : 1));
        if (close === -1) { out += "\\["; continue; }
        out += posixClasses(p.slice(i, close + 1));
        i = close;
      } else out += c;
    }
    return out;
  }
  function posixClasses(set) {
    var map = { alpha: "A-Za-z", digit: "0-9", alnum: "A-Za-z0-9", upper: "A-Z", lower: "a-z", space: "\\s", blank: " \\t", punct: "!-\\/:-@\\[-`{-~", xdigit: "0-9A-Fa-f" };
    return set.replace(/\[:([a-z]+):\]/g, function (m, name) { return map[name] || m; });
  }
  function ereToJs(p) {
    return p.replace(/\[[^\]]*\[:[a-z]+:\][^\]]*\]/g, posixClasses);
  }
  function cmdCut(argv, stdin, state) {
    var delim = "\t";
    var fields = "";
    var files = [];
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-d") delim = argv[++i];
      else if (a.indexOf("-d") === 0 && a.length > 2) delim = a.slice(2);
      else if (a === "-f") fields = argv[++i];
      else if (a.indexOf("-f") === 0 && a.length > 2) fields = a.slice(2);
      else if (a.charAt(0) === "-") return bad("cut: unknown option " + a);
      else files.push(a);
    }
    if (!fields) return bad("cut: you need -f, for example cut -d: -f1");
    var want = {};
    fields.split(",").forEach(function (part) {
      if (part.indexOf("-") !== -1 && part !== "-") {
        var bits = part.split("-");
        var from = bits[0] ? Number(bits[0]) : 1;
        var to = bits[1] ? Number(bits[1]) : 30;
        for (var n = from; n <= to; n++) want[n] = true;
      } else want[Number(part)] = true;
    });
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text).map(function (line) {
      var cols = line.split(delim);
      var picked = [];
      cols.forEach(function (col, idx) { if (want[idx + 1]) picked.push(col); });
      return picked.join(delim);
    });
    return ok(asText(rows));
  }
  function cmdSort(state, argv, stdin) {
    var numeric = false, reverse = false, key = 0, unique = false, sep = null, fold = false, human = false;
    var files = [];
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-k") key = parseInt(argv[++i], 10);
      else if (/^-k[0-9]/.test(a)) key = parseInt(a.slice(2), 10);
      else if (a === "-t") sep = argv[++i];
      else if (/^-t./.test(a)) sep = a.slice(2);
      else if (/^-[nrufh]+$/.test(a)) {
        if (a.indexOf("n") !== -1) numeric = true;
        if (a.indexOf("r") !== -1) reverse = true;
        if (a.indexOf("u") !== -1) unique = true;
        if (a.indexOf("f") !== -1) fold = true;
        if (a.indexOf("h") !== -1) human = true;
      }
      else if (a.charAt(0) === "-") return bad("sort: unknown option " + a);
      else files.push(a);
    }
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text);
    function field(line) {
      var v = !key ? line : (sep == null ? line.trim().split(/\s+/) : line.split(sep))[key - 1] || "";
      if (human) {
        var hm = v.match(/^([0-9.]+)([KMGT]?)/i);
        if (hm) return String(Number(hm[1]) * Math.pow(1024, " KMGT".indexOf((hm[2] || " ").toUpperCase())));
      }
      return fold ? v.toLowerCase() : v;
    }
    if (human) numeric = true;
    rows.sort(function (a, b) {
      var x = field(a), y = field(b);
      var nx = parseFloat(String(x).trim()), ny = parseFloat(String(y).trim());
      var cmp = numeric ? ((isNaN(nx) ? 0 : nx) - (isNaN(ny) ? 0 : ny)) || (x < y ? -1 : x > y ? 1 : 0) : (x < y ? -1 : x > y ? 1 : 0);
      return reverse ? -cmp : cmp;
    });
    if (unique) {
      var seen = {};
      rows = rows.filter(function (row) { if (seen[row]) return false; seen[row] = true; return true; });
    }
    return ok(asText(rows));
  }
  function cmdUniq(state, argv, stdin) {
    var flags = argv.filter(function (a) { return a.charAt(0) === "-" && a.length > 1; }).join("");
    var got = collectText(state, argv.filter(function (a) { return a.charAt(0) !== "-"; }), stdin);
    if (got.code) return bad(got.stderr.trim());
    var fold = flags.indexOf("i") !== -1;
    var groups = [];
    linesOf(got.text).forEach(function (line) {
      var last = groups[groups.length - 1];
      var key = fold ? line.toLowerCase() : line;
      if (last && last.key === key) last.n++;
      else groups.push({ key: key, line: line, n: 1 });
    });
    if (flags.indexOf("d") !== -1) groups = groups.filter(function (g) { return g.n > 1; });
    if (flags.indexOf("u") !== -1) groups = groups.filter(function (g) { return g.n === 1; });
    var counted = flags.indexOf("c") !== -1;
    return ok(asText(groups.map(function (g) { return counted ? String(g.n).padStart(7, " ") + " " + g.line : g.line; })));
  }
  function cmdWc(state, argv, stdin) {
    var countL = false, countW = false, countC = false;
    var files = [];
    argv.forEach(function (a) {
      if (a.charAt(0) === "-" && a.length > 1) {
        if (a.indexOf("l") !== -1) countL = true;
        if (a.indexOf("w") !== -1) countW = true;
        if (a.indexOf("c") !== -1) countC = true;
      } else files.push(a);
    });
    if (!countL && !countW && !countC) { countL = countW = countC = true; }
    function counts(text) {
      return [text === "" ? 0 : (text.match(/\n/g) || []).length, text.trim() === "" ? 0 : text.trim().split(/\s+/).length, text.length];
    }
    function row(c, name) {
      var parts = [];
      if (countL) parts.push(c[0]);
      if (countW) parts.push(c[1]);
      if (countC) parts.push(c[2]);
      var wide = files.length > 1 || (parts.length > 1);
      return parts.map(function (n) { return wide ? String(n).padStart(files.length > 1 ? 3 : 1) : String(n); }).join(" ") + (name ? " " + name : "");
    }
    if (files.length <= 1) {
      var got = collectText(state, files, stdin);
      if (got.code) return bad(got.stderr.trim().replace(/^cat:/, "wc:"));
      return ok(row(counts(got.text), files[0]) + "\n");
    }
    var out = [];
    var total = [0, 0, 0];
    for (var f = 0; f < files.length; f++) {
      var one = collectText(state, [files[f]], "");
      if (one.code) return bad(one.stderr.trim().replace(/^cat:/, "wc:"));
      var c = counts(one.text);
      total = total.map(function (t, i) { return t + c[i]; });
      out.push(row(c, files[f]));
    }
    out.push(row(total, "total"));
    return ok(asText(out));
  }
  function cmdTee(state, argv, stdin) {
    var append = argv.indexOf("-a") !== -1;
    var target = argv.filter(function (a) { return a !== "-a"; })[0];
    if (!target) return bad("tee: missing file");
    var written = writeFile(state, resolve(state, target), stdin || "", append);
    if (written.code) return written;
    return ok(stdin || "");
  }
  function cmdAwk(state, argv, stdin) {
    var fs = null;
    var prog = "";
    var files = [];
    var vassign = [];
    for (var i = 0; i < argv.length; i++) {
      if (argv[i] === "-F") fs = argv[++i];
      else if (argv[i].indexOf("-F") === 0 && argv[i].length > 2) fs = argv[i].slice(2);
      else if (argv[i] === "-v" && /^[A-Za-z_]\w*=/.test(argv[i + 1] || "")) {
        var pair = argv[++i];
        vassign.push([pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1)]);
      }
      else if (!prog) prog = argv[i];
      else files.push(argv[i]);
    }
    if (!prog) return bad("awk: missing program");
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var parsed;
    try { parsed = awkParse(prog); }
    catch (e) { return bad("awk: syntax error: " + e.message + ". This lab's awk knows patterns, BEGIN, END, print, printf, if, for-in, arrays, and NR NF FS OFS."); }
    var vars = { NR: 0, NF: 0, FS: fs == null ? " " : (fs === "\\t" ? "\t" : fs), OFS: " " };
    vassign.forEach(function (pair) { vars[pair[0]] = pair[1]; });
    var out = [];
    var rt = { vars: vars, arrays: {}, fields: [""], out: out, exit: false };
    try {
      awkRunBlocks(parsed, "BEGIN", rt);
      var rows = linesOf(got.text);
      for (var r = 0; r < rows.length && !rt.exit; r++) {
        vars.NR = r + 1;
        awkSetRecord(rt, rows[r]);
        try {
          for (var b = 0; b < parsed.length && !rt.exit; b++) {
            var blk = parsed[b];
            if (blk.kind !== "main") continue;
            if (blk.pattern && !awkTruth(awkEval(blk.pattern, rt))) continue;
            if (blk.body) awkExec(blk.body, rt);
            else out.push(rt.fields[0] + "\n");
          }
        } catch (skip) {
          if (!skip || !skip.awkSkip) throw skip;
        }
      }
      rt.exit = false;
      awkRunBlocks(parsed, "END", rt);
    } catch (e) {
      return bad("awk: " + (e && e.message ? e.message : "runtime error"));
    }
    return ok(out.join(""));
  }
  function awkTokens(src) {
    var toks = [];
    var i = 0;
    function prevIsValue() {
      var t = toks[toks.length - 1];
      if (t && t.t === "name" && ["print", "printf", "return", "in"].indexOf(t.v) !== -1) return false;
      return t && (t.t === "num" || t.t === "str" || t.t === "name" || t.v === ")" || t.v === "]");
    }
    while (i < src.length) {
      var c = src.charAt(i);
      if (c === " " || c === "\t") { i++; continue; }
      if (c === "\n" || c === ";") { toks.push({ t: "end" }); i++; continue; }
      if (c === "#") { while (i < src.length && src.charAt(i) !== "\n") i++; continue; }
      if (/[0-9.]/.test(c) && /[0-9]/.test(src.charAt(i + (c === "." ? 1 : 0)))) {
        var num = src.slice(i).match(/^[0-9]*\.?[0-9]+(e[+-]?[0-9]+)?/i)[0];
        toks.push({ t: "num", v: Number(num) });
        i += num.length;
        continue;
      }
      if (c === "\"") {
        var s = "";
        i++;
        while (i < src.length && src.charAt(i) !== "\"") {
          if (src.charAt(i) === "\\") {
            var e = src.charAt(i + 1);
            s += e === "n" ? "\n" : e === "t" ? "\t" : e;
            i += 2;
          } else s += src.charAt(i++);
        }
        i++;
        toks.push({ t: "str", v: s });
        continue;
      }
      if (c === "/" && !prevIsValue()) {
        var re = "";
        i++;
        while (i < src.length && src.charAt(i) !== "/") {
          if (src.charAt(i) === "\\") { re += src.substr(i, 2); i += 2; }
          else re += src.charAt(i++);
        }
        i++;
        toks.push({ t: "re", v: re });
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var word = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)[0];
        toks.push({ t: "name", v: word });
        i += word.length;
        continue;
      }
      var three = src.substr(i, 2);
      if (["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "!~"].indexOf(three) !== -1) {
        toks.push({ t: "op", v: three });
        i += 2;
        continue;
      }
      if (c === "$") { toks.push({ t: "op", v: "$" }); i++; continue; }
      toks.push({ t: "op", v: c });
      i++;
    }
    toks.push({ t: "eof" });
    return toks;
  }
  function awkParse(src) {
    var toks = awkTokens(src);
    var p = 0;
    function peek() { return toks[p]; }
    function isOp(v) { return toks[p].t === "op" && toks[p].v === v; }
    function isName(v) { return toks[p].t === "name" && toks[p].v === v; }
    function take(v) {
      if (v != null && !(toks[p].v === v)) throw new Error("expected " + v);
      return toks[p++];
    }
    function skipEnds() { while (toks[p].t === "end") p++; }
    function semi() {
      if (toks[p].t !== "end") throw new Error("expected ;");
      p++;
    }
    function block() {
      take("{");
      var list = [];
      skipEnds();
      while (!isOp("}")) {
        if (peek().t === "eof") throw new Error("missing }");
        list.push(statement());
        skipEnds();
      }
      take("}");
      return { k: "block", list: list };
    }
    function simpleList() {
      var list = [];
      if (peek().t === "end" || isOp("}") || peek().t === "eof" || isOp(">")) return list;
      list.push(expr(true));
      while (isOp(",")) { p++; list.push(expr(true)); }
      return list;
    }
    function statement() {
      if (isOp("{")) return block();
      if (isName("print") || isName("printf")) {
        var kind = take().v;
        var args;
        if (isOp("(")) {
          var save = p;
          p++;
          args = simpleList();
          if (isOp(")")) p++;
          else { p = save; args = simpleList(); }
        } else args = simpleList();
        return { k: kind, args: args };
      }
      if (isName("if")) {
        p++; take("(");
        var cond = expr();
        take(")");
        skipEnds();
        var yes = statement();
        var save2 = p;
        skipEnds();
        var no = null;
        if (isName("else")) { p++; skipEnds(); no = statement(); }
        else p = save2;
        return { k: "if", cond: cond, yes: yes, no: no };
      }
      if (isName("for")) {
        p++; take("(");
        if (peek().t === "name" && toks[p + 1].t === "name" && toks[p + 1].v === "in") {
          var v = take().v; p++;
          var arr = take().v;
          take(")");
          skipEnds();
          return { k: "forin", v: v, arr: arr, body: statement() };
        }
        var init = peek().t === "end" ? null : expr();
        semi();
        var test = peek().t === "end" ? null : expr();
        semi();
        var step = isOp(")") ? null : expr();
        take(")");
        skipEnds();
        return { k: "for", init: init, test: test, step: step, body: statement() };
      }
      if (isName("next")) { p++; return { k: "next" }; }
      if (isName("exit")) { p++; return { k: "exit" }; }
      return { k: "expr", e: expr() };
    }
    function expr(noGt) { return assignment(noGt); }
    function assignment(noGt) {
      var left = ternary(noGt);
      if (peek().t === "op" && ["=", "+=", "-=", "*=", "/="].indexOf(peek().v) !== -1 && (left.k === "var" || left.k === "idx" || left.k === "field")) {
        var op = take().v;
        return { k: "assign", op: op, target: left, value: assignment(noGt) };
      }
      return left;
    }
    function ternary(noGt) {
      var c = or(noGt);
      if (isOp("?")) {
        p++;
        var a = ternary(noGt);
        take(":");
        var b = ternary(noGt);
        return { k: "tern", c: c, a: a, b: b };
      }
      return c;
    }
    function or(noGt) {
      var l = and(noGt);
      while (isOp("||")) { p++; l = { k: "or", l: l, r: and(noGt) }; }
      return l;
    }
    function and(noGt) {
      var l = inExpr(noGt);
      while (isOp("&&")) { p++; l = { k: "and", l: l, r: inExpr(noGt) }; }
      return l;
    }
    function inExpr(noGt) {
      var l = match(noGt);
      if (isName("in")) { p++; return { k: "in", key: l, arr: take().v }; }
      return l;
    }
    function match(noGt) {
      var l = compare(noGt);
      while (isOp("~") || isOp("!~")) {
        var neg = take().v === "!~";
        l = { k: "match", l: l, r: compare(noGt), neg: neg };
      }
      return l;
    }
    function compare(noGt) {
      var l = concat(noGt);
      var ops = ["<", "<=", "==", "!=", ">=", ">"];
      if (peek().t === "op" && ops.indexOf(peek().v) !== -1 && !(noGt && peek().v === ">")) {
        var op = take().v;
        return { k: "cmp", op: op, l: l, r: concat(noGt) };
      }
      return l;
    }
    function startsValue() {
      var t = peek();
      if (t.t === "num" || t.t === "str" || t.t === "re") return true;
      if (t.t === "name") return ["in", "else"].indexOf(t.v) === -1;
      return t.t === "op" && (t.v === "$" || t.v === "(");
    }
    function concat(noGt) {
      var l = additive();
      while (startsValue()) l = { k: "cat", l: l, r: additive() };
      return l;
    }
    function additive() {
      var l = mult();
      while (isOp("+") || isOp("-")) { var op = take().v; l = { k: "bin", op: op, l: l, r: mult() }; }
      return l;
    }
    function mult() {
      var l = unary();
      while (isOp("*") || isOp("/") || isOp("%")) { var op = take().v; l = { k: "bin", op: op, l: l, r: unary() }; }
      return l;
    }
    function unary() {
      if (isOp("!")) { p++; return { k: "not", e: unary() }; }
      if (isOp("-")) { p++; return { k: "neg", e: unary() }; }
      if (isOp("+")) { p++; return unary(); }
      if (isOp("++") || isOp("--")) { var op = take().v; return { k: "pre", op: op, target: postfix() }; }
      return postfix();
    }
    function postfix() {
      var e = primary();
      if ((isOp("++") || isOp("--")) && (e.k === "var" || e.k === "idx" || e.k === "field")) {
        return { k: "post", op: take().v, target: e };
      }
      return e;
    }
    function primary() {
      var t = peek();
      if (t.t === "num") { p++; return { k: "num", v: t.v }; }
      if (t.t === "str") { p++; return { k: "str", v: t.v }; }
      if (t.t === "re") { p++; return { k: "re", v: t.v }; }
      if (isOp("$")) { p++; return { k: "field", e: primary() }; }
      if (isOp("(")) { p++; var e = expr(); take(")"); return e; }
      if (t.t === "name") {
        p++;
        if (isOp("(")) {
          p++;
          var args = [];
          if (!isOp(")")) { args.push(expr()); while (isOp(",")) { p++; args.push(expr()); } }
          take(")");
          return { k: "call", name: t.v, args: args };
        }
        if (isOp("[")) {
          p++;
          var key = expr();
          while (isOp(",")) { p++; key = { k: "cat", l: { k: "cat", l: key, r: { k: "str", v: "\u001c" } }, r: expr() }; }
          take("]");
          return { k: "idx", name: t.v, key: key };
        }
        if (t.v === "length") return { k: "call", name: "length", args: [] };
        return { k: "var", name: t.v };
      }
      throw new Error("unexpected " + (t.v != null ? t.v : t.t));
    }
    var items = [];
    skipEnds();
    while (peek().t !== "eof") {
      if (isName("BEGIN")) { p++; skipEnds(); items.push({ kind: "BEGIN", body: block() }); }
      else if (isName("END")) { p++; skipEnds(); items.push({ kind: "END", body: block() }); }
      else {
        var pat = isOp("{") ? null : expr();
        var body = isOp("{") ? block() : null;
        items.push({ kind: "main", pattern: pat, body: body });
      }
      skipEnds();
    }
    return items;
  }
  function awkNum(v) {
    if (typeof v === "number") return v;
    var m = String(v).match(/^\s*[-+]?([0-9]+\.?[0-9]*|\.[0-9]+)(e[-+]?[0-9]+)?/i);
    return m ? Number(m[0]) : 0;
  }
  function awkStr(v) {
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(6)));
    return v == null ? "" : String(v);
  }
  function awkLooksNum(v) {
    return typeof v === "number" || /^\s*[-+]?([0-9]+\.?[0-9]*|\.[0-9]+)(e[-+]?[0-9]+)?\s*$/i.test(String(v));
  }
  function awkTruth(v) {
    if (typeof v === "number") return v !== 0;
    if (awkLooksNum(v)) return awkNum(v) !== 0;
    return v !== "" && v != null;
  }
  function awkSetRecord(rt, line) {
    var fsv = rt.vars.FS;
    var cols;
    if (fsv === " ") cols = line.trim() === "" ? [] : line.trim().split(/\s+/);
    else if (fsv.length === 1) cols = line.split(fsv);
    else cols = line.split(new RegExp(fsv));
    rt.fields = [line].concat(cols);
    rt.vars.NF = cols.length;
  }
  function awkGet(rt, node) {
    if (node.k === "var") return rt.vars[node.name] == null ? "" : rt.vars[node.name];
    if (node.k === "field") { var n = awkNum(awkEval(node.e, rt)); return rt.fields[n] == null ? "" : rt.fields[n]; }
    var arr = rt.arrays[node.name] = rt.arrays[node.name] || {};
    var key = awkStr(awkEval(node.key, rt));
    return arr[key] == null ? "" : arr[key];
  }
  function awkPut(rt, node, value) {
    if (node.k === "var") {
      rt.vars[node.name] = value;
      if (node.name === "NF") { rt.fields = rt.fields.slice(0, awkNum(value) + 1); rt.fields[0] = rt.fields.slice(1).join(rt.vars.OFS); }
    } else if (node.k === "field") {
      var n = awkNum(awkEval(node.e, rt));
      if (n === 0) awkSetRecord(rt, awkStr(value));
      else {
        while (rt.fields.length <= n) rt.fields.push("");
        rt.fields[n] = awkStr(value);
        rt.vars.NF = rt.fields.length - 1;
        rt.fields[0] = rt.fields.slice(1).join(awkStr(rt.vars.OFS));
      }
    } else {
      var arr = rt.arrays[node.name] = rt.arrays[node.name] || {};
      arr[awkStr(awkEval(node.key, rt))] = value;
    }
    return value;
  }
  function awkEval(n, rt) {
    switch (n.k) {
      case "num": return n.v;
      case "str": return n.v;
      case "re": return new RegExp(ereToJs(n.v)).test(rt.fields[0]) ? 1 : 0;
      case "var": case "field": case "idx": return awkGet(rt, n);
      case "assign":
        var v = awkEval(n.value, rt);
        if (n.op !== "=") {
          var cur = awkNum(awkGet(rt, n.target));
          var by = awkNum(v);
          v = n.op === "+=" ? cur + by : n.op === "-=" ? cur - by : n.op === "*=" ? cur * by : cur / by;
        }
        return awkPut(rt, n.target, v);
      case "pre":
        return awkPut(rt, n.target, awkNum(awkGet(rt, n.target)) + (n.op === "++" ? 1 : -1));
      case "post":
        var old = awkNum(awkGet(rt, n.target));
        awkPut(rt, n.target, old + (n.op === "++" ? 1 : -1));
        return old;
      case "tern": return awkTruth(awkEval(n.c, rt)) ? awkEval(n.a, rt) : awkEval(n.b, rt);
      case "or": return awkTruth(awkEval(n.l, rt)) || awkTruth(awkEval(n.r, rt)) ? 1 : 0;
      case "and": return awkTruth(awkEval(n.l, rt)) && awkTruth(awkEval(n.r, rt)) ? 1 : 0;
      case "not": return awkTruth(awkEval(n.e, rt)) ? 0 : 1;
      case "neg": return -awkNum(awkEval(n.e, rt));
      case "in": return Object.prototype.hasOwnProperty.call(rt.arrays[n.arr] || {}, awkStr(awkEval(n.key, rt))) ? 1 : 0;
      case "match":
        var src = n.r.k === "re" ? n.r.v : awkStr(awkEval(n.r, rt));
        var hit = new RegExp(ereToJs(src)).test(awkStr(awkEval(n.l, rt)));
        return (n.neg ? !hit : hit) ? 1 : 0;
      case "cmp":
        var a = awkEval(n.l, rt), b = awkEval(n.r, rt);
        var numeric = awkLooksNum(a) && awkLooksNum(b);
        var x = numeric ? awkNum(a) : awkStr(a), y = numeric ? awkNum(b) : awkStr(b);
        var res = { "<": x < y, "<=": x <= y, "==": x === y, "!=": x !== y, ">=": x >= y, ">": x > y }[n.op];
        return res ? 1 : 0;
      case "cat": return awkStr(awkEval(n.l, rt)) + awkStr(awkEval(n.r, rt));
      case "bin":
        var l = awkNum(awkEval(n.l, rt)), r = awkNum(awkEval(n.r, rt));
        if ((n.op === "/" || n.op === "%") && r === 0) throw new Error("division by zero");
        return n.op === "+" ? l + r : n.op === "-" ? l - r : n.op === "*" ? l * r : n.op === "/" ? l / r : l % r;
      case "call": return awkCall(n, rt);
    }
    throw new Error("cannot evaluate " + n.k);
  }
  function awkCall(n, rt) {
    var a = n.args.map(function (x) { return x; });
    function arg(i) { return a[i] ? awkEval(a[i], rt) : ""; }
    switch (n.name) {
      case "length": return a.length ? (a[0].k === "var" && rt.arrays[a[0].name] ? Object.keys(rt.arrays[a[0].name]).length : awkStr(arg(0)).length) : rt.fields[0].length;
      case "toupper": return awkStr(arg(0)).toUpperCase();
      case "tolower": return awkStr(arg(0)).toLowerCase();
      case "int": return Math.trunc(awkNum(arg(0)));
      case "substr":
        var s = awkStr(arg(0));
        var start = Math.max(1, Math.round(awkNum(arg(1))));
        return a.length > 2 ? s.substr(start - 1, Math.round(awkNum(arg(2)))) : s.slice(start - 1);
      case "index": return awkStr(arg(0)).indexOf(awkStr(arg(1))) + 1;
      case "split":
        var parts = awkStr(arg(0)).split(a.length > 2 ? awkStr(arg(2)) : /\s+/);
        var arr = rt.arrays[a[1].name] = {};
        parts.forEach(function (part, i) { arr[String(i + 1)] = part; });
        return parts.length;
      case "sub": case "gsub":
        var reSrc = a[0].k === "re" ? a[0].v : awkStr(arg(0));
        var target = a[2] || { k: "field", e: { k: "num", v: 0 } };
        var before = awkStr(awkGet(rt, target));
        var count = 0;
        var rep = awkStr(arg(1));
        var after = before.replace(new RegExp(ereToJs(reSrc), n.name === "gsub" ? "g" : ""), function (m) { count++; return rep.replace(/&/g, m); });
        awkPut(rt, target, after);
        return count;
      case "sprintf": return awkFormat(a.map(function (x) { return awkEval(x, rt); }));
    }
    throw new Error("unknown function " + n.name);
  }
  function awkFormat(vals) {
    var fmt = awkStr(vals[0]);
    var i = 1;
    return fmt.replace(/%([-0]?)(\d*)(?:\.(\d+))?([sdifcx%])/g, function (m, flag, width, prec, conv) {
      if (conv === "%") return "%";
      var v = vals[i++];
      var s;
      if (conv === "d" || conv === "i") s = String(Math.trunc(awkNum(v)));
      else if (conv === "f") s = awkNum(v).toFixed(prec == null ? 6 : Number(prec));
      else if (conv === "x") s = Math.trunc(awkNum(v)).toString(16);
      else if (conv === "c") s = typeof v === "number" ? String.fromCharCode(v) : awkStr(v).charAt(0);
      else { s = awkStr(v); if (prec != null) s = s.slice(0, Number(prec)); }
      var w = Number(width || 0);
      if (s.length < w) s = flag === "-" ? s + " ".repeat(w - s.length) : (flag === "0" && conv !== "s" ? "0" : " ").repeat(w - s.length) + s;
      return s;
    });
  }
  function awkExec(node, rt) {
    if (rt.exit) return;
    switch (node.k) {
      case "block": node.list.forEach(function (s) { awkExec(s, rt); }); return;
      case "print":
        var vals = node.args.length ? node.args.map(function (x) { return awkStr(awkEval(x, rt)); }) : [rt.fields[0]];
        rt.out.push(vals.join(awkStr(rt.vars.OFS)) + "\n");
        return;
      case "printf":
        rt.out.push(awkFormat(node.args.map(function (x) { return awkEval(x, rt); })));
        return;
      case "if":
        if (awkTruth(awkEval(node.cond, rt))) awkExec(node.yes, rt);
        else if (node.no) awkExec(node.no, rt);
        return;
      case "forin":
        Object.keys(rt.arrays[node.arr] || {}).forEach(function (key) {
          rt.vars[node.v] = key;
          awkExec(node.body, rt);
        });
        return;
      case "for":
        if (node.init) awkEval(node.init, rt);
        for (var guard = 0; guard < 1000 && (!node.test || awkTruth(awkEval(node.test, rt))); guard++) {
          awkExec(node.body, rt);
          if (node.step) awkEval(node.step, rt);
        }
        return;
      case "next": throw { awkSkip: true };
      case "exit": rt.exit = true; return;
      case "expr": awkEval(node.e, rt); return;
    }
  }
  function awkRunBlocks(parsed, kind, rt) {
    parsed.forEach(function (blk) { if (blk.kind === kind && !rt.exit) awkExec(blk.body, rt); });
  }
  function cmdSed(state, argv, stdin) {
    var quiet = false, inPlace = false, ere = false;
    var scripts = [];
    var files = [];
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-e") scripts.push(argv[++i] || "");
      else if (/^-[nirE]+$/.test(a) || /^-i\./.test(a)) {
        if (a.indexOf("n") !== -1) quiet = true;
        if (a.indexOf("i") !== -1) inPlace = true;
        if (a.indexOf("E") !== -1 || a.indexOf("r") !== -1) ere = true;
      } else if (!scripts.length && a.charAt(0) !== "-") scripts.push(a);
      else if (a.charAt(0) !== "-") files.push(a);
    }
    var cmds;
    try { cmds = sedParse(scripts.join("\n"), ere); }
    catch (e) { return bad("sed: -e expression #1: " + e.message + ". This lab knows s, p, d, q, a, i, y with line, $, /regex/, and a,b addresses."); }
    if (inPlace) {
      if (!files.length) return bad("sed: no input files");
      for (var f = 0; f < files.length; f++) {
        var path = resolve(state, files[f]);
        var got1 = readPath(state, path);
        if (got1.code) return bad(got1.stderr.trim().replace(/^cat:/, "sed: can't read"));
        var edited = sedRun(cmds, linesOf(got1.stdout), quiet);
        var w = writeFile(state, path, edited, false);
        if (w.code) return w;
      }
      return ok("");
    }
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    return ok(sedRun(cmds, linesOf(got.text), quiet));
  }
  function sedParse(src, ere) {
    var cmds = [];
    var i = 0;
    function toRe(body, flags) {
      return new RegExp(ere ? ereToJs(body) : breToJs(body), flags || "");
    }
    function readDelimited(delim) {
      var s = "";
      while (i < src.length && src.charAt(i) !== delim) {
        if (src.charAt(i) === "\\" && src.charAt(i + 1) === delim) { s += delim; i += 2; continue; }
        if (src.charAt(i) === "\\") { s += src.substr(i, 2); i += 2; continue; }
        s += src.charAt(i++);
      }
      if (src.charAt(i) !== delim) throw new Error("unterminated command");
      i++;
      return s;
    }
    function address() {
      if (/[0-9]/.test(src.charAt(i))) {
        var n = src.slice(i).match(/^[0-9]+/)[0];
        i += n.length;
        return { line: Number(n) };
      }
      if (src.charAt(i) === "$") { i++; return { last: true }; }
      if (src.charAt(i) === "/") { i++; return { re: toRe(readDelimited("/")) }; }
      return null;
    }
    while (i < src.length) {
      while (/[\s;]/.test(src.charAt(i))) i++;
      if (i >= src.length) break;
      var cmd = { a1: address(), a2: null, neg: false };
      if (cmd.a1 && src.charAt(i) === ",") { i++; cmd.a2 = address(); if (!cmd.a2) throw new Error("unexpected ,"); }
      while (src.charAt(i) === " ") i++;
      if (src.charAt(i) === "!") { cmd.neg = true; i++; }
      var c = src.charAt(i++);
      cmd.c = c;
      if (c === "s" || c === "y") {
        var delim = src.charAt(i++);
        var left = readDelimited(delim);
        var right = readDelimited(delim);
        if (c === "y") {
          if (left.length !== right.length) throw new Error("strings for y command are different lengths");
          cmd.from = left; cmd.to = right;
        } else {
          var fl = src.slice(i).match(/^[gpiI0-9]*/)[0];
          i += fl.length;
          cmd.global = fl.indexOf("g") !== -1;
          cmd.print = fl.indexOf("p") !== -1;
          cmd.nth = Number((fl.match(/[0-9]+/) || ["0"])[0]);
          cmd.re = toRe(left, "g" + (/[iI]/.test(fl) ? "i" : ""));
          cmd.rep = right;
        }
      } else if (c === "a" || c === "i" || c === "c") {
        if (src.charAt(i) === "\\") i++;
        var end = src.indexOf("\n", i);
        if (end === -1) end = src.length;
        cmd.text = src.slice(i, end).replace(/^\s+/, "");
        i = end;
      } else if ("pdqP=".indexOf(c) === -1 || !c) throw new Error("unknown command: `" + c + "'");
      cmds.push(cmd);
    }
    return cmds;
  }
  function sedRun(cmds, rows, quiet) {
    var out = [];
    var active = cmds.map(function () { return false; });
    function hit(addr, line, n) {
      if (addr.line != null) return n === addr.line;
      if (addr.last) return n === rows.length;
      addr.re.lastIndex = 0;
      return addr.re.test(line);
    }
    for (var n = 1; n <= rows.length; n++) {
      var space = rows[n - 1];
      var deleted = false;
      var after = [];
      var quit = false;
      for (var k = 0; k < cmds.length && !deleted; k++) {
        var c = cmds[k];
        var yes;
        if (!c.a1) yes = true;
        else if (!c.a2) yes = hit(c.a1, space, n);
        else if (active[k]) {
          yes = true;
          if (c.a2.line != null ? n >= c.a2.line : hit(c.a2, space, n)) active[k] = false;
        } else if (hit(c.a1, space, n)) {
          yes = true;
          active[k] = !(c.a2.line != null && c.a2.line <= n);
        } else yes = false;
        if (c.neg) yes = !yes;
        if (!yes) continue;
        if (c.c === "p") out.push(space);
        else if (c.c === "d") deleted = true;
        else if (c.c === "q") { quit = true; break; }
        else if (c.c === "=") out.push(String(n));
        else if (c.c === "a") after.push(c.text);
        else if (c.c === "i") out.push(c.text);
        else if (c.c === "c") { out.push(c.text); deleted = true; }
        else if (c.c === "y") {
          space = space.split("").map(function (ch) { var at = c.from.indexOf(ch); return at === -1 ? ch : c.to.charAt(at); }).join("");
        } else if (c.c === "s") {
          var count = 0;
          var changed = false;
          var rep = c.rep;
          c.re.lastIndex = 0;
          space = space.replace(c.re, function () {
            var args = arguments;
            var m = args[0];
            count++;
            if (c.nth ? count !== c.nth : (!c.global && count > 1)) return m;
            changed = true;
            return rep.replace(/\\(\d)|&|\\n|\\&/g, function (tok, d) {
              if (tok === "&") return m;
              if (tok === "\\&") return "&";
              if (tok === "\\n") return "\n";
              return args[Number(d)] == null ? "" : args[Number(d)];
            });
          });
          if (changed && c.print) out.push(space);
        }
      }
      if (!deleted && !quiet) out.push(space);
      out = out.concat(after);
      if (quit) break;
    }
    return asText(out);
  }
  function cmdFind(state, argv) {
    var start = ".";
    var tests = [];
    var maxdepth = Infinity, mindepth = 0;
    var action = null;
    var args = argv.slice();
    if (args[0] && args[0].charAt(0) !== "-") start = args.shift();
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      var v = args[i + 1];
      if (a === "-name" || a === "-iname") {
        var re = globToReg(v);
        var reI = new RegExp(re.source, a === "-iname" ? "i" : "");
        tests.push(function (n, p) { return reI.test(base(p)); });
        i++;
      } else if (a === "-type") {
        var want = { f: "file", d: "dir", l: "link" }[v];
        if (!want) return bad("find: Unknown argument to -type: " + v);
        tests.push(function (n) { return n.kind === want || (want === "file" && n.kind === "archive"); });
        i++;
      } else if (a === "-maxdepth") { maxdepth = Number(v); i++; }
      else if (a === "-mindepth") { mindepth = Number(v); i++; }
      else if (a === "-size") {
        var sm = String(v).match(/^([+-]?)(\d+)([ckMG]?)$/);
        if (!sm) return bad("find: invalid -size " + v);
        var unit = { c: 1, k: 1024, M: 1048576, G: 1073741824, "": 512 }[sm[3]];
        var limit = Number(sm[2]);
        tests.push(function (n) {
          if (n.kind === "dir") return false;
          var units = Math.ceil(sizeOf(n) / unit);
          return sm[1] === "+" ? units > limit : sm[1] === "-" ? units < limit : units === limit;
        });
        i++;
      } else if (a === "-empty") tests.push(function (n, p) { return n.kind === "dir" ? children(state, p).length === 0 : sizeOf(n) === 0; });
      else if (a === "-user") { var who = v; tests.push(function (n) { return n.owner === who; }); i++; }
      else if (a === "-group") { var grp = v; tests.push(function (n) { return n.group === grp; }); i++; }
      else if (a === "-perm") {
        var pm = String(v).match(/^([-\/]?)([0-7]+)$/);
        if (!pm) return bad("find: this lab reads -perm 644, -perm -4000, or -perm /6000");
        var bits = parseInt(pm[2], 8);
        tests.push(function (n) {
          var m = n.mode & 4095;
          return pm[1] === "-" ? (m & bits) === bits : pm[1] === "/" ? (m & bits) !== 0 : m === bits;
        });
        i++;
      } else if (a === "-newer") {
        var ref = state.files[resolve(state, v)];
        if (!ref) return bad("find: '" + v + "': No such file or directory");
        tests.push(function (n) { return (n.mtime || "") > (ref.mtime || ""); });
        i++;
      } else if (a === "-mtime" || a === "-mmin") {
        var recent = /^-/.test(v);
        tests.push(function (n) { return recent ? n.mtime === CLOCK : n.mtime !== CLOCK; });
        i++;
      } else if (a === "-print") { }
      else if (a === "-delete") action = { kind: "delete" };
      else if (a === "-exec") {
        var parts = [];
        i++;
        while (i < args.length && args[i] !== ";" && args[i] !== "+") parts.push(args[i++]);
        if (i >= args.length) return bad("find: missing argument to `-exec'. End it with \\; or +");
        action = { kind: "exec", parts: parts, batch: args[i] === "+" };
      } else return bad("find: unknown predicate `" + a + "'. This lab knows -name -iname -type -maxdepth -size -empty -user -perm -newer -mtime -exec -delete");
    }
    var root = resolve(state, start);
    if (!state.files[root]) return bad("find: '" + start + "': No such file or directory");
    var hits = [];
    var denied = [];
    function labelOf(path) {
      if (path === root) return start;
      var rel = path.slice(root === "/" ? 1 : root.length + 1);
      return start.replace(/\/$/, "") + "/" + rel;
    }
    function visit(path, depth) {
      var node = state.files[path];
      if (!node) return;
      if (depth >= mindepth && tests.every(function (t) { return t(node, path); })) hits.push({ path: path, label: labelOf(path) });
      if (node.kind === "dir" && depth < maxdepth) {
        if (!allows(node, state, 4) || !allows(node, state, 1)) { denied.push("find: '" + labelOf(path) + "': Permission denied"); return; }
        children(state, path).sort(function (x, y) { return x.name < y.name ? -1 : 1; }).forEach(function (ch) { visit(ch.path, depth + 1); });
      }
    }
    visit(root, 0);
    var err = denied.length ? denied.join("\n") + "\n" : "";
    if (!action) return { stdout: asText(hits.map(function (h) { return h.label; })), stderr: err, code: err ? 1 : 0, clear: false };
    if (action.kind === "delete") {
      hits.slice().reverse().forEach(function (h) { removePath(state, h.path, true, true); });
      return { stdout: "", stderr: err, code: 0, clear: false };
    }
    var outText = "", errText = err;
    function quoteArg(s) { return /[\s'"$]/.test(s) ? "'" + s.replace(/'/g, "'\\''") + "'" : s; }
    function runParts(names) {
      var words = [];
      action.parts.forEach(function (p) {
        if (p === "{}") words = words.concat(names);
        else words.push(p.split("{}").join(names[0]));
      });
      var res = runLine(state, words.map(quoteArg).join(" "));
      outText += res.stdout || "";
      errText += res.stderr || "";
    }
    if (action.batch) { if (hits.length) runParts(hits.map(function (h) { return h.label; })); }
    else hits.forEach(function (h) { runParts([h.label]); });
    return { stdout: outText, stderr: errText, code: 0, clear: false };
  }
  function cmdMkdir(state, argv) {
    var parents = argv.indexOf("-p") !== -1;
    var paths = argv.filter(function (a) { return a !== "-p"; });
    if (!paths.length) return bad("mkdir: missing operand");
    for (var i = 0; i < paths.length; i++) {
      var path = resolve(state, paths[i]);
      if (parents) {
        var parts = path.split("/").filter(Boolean);
        var cur = "";
        for (var k = 0; k < parts.length; k++) {
          cur += "/" + parts[k];
          if (!state.files[cur]) {
            var made = ensureDir(state, cur);
            if (made.code) return made;
          }
        }
      } else {
        var made2 = ensureDir(state, path);
        if (made2.code) return made2;
      }
    }
    return ok("");
  }
  function cmdTouch(state, argv) {
    if (!argv.length) return bad("touch: missing file");
    for (var i = 0; i < argv.length; i++) {
      var path = resolve(state, argv[i]);
      if (!state.files[path]) {
        var made = writeFile(state, path, "", false);
        if (made.code) return made;
      } else touchTimes(state.files[path], ["atime", "mtime", "ctime"]);
    }
    return ok("");
  }
  function cmdLn(state, argv) {
    var symbolic = argv[0] === "-s";
    var args = symbolic ? argv.slice(1) : argv;
    if (args.length < 2) return bad("ln: missing target or new name");
    var target = args[0];
    var dest = resolve(state, args[1]);
    if (state.files[dest] && state.files[dest].kind === "dir") dest = join(dest, base(target));
    var folder = state.files[parent(dest)];
    if (!folder || folder.kind !== "dir") return bad("ln: cannot create link: No such file or directory");
    if (state.files[dest]) return bad("ln: failed to create link '" + args[1] + "': File exists");
    if (!symbolic) {
      var src = state.files[resolve(state, target)];
      if (!src) return bad("ln: failed to access '" + target + "': No such file or directory");
      if (src.kind === "dir") return bad("ln: " + target + ": hard link not allowed for directory");
      state.files[dest] = src;
      touchTimes(src, ["ctime"]);
      return ok("");
    }
    state.files[dest] = { kind: "link", mode: 511, owner: state.user, group: state.group, target: target, text: "" };
    return ok("");
  }
  function applyChmod(mode, spec) {
    if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
    var m = mode;
    var parts = spec.split(",");
    for (var i = 0; i < parts.length; i++) {
      var match = parts[i].match(/^([ugoa]*)([+-=])([rwxst]+)$/);
      if (!match) return null;
      var who = match[1] || "a";
      var op = match[2];
      var perm = match[3];
      var extra = 0;
      if (perm.indexOf("s") !== -1) {
        if (who.indexOf("u") !== -1 || who === "a") extra |= 2048;
        if (who.indexOf("g") !== -1 || who === "a") extra |= 1024;
      }
      if (perm.indexOf("t") !== -1) extra |= 512;
      if (op === "+") m |= extra;
      else if (op === "-") m &= ~extra;
      var bit = 0;
      if (perm.indexOf("r") !== -1) bit |= 4;
      if (perm.indexOf("w") !== -1) bit |= 2;
      if (perm.indexOf("x") !== -1) bit |= 1;
      var shifts = [];
      if (who.indexOf("a") !== -1 || who === "a") shifts = [6, 3, 0];
      else {
        if (who.indexOf("u") !== -1) shifts.push(6);
        if (who.indexOf("g") !== -1) shifts.push(3);
        if (who.indexOf("o") !== -1) shifts.push(0);
      }
      shifts.forEach(function (shift) {
        var mask = 7 << shift;
        var add = bit << shift;
        if (op === "+") m |= add;
        else if (op === "-") m &= ~add;
        else m = (m & ~mask) | add;
      });
    }
    return m;
  }
  function cmdChmod(state, argv) {
    if (argv.length < 2) return bad("chmod: missing mode or file");
    var spec = argv[0];
    for (var i = 1; i < argv.length; i++) {
      var path = resolve(state, argv[i]);
      var node = state.files[path];
      if (!node) return bad("chmod: cannot access '" + argv[i] + "': No such file or directory");
      if (node.owner !== state.user) return bad("chmod: changing permissions of '" + argv[i] + "': Operation not permitted");
      var next = applyChmod(node.mode, spec);
      if (next == null) return bad("chmod: this lab accepts 644, 755, 4755, and symbols such as u+x, g+s, +t");
      node.mode = next;
      touchTimes(node, ["ctime"]);
    }
    return ok("");
  }
  function cmdChown(state, argv) {
    if (argv.length < 2) return bad("chown: missing owner or file");
    var spec = argv[0];
    var user = spec.split(":")[0];
    var group = spec.indexOf(":") === -1 ? null : spec.split(":")[1];
    if (user !== state.user) {
      return bad("chown: changing owner of '" + argv[1] + "': Operation not permitted\nOn a real host, only root can give a file to someone else. You are ana.");
    }
    for (var i = 1; i < argv.length; i++) {
      var node = state.files[resolve(state, argv[i])];
      if (!node) return bad("chown: cannot access '" + argv[i] + "': No such file or directory");
      node.owner = user;
      if (group) node.group = group;
    }
    return ok("");
  }
  function cmdChgrp(state, argv) {
    if (argv.length < 2) return bad("chgrp: missing group or file");
    var group = argv[0];
    var isRoot = state.user === "root";
    var known = (state.files["/etc/group"] ? linesOf(state.files["/etc/group"].text) : []).some(function (l) { return l.split(":")[0] === group; });
    if (!known && state.groups.indexOf(group) === -1) return bad("chgrp: invalid group: '" + group + "'");
    if (!isRoot && state.groups.indexOf(group) === -1) return bad("chgrp: changing group of '" + argv[1] + "': Operation not permitted");
    for (var i = 1; i < argv.length; i++) {
      var node = state.files[resolve(state, argv[i])];
      if (!node) return bad("chgrp: cannot access '" + argv[i] + "': No such file or directory");
      if (!isRoot && node.owner !== state.user) return bad("chgrp: changing group of '" + argv[i] + "': Operation not permitted");
      node.group = group;
    }
    return ok("");
  }
  function cmdDu(state, argv) {
    var summary = argv.indexOf("-s") !== -1 || argv.indexOf("-sh") !== -1 || argv.some(function (a) { return a.charAt(0) === "-" && a.indexOf("s") !== -1; });
    var paths = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (!paths.length) paths = ["."];
    var rows = paths.map(function (p) {
      var path = resolve(state, p);
      if (!state.files[path]) return "du: cannot access '" + p + "'";
      return human(bytesOf(state, path)).padStart(6, " ") + "  " + p;
    });
    return ok(rows.join("\n") + "\n");
  }
  function cmdFree() {
    return ok("              total        used        free\nMem:          3.8Gi       1.2Gi       2.1Gi\nSwap:         2.0Gi          0B       2.0Gi\n");
  }
  function cmdUptime() {
    return ok(" 09:04:01 up 3 days,  4:12,  1 user,  load average: 0.15, 0.10, 0.08\n");
  }
  function cmdPing(argv) {
    var count = 3;
    var host = "";
    for (var i = 0; i < argv.length; i++) {
      if (argv[i] === "-c") count = Number(argv[++i]);
      else if (argv[i].charAt(0) !== "-") host = argv[i];
    }
    if (!host) return bad("ping: missing host");
    if (count > 5) count = 5;
    var live = host === "lab" || host === "localhost" || host === "127.0.0.1";
    var lines = ["PING " + host + " (" + (live ? "127.0.0.1" : "192.0.2.10") + ") 56(84) bytes of data."];
    for (var n = 1; n <= count; n++) {
      lines.push(live ? "64 bytes from " + host + ": icmp_seq=" + n + " ttl=64 time=0.40 ms" : "no reply");
    }
    lines.push("--- " + host + " ping statistics ---");
    lines.push(count + " packets transmitted, " + (live ? count : 0) + " received, " + (live ? "0%" : "100%") + " packet loss");
    if (argv.indexOf("-c") === -1) lines.push("The lab stops after 3 replies. A real ping continues until you press Ctrl+C.");
    return ok(lines.join("\n") + "\n", live ? 0 : 1);
  }
  function cmdCurl(argv) {
    var headOnly = argv.indexOf("-I") !== -1 || argv.indexOf("-i") !== -1;
    var url = argv.filter(function (a) { return a.charAt(0) !== "-"; }).pop();
    if (!url) return bad("curl: no URL");
    var known = /lab:8080|example\.com/.test(url);
    if (!known) return bad("curl: (6) Could not resolve host");
    var headers = "HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: 12\n";
    if (headOnly) return ok(headers);
    return ok(headers + "\napp started\n");
  }
  function cmdWget(state, argv) {
    var outName = "";
    var url = "";
    for (var i = 0; i < argv.length; i++) {
      if (argv[i] === "-O") outName = argv[++i];
      else if (argv[i].charAt(0) !== "-") url = argv[i];
    }
    if (!url) return bad("wget: missing URL");
    if (!/lab:8080|example\.com/.test(url)) return bad("wget: unable to resolve host address");
    var body = "app started\n";
    var name = outName || "index.html";
    var written = writeFile(state, resolve(state, name), body, false);
    if (written.code) return written;
    return ok("saved " + body.length + " bytes as " + name + "\n");
  }
  function cmdSsh(argv) {
    if (!argv.length) return bad("usage: ssh user@host");
    var target = argv[argv.length - 1];
    return ok("The lab does not open a network connection.\nOn a real host this starts a shell on " + target + ".\nYou are still ana@lab.\n");
  }
  function splitRemote(spec) {
    var m = String(spec).match(/^([^@:\s]+)@([^:]+):(.*)$/);
    if (!m) return null;
    return { user: m[1], host: m[2], path: m[3] };
  }
  function cmdScp(state, argv) {
    var args = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (args.length < 2) return bad("usage: scp source user@host:path");
    var src = args[0], dest = args[1];
    var srcR = splitRemote(src), destR = splitRemote(dest);
    if (!srcR && !destR) return copyNode(state, resolve(state, src), resolve(state, dest));
    if (destR) {
      var from = resolve(state, src);
      var got = readPath(state, from);
      if (got.code && state.files[from] && state.files[from].kind === "dir") return bad("scp: this lab copies a file. Copy notes.txt, or use rsync for a folder.");
      if (got.code) return got;
      state.remote[destR.host] = state.remote[destR.host] || {};
      var remotePath = destR.path.charAt(destR.path.length - 1) === "/" ? destR.path + base(from) : (destR.path || base(from));
      state.remote[destR.host][remotePath] = got.stdout;
      return ok("copied " + base(from) + " to " + destR.user + "@" + destR.host + ":" + remotePath + "\n");
    }
    var bag = (state.remote[srcR.host] || {})[srcR.path];
    if (bag == null) return bad("scp: " + src + ": No such file or directory");
    var local = resolve(state, dest);
    if (state.files[local] && state.files[local].kind === "dir") local = join(local, base(srcR.path));
    return writeFile(state, local, bag, false).code === 0 ? ok("copied " + src + " to " + dest + "\n") : writeFile(state, local, bag, false);
  }
  function cmdRsync(state, argv) {
    var verbose = argv.some(function (a) { return a.charAt(0) === "-" && a.indexOf("v") !== -1; });
    var args = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (args.length < 2) return bad("usage: rsync -av source dest");
    var src = args[0], dest = args[1];
    var destR = splitRemote(dest);
    var from = resolve(state, src);
    if (!state.files[from]) return bad("rsync: change_dir \"" + src + "\" failed: No such file or directory");
    var names = [];
    if (state.files[from].kind === "dir") {
      children(state, from).forEach(function (ch) { if (ch.node.kind === "file") names.push(ch); });
    } else names.push({ name: base(from), path: from, node: state.files[from] });
    var lines = [];
    names.forEach(function (ch) {
      var body = ch.node.text;
      if (destR) {
        state.remote[destR.host] = state.remote[destR.host] || {};
        var remotePath = (destR.path.replace(/\/$/, "") || ".") + "/" + ch.name;
        state.remote[destR.host][remotePath] = body;
      } else {
        var folder = resolve(state, dest);
        if (!state.files[folder] || state.files[folder].kind !== "dir") {
          writeFile(state, folder, body, false);
        } else writeFile(state, join(folder, ch.name), body, false);
      }
      if (verbose) lines.push(ch.name);
    });
    if (!verbose) return ok("");
    return ok(lines.join("\n") + "\n");
  }
  function cmdZip(state, argv) {
    var args = argv.filter(function (a) { return a !== "-r" && a !== "-q"; });
    if (args.length < 2) return bad("usage: zip archive.zip files");
    var archive = resolve(state, args[0]);
    var members = [];
    for (var i = 1; i < args.length; i++) {
      var path = resolve(state, args[i]);
      var node = state.files[path];
      if (!node) return bad("zip: cannot find " + args[i]);
      if (node.kind === "dir") {
        children(state, path).forEach(function (ch) {
          if (ch.node.kind === "file") members.push({ name: args[i].replace(/\/$/, "") + "/" + ch.name, text: ch.node.text });
        });
      } else if (node.kind === "file") members.push({ name: args[i], text: node.text });
    }
    state.files[archive] = { kind: "archive", format: "zip", mode: 420, owner: state.user, group: state.group, members: members, text: "" };
    return ok("adding " + members.length + " file" + (members.length === 1 ? "" : "s") + " to " + args[0] + "\n");
  }
  function cmdUnzip(state, argv) {
    var list = argv.indexOf("-l") !== -1;
    var name = argv.filter(function (a) { return a.charAt(0) !== "-"; })[0];
    if (!name) return bad("usage: unzip archive.zip");
    var node = state.files[resolve(state, name)];
    if (!node || node.kind !== "archive") return bad("unzip: cannot find or open " + name);
    if (list) {
      var rows = node.members.map(function (m) { return m.text.length + "  " + m.name; });
      return ok(asText(rows));
    }
    node.members.forEach(function (m) {
      var dest = resolve(state, m.name);
      var folder = parent(dest);
      if (!state.files[folder]) ensureDir(state, folder);
      writeFile(state, dest, m.text, false);
    });
    return ok("extracted " + node.members.length + " file" + (node.members.length === 1 ? "" : "s") + "\n");
  }
  function cmdAlias(state, argv) {
    if (!argv.length) {
      var rows = Object.keys(state.aliases).sort().map(function (name) { return "alias " + name + "='" + state.aliases[name] + "'"; });
      return ok(asText(rows));
    }
    var spec = argv.join(" ");
    var eq = spec.indexOf("=");
    if (eq === -1) {
      if (!state.aliases[spec]) return bad("bash: alias: " + spec + ": not found");
      return ok("alias " + spec + "='" + state.aliases[spec] + "'\n");
    }
    state.aliases[spec.slice(0, eq)] = spec.slice(eq + 1);
    return ok("");
  }
  function cmdExport(state, argv) {
    state.exported = state.exported || {};
    var unexport = argv[0] === "-n";
    var names = argv.filter(function (a) { return a !== "-n" && a !== "-p"; });
    if (!names.length) {
      var rows = Object.keys(state.env).filter(function (k) { return state.exported[k]; }).sort().map(function (k) { return "declare -x " + k + "=\"" + state.env[k] + "\""; });
      return ok(asText(rows));
    }
    names.forEach(function (spec) {
      var eq = spec.indexOf("=");
      var name = eq === -1 ? spec : spec.slice(0, eq);
      if (eq !== -1) state.env[name] = spec.slice(eq + 1);
      if (unexport) delete state.exported[name];
      else state.exported[name] = true;
    });
    return ok("");
  }
  function cmdSet(state, argv) {
    if (!argv.length) {
      var rows = Object.keys(state.env).sort().map(function (k) { return k + "=" + state.env[k]; });
      return ok(asText(rows));
    }
    var joined = argv.join(" ");
    var letters = argv.filter(function (a) { return a.charAt(0) === "-"; }).join("");
    if (letters.indexOf("e") !== -1) state.errexit = true;
    if (letters.indexOf("u") !== -1) state.nounset = true;
    if (joined.indexOf("pipefail") !== -1) state.pipefail = true;
    return ok("");
  }
  function cmdUnset(state, argv) {
    argv.forEach(function (name) {
      delete state.env[name];
      delete state.arrays[name];
    });
    return ok("");
  }
  function cmdTest(argv, close) {
    var a = argv.slice();
    if (a.length && a[a.length - 1] === close) a.pop();
    else return bad("test: missing " + close);
    function code(yes) { return ok("", yes ? 0 : 1); }
    if (a.length === 2 && a[0] === "-f") return code(!!(stateFile(a[1]) && stateFile(a[1]).kind === "file"));
    if (a.length === 2 && a[0] === "-d") return code(!!(stateFile(a[1]) && stateFile(a[1]).kind === "dir"));
    if (a.length === 2 && a[0] === "-z") return code(a[1] === "");
    if (a.length === 2 && a[0] === "-n") return code(a[1] !== "");
    if (a.length === 3) {
      var l = a[0], op = a[1], r = a[2];
      if (op === "=" || op === "==") return code(l === r);
      if (op === "!=") return code(l !== r);
      var ln = Number(l), rn = Number(r);
      if ("-eq -ne -lt -le -gt -ge".split(" ").indexOf(op) !== -1) {
        if (!/^-?[0-9]+$/.test(l) || !/^-?[0-9]+$/.test(r)) return bad("test: integer expected");
        var map = { "-eq": ln === rn, "-ne": ln !== rn, "-lt": ln < rn, "-le": ln <= rn, "-gt": ln > rn, "-ge": ln >= rn };
        return code(map[op]);
      }
    }
    return bad("test: this lab supports = != -eq -ne -lt -le -gt -ge -f -d -z -n");
    function stateFile(p) { return null; }
  }

  function cmdMan(argv) {
    var name = argv.filter(function (a) { return a.charAt(0) !== "-"; })[0];
    if (!name) return bad("What manual page do you want?");
    if (!MAN[name] && !COMMANDS[name] && !BUILTIN[name]) return bad("No manual entry for " + name);
    if (MAN[name]) return ok(MAN[name] + "\n");
    return ok(name + " — practice command in this lab. Type help to see every command the lab runs.\n");
  }
  function cmdHelp() {
    var groups = [
      ["Files", "pwd cd ls cat less head tail touch mkdir cp mv rm ln stat find tree"],
      ["Text", "echo printf grep cut sort uniq wc tr awk sed tee xargs"],
      ["Archives", "tar gzip gunzip zcat bzip2 xz zip unzip 7z rsync"],
      ["Users", "whoami id groups getent sudo useradd adduser usermod userdel groupadd gpasswd passwd chage visudo"],
      ["Permissions", "chmod chown chgrp umask getfacl setfacl lsattr chattr"],
      ["Processes", "ps top nice renice kill jobs fg bg sleep screen tmux free uptime"],
      ["Time", "date timedatectl crontab at atq atrm systemctl systemd-analyze journalctl anacron"],
      ["Disks", "df du lsblk blkid mount umount findmnt fdisk parted mkfs.ext4 e2label dd smartctl"],
      ["LVM", "pvcreate vgcreate lvcreate lvextend lvremove pvs vgs lvs lvconvert"],
      ["ZFS and LUKS", "zpool zfs cryptsetup"],
      ["Shell", "alias unalias export env printenv set unset source type command which history shopt bash"]
    ];
    return ok(groups.map(function (g) { return (g[0] + ":").padEnd(13) + g[1]; }).join("\n") + "\nBuiltins live inside bash, so they work even when PATH is broken: cd echo pwd alias export set unset history type source read jobs fg bg kill command\nTab completes names. Up and Down walk your history. Ctrl+L clears the screen.\n");
  }
  function cmdType(state, argv) {
    var flags = argv.filter(function (a) { return a.charAt(0) === "-"; }).join("");
    var names = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (!names.length) return bad("type: missing name");
    var out = [];
    var missing = false;
    names.forEach(function (n) {
      var hits = [];
      if (state.aliases[n]) hits.push(["alias", n + " is aliased to `" + state.aliases[n] + "'"]);
      if (state.fns[n]) hits.push(["function", n + " is a function"]);
      if (BUILTIN[n]) hits.push(["builtin", n + " is a shell builtin"]);
      if (COMMANDS[n] && (!BUILTIN[n] || ON_DISK_TOO[n]) && String(state.env.PATH || "").split(":").indexOf("/usr/bin") !== -1) hits.push(["file", n + " is /usr/bin/" + n]);
      if (!hits.length) { missing = true; if (flags.indexOf("t") === -1) out.push("bash: type: " + n + ": not found"); return; }
      (flags.indexOf("a") !== -1 ? hits : hits.slice(0, 1)).forEach(function (h) { out.push(flags.indexOf("t") !== -1 ? h[0] : h[1]); });
    });
    return missing && !out.length ? bad("bash: type: " + names[0] + ": not found") : ok(asText(out), missing ? 1 : 0);
  }
  function cmdBash(state, argv) {
    if (argv[0] === "-c") return inChild(state, function () { return runScript(state, argv[1] || ""); });
    if (!argv[0]) return bad("bash: this lab has no second interactive shell. Pass a script file, or use the script box.");
    var path = resolve(state, argv[0]);
    var got = readPath(state, path);
    if (got.code) return got;
    var node = state.files[path];
    if (node && node.kind === "file" && ((node.mode & 64) === 0) && argv[0].charAt(0) !== "-") {
      /* bash file still runs a readable script even without +x. ./file would not. */
    }
    var rest = argv.slice(1);
    return inChild(state, function () {
      var prev = state.pos;
      state.pos = rest;
      var res = runScript(state, got.stdout);
      state.pos = prev;
      return res;
    });
  }

  var UIDS = { root: 0, daemon: 1, sshd: 110, ana: 1000, ken: 1001, mina: 1002 };
  function dbRows(state, path) {
    var node = state.files[path];
    return node ? linesOf(node.text).map(function (l) { return l.split(":"); }) : [];
  }
  function dbSave(state, path, rows) {
    state.files[path].text = rows.map(function (r) { return r.join(":"); }).join("\n") + "\n";
    touchTimes(state.files[path], ["mtime", "ctime"]);
  }
  function userRow(state, name) {
    return dbRows(state, "/etc/passwd").filter(function (r) { return r[0] === name; })[0] || null;
  }
  function uidOf(state, name) { var r = userRow(state, name); return r ? r[2] : (UIDS[name] != null ? String(UIDS[name]) : "1000"); }
  function gidOf(state, name) {
    var r = dbRows(state, "/etc/group").filter(function (g) { return g[0] === name; })[0];
    return r ? r[2] : "0";
  }
  function groupsOf(state, name) {
    var row = userRow(state, name);
    if (!row) return null;
    var primary = dbRows(state, "/etc/group").filter(function (g) { return g[2] === row[3]; })[0];
    var list = primary ? [primary[0]] : [];
    dbRows(state, "/etc/group").forEach(function (g) {
      if ((g[3] || "").split(",").indexOf(name) !== -1 && list.indexOf(g[0]) === -1) list.push(g[0]);
    });
    return list;
  }
  function needRoot(state, name, argv, why) {
    if (state.user === "root") return null;
    return bad(name + ": " + (why || "Permission denied") + "\nlab: this needs root. Try: sudo " + [name].concat(argv).join(" "));
  }
  function stamp(t) { return (t || "2026-11-02 09:00:00") + ".000000000 +0000"; }

  function cmdStat(state, argv) {
    var fmt = null;
    var names = [];
    for (var i = 0; i < argv.length; i++) {
      if (argv[i] === "-c" || argv[i] === "--format") fmt = argv[++i];
      else if (argv[i].indexOf("--format=") === 0) fmt = argv[i].slice(9);
      else if (argv[i] === "-L") continue;
      else names.push(argv[i]);
    }
    if (!names.length) return bad("stat: missing operand");
    var out = [];
    for (var n = 0; n < names.length; n++) {
      var path = resolve(state, names[n]);
      var node = state.files[path];
      if (!node) return bad("stat: cannot statx '" + names[n] + "': No such file or directory");
      var kind = node.kind === "dir" ? "directory" : node.kind === "link" ? "symbolic link" : sizeOf(node) === 0 ? "regular empty file" : "regular file";
      var octal = (node.mode & 4095).toString(8).padStart(4, "0");
      var uid = uidOf(state, node.owner), gid = gidOf(state, node.group);
      if (fmt) {
        out.push(fmt.replace(/%([aAUGsnihFyxzwu])/g, function (m, c) {
          return { a: (node.mode & 4095).toString(8), A: modeStr(node), U: node.owner, G: node.group, s: String(sizeOf(node)), n: names[n], i: String(inodeOf(state, node)), h: String(linkCount(state, node)), F: kind, y: stamp(node.mtime), x: stamp(node.atime), z: stamp(node.ctime), w: stamp(node.btime), u: uid }[c];
        }));
        continue;
      }
      var shown = node.kind === "link" ? names[n] + " -> " + node.target : names[n];
      out.push("  File: " + shown);
      out.push("  Size: " + String(sizeOf(node)).padEnd(10) + "\tBlocks: " + String(node.kind === "dir" ? 8 : Math.ceil(sizeOf(node) / 4096) * 8).padEnd(10) + " IO Block: 4096   " + kind);
      out.push("Device: 8,2\tInode: " + String(inodeOf(state, node)).padEnd(11) + " Links: " + linkCount(state, node));
      out.push("Access: (" + octal + "/" + modeStr(node).slice(0, 10) + ")  Uid: (" + String(uid).padStart(5) + "/" + node.owner.padStart(8) + ")   Gid: (" + String(gid).padStart(5) + "/" + node.group.padStart(8) + ")");
      out.push("Access: " + stamp(node.atime));
      out.push("Modify: " + stamp(node.mtime));
      out.push("Change: " + stamp(node.ctime));
      out.push(" Birth: " + stamp(node.btime));
    }
    return ok(asText(out));
  }

  function aclMask(node) {
    var bits = (node.mode >> 3) & 7;
    (node.acl || []).filter(function (e) { return !e.def; }).forEach(function (e) {
      bits |= (e.perms.indexOf("r") !== -1 ? 4 : 0) | (e.perms.indexOf("w") !== -1 ? 2 : 0) | (e.perms.indexOf("x") !== -1 ? 1 : 0);
    });
    return bits;
  }
  function rwx(bits) { return (bits & 4 ? "r" : "-") + (bits & 2 ? "w" : "-") + (bits & 1 ? "x" : "-"); }
  function cmdGetfacl(state, argv) {
    var names = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (!names.length) return bad("getfacl: missing file name");
    var blocks = [];
    for (var i = 0; i < names.length; i++) {
      var node = state.files[resolve(state, names[i])];
      if (!node) return bad("getfacl: " + names[i] + ": No such file or directory");
      var rows = ["# file: " + names[i].replace(/^\//, ""), "# owner: " + node.owner, "# group: " + node.group];
      var flags = (node.mode & 2048 ? "s" : "-") + (node.mode & 1024 ? "s" : "-") + (node.mode & 512 ? "t" : "-");
      if (flags !== "---") rows.push("# flags: " + flags);
      var access = (node.acl || []).filter(function (e) { return !e.def; });
      var defs = (node.acl || []).filter(function (e) { return e.def; });
      rows.push("user::" + rwx((node.mode >> 6) & 7));
      access.filter(function (e) { return e.type === "user"; }).forEach(function (e) { rows.push("user:" + e.name + ":" + e.perms); });
      rows.push("group::" + rwx(access.length ? (node.groupBits != null ? node.groupBits : (node.mode >> 3) & 7) : (node.mode >> 3) & 7));
      access.filter(function (e) { return e.type === "group"; }).forEach(function (e) { rows.push("group:" + e.name + ":" + e.perms); });
      if (access.length) rows.push("mask::" + rwx((node.mode >> 3) & 7));
      rows.push("other::" + rwx(node.mode & 7));
      if (defs.length) {
        rows.push("default:user::" + rwx((node.mode >> 6) & 7));
        defs.filter(function (e) { return e.type === "user"; }).forEach(function (e) { rows.push("default:user:" + e.name + ":" + e.perms); });
        rows.push("default:group::" + rwx(node.groupBits != null ? node.groupBits : (node.mode >> 3) & 7));
        defs.filter(function (e) { return e.type === "group"; }).forEach(function (e) { rows.push("default:group:" + e.name + ":" + e.perms); });
        rows.push("default:mask::" + rwx((node.mode >> 3) & 7));
        rows.push("default:other::" + rwx(node.mode & 7));
      }
      blocks.push(rows.join("\n") + "\n");
    }
    return ok(blocks.join("\n"));
  }
  function cmdSetfacl(state, argv) {
    var ops = [];
    var names = [];
    var recursive = false;
    var dflt = false;
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-m" || a === "--modify") ops.push({ op: "m", spec: argv[++i] });
      else if (a === "-x" || a === "--remove") ops.push({ op: "x", spec: argv[++i] });
      else if (a === "-b" || a === "--remove-all") ops.push({ op: "b" });
      else if (a === "-k") ops.push({ op: "k" });
      else if (a === "-d" || a === "--default") dflt = true;
      else if (a === "-R") recursive = true;
      else if (a === "-dm") { dflt = true; ops.push({ op: "m", spec: argv[++i] }); }
      else names.push(a);
    }
    if (!ops.length || !names.length) return bad("Usage: setfacl -m u:ken:rw file   (also -x u:ken, -b, -d -m for a folder default)");
    for (var n = 0; n < names.length; n++) {
      var path = resolve(state, names[n]);
      var targets = [path];
      if (recursive) Object.keys(state.files).forEach(function (k) { if (k.indexOf(path + "/") === 0) targets.push(k); });
      for (var t = 0; t < targets.length; t++) {
        var node = state.files[targets[t]];
        if (!node) return bad("setfacl: " + names[n] + ": No such file or directory");
        if (node.owner !== state.user && state.user !== "root") return bad("setfacl: " + names[n] + ": Operation not permitted");
        for (var o = 0; o < ops.length; o++) {
          var op = ops[o];
          if (op.op === "b") { node.acl = []; if (node.groupBits != null) { node.mode = (node.mode & ~56) | (node.groupBits << 3); node.groupBits = null; } continue; }
          if (op.op === "k") { node.acl = (node.acl || []).filter(function (e) { return !e.def; }); continue; }
          var specs = String(op.spec || "").split(",");
          for (var s = 0; s < specs.length; s++) {
            var parts = specs[s].split(":");
            var isDef = dflt;
            if (parts[0] === "d" || parts[0] === "default") { isDef = true; parts.shift(); }
            var type = { u: "user", user: "user", g: "group", group: "group", o: "other", other: "other", m: "mask", mask: "mask" }[parts[0]];
            if (!type) return bad("setfacl: Option -" + op.op + ": Invalid argument near character 1");
            var who = parts[1] || "";
            var perms = parts[2] || "";
            if (isDef && node.kind !== "dir") return bad("setfacl: " + names[n] + ": Only directories can have default ACLs");
            node.acl = node.acl || [];
            if (op.op === "x") {
              node.acl = node.acl.filter(function (e) { return !(e.type === type && e.name === who && !!e.def === isDef); });
              continue;
            }
            var p = (perms.indexOf("r") !== -1 ? "r" : "-") + (perms.indexOf("w") !== -1 ? "w" : "-") + (/[xX]/.test(perms) ? "x" : "-");
            if (!who && (type === "user" || type === "group" || type === "other")) {
              var shift = type === "user" ? 6 : type === "group" ? 3 : 0;
              var bits = (p.charAt(0) === "r" ? 4 : 0) | (p.charAt(1) === "w" ? 2 : 0) | (p.charAt(2) === "x" ? 1 : 0);
              if (type === "group" && node.acl.length) node.groupBits = bits;
              else node.mode = (node.mode & ~(7 << shift)) | (bits << shift);
              continue;
            }
            if (type === "mask") continue;
            if (type === "user" && !userRow(state, who)) return bad("setfacl: Option -m: Invalid argument near character 3");
            node.acl = node.acl.filter(function (e) { return !(e.type === type && e.name === who && !!e.def === isDef); });
            node.acl.push({ type: type, name: who, perms: p, def: isDef });
          }
          var access = node.acl.filter(function (e) { return !e.def; });
          if (access.length) {
            if (node.groupBits == null) node.groupBits = (node.mode >> 3) & 7;
            var saved = node.mode;
            node.mode = (node.mode & ~56) | (node.groupBits << 3);
            var mask = aclMask(node);
            node.mode = (saved & ~56) | (mask << 3);
          } else if (node.groupBits != null) {
            node.mode = (node.mode & ~56) | (node.groupBits << 3);
            node.groupBits = null;
          }
          touchTimes(node, ["ctime"]);
        }
      }
    }
    return ok("");
  }
  function cmdLsattr(state, argv) {
    var names = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (!names.length) names = children(state, state.cwd).filter(function (c) { return c.name.charAt(0) !== "."; }).map(function (c) { return c.name; });
    var rows = [];
    for (var i = 0; i < names.length; i++) {
      var node = state.files[resolve(state, names[i])];
      if (!node) return bad("lsattr: No such file or directory while trying to stat " + names[i]);
      var attrs = node.attrs || "";
      var flags = "";
      [["s", "s"], ["u", "u"], ["S", "S"], ["D", "D"], ["i", "i"], ["a", "a"], ["d", "d"], ["A", "A"], ["c", "c"]].forEach(function (pair) { flags += attrs.indexOf(pair[0]) !== -1 ? pair[1] : "-"; });
      rows.push(flags + "-----e-------- " + (names[i].indexOf("/") === -1 ? "./" + names[i] : names[i]));
    }
    return ok(asText(rows));
  }
  function cmdChattr(state, argv) {
    var spec = argv[0];
    var names = argv.slice(1);
    if (!spec || !/^[+\-=][aiAdcsuS]+$/.test(spec) || !names.length) return bad("Usage: chattr [-+=aAcdisSu] files...   Example: sudo chattr +i notes.txt");
    var denied = needRoot(state, "chattr", argv, "Operation not permitted while setting flags on " + names[0]);
    if (denied) return denied;
    for (var i = 0; i < names.length; i++) {
      var node = state.files[resolve(state, names[i])];
      if (!node) return bad("chattr: No such file or directory while trying to stat " + names[i]);
      var cur = node.attrs || "";
      var letters = spec.slice(1).split("");
      if (spec.charAt(0) === "=") cur = letters.join("");
      else letters.forEach(function (l) {
        if (spec.charAt(0) === "+" && cur.indexOf(l) === -1) cur += l;
        if (spec.charAt(0) === "-") cur = cur.replace(l, "");
      });
      node.attrs = cur;
      touchTimes(node, ["ctime"]);
    }
    return ok("");
  }
  function attrBlock(state, path, what) {
    var node = state.files[path];
    if (!node || !node.attrs) return null;
    if (node.attrs.indexOf("i") !== -1) return bad(what + ": cannot change '" + base(path) + "': Operation not permitted (immutable attribute, see lsattr)");
    return null;
  }

  function cmdId(state, argv) {
    var name = argv.filter(function (a) { return a.charAt(0) !== "-"; })[0] || state.user;
    var row = userRow(state, name);
    if (!row) return bad("id: '" + name + "': no such user");
    var list = groupsOf(state, name);
    if (argv.indexOf("-u") !== -1) return ok(row[2] + "\n");
    if (argv.indexOf("-g") !== -1) return ok(row[3] + "\n");
    if (argv.indexOf("-Gn") !== -1 || argv.indexOf("-nG") !== -1) return ok(list.join(" ") + "\n");
    var primary = list[0];
    return ok("uid=" + row[2] + "(" + name + ") gid=" + row[3] + "(" + primary + ") groups=" + list.map(function (g) { return gidOf(state, g) + "(" + g + ")"; }).join(",") + "\n");
  }
  function cmdGroups(state, argv) {
    if (!argv.length) return ok(state.groups.join(" ") + "\n");
    var out = [];
    for (var i = 0; i < argv.length; i++) {
      var list = groupsOf(state, argv[i]);
      if (!list) return bad("groups: '" + argv[i] + "': no such user");
      out.push(argv[i] + " : " + list.join(" "));
    }
    return ok(asText(out));
  }
  function cmdGetent(state, argv) {
    var db = { passwd: "/etc/passwd", group: "/etc/group", shadow: "/etc/shadow" }[argv[0]];
    if (!db) return bad("getent: this lab knows passwd, group, and shadow");
    if (db === "/etc/shadow" && state.user !== "root") return ok("", 2);
    var rows = dbRows(state, db).filter(function (r) { return argv.length < 2 || argv.slice(1).indexOf(r[0]) !== -1 || argv.slice(1).indexOf(r[2]) !== -1; });
    return ok(asText(rows.map(function (r) { return r.join(":"); })), rows.length ? 0 : 2);
  }
  function parseUserOpts(argv, withArg) {
    var opts = {};
    var rest = [];
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a.charAt(0) === "-" && a.length > 1) {
        var letters = a.slice(1);
        if (letters.charAt(0) === "-") {
          var long = letters.slice(1);
          var eqAt = long.indexOf("=");
          if (eqAt !== -1) opts[long.slice(0, eqAt)] = long.slice(eqAt + 1);
          else opts[long] = withArg.indexOf(long) !== -1 ? argv[++i] : true;
          continue;
        }
        for (var k = 0; k < letters.length; k++) {
          var l = letters.charAt(k);
          if (withArg.indexOf(l) !== -1) { opts[l] = letters.slice(k + 1) || argv[++i]; break; }
          opts[l] = true;
        }
      } else rest.push(a);
    }
    return { opts: opts, rest: rest };
  }
  function daysNow() { return 20759; }
  function cmdUseradd(state, argv, debian) {
    var denied = needRoot(state, debian ? "adduser" : "useradd", argv, debian ? "Only root may add a user or group to the system." : "Permission denied.\nuseradd: cannot lock /etc/passwd; try again later.");
    if (denied) return denied;
    var p = parseUserOpts(argv, ["s", "c", "G", "u", "d", "g", "e"]);
    var name = p.rest[0];
    if (!name) return bad("Usage: useradd [options] LOGIN");
    if (!/^[a-z_][a-z0-9_-]*$/.test(name)) return bad("useradd: invalid user name '" + name + "'");
    if (userRow(state, name)) return bad("useradd: user '" + name + "' already exists");
    var rows = dbRows(state, "/etc/passwd");
    var groups = dbRows(state, "/etc/group");
    var used = rows.map(function (r) { return Number(r[2]); }).concat(groups.map(function (r) { return Number(r[2]); }));
    var uid = p.opts.u || String(Math.max.apply(null, used.map(function (n) { return n < 60000 ? n : 0; }).concat([999])) + 1);
    var home = p.opts.d || "/home/" + name;
    var shell = p.opts.s || (debian ? "/bin/bash" : "/bin/sh");
    var makeHome = debian || p.opts.m;
    var gid = uid;
    if (p.opts.g) {
      var g = groups.filter(function (r) { return r[0] === p.opts.g || r[2] === p.opts.g; })[0];
      if (!g) return bad("useradd: group '" + p.opts.g + "' does not exist");
      gid = g[2];
    } else {
      groups.push([name, "x", gid, ""]);
    }
    if (p.opts.G) {
      var missing = null;
      p.opts.G.split(",").forEach(function (gn) {
        var row = groups.filter(function (r) { return r[0] === gn; })[0];
        if (!row) { missing = gn; return; }
        row[3] = row[3] ? row[3] + "," + name : name;
      });
      if (missing) return bad("useradd: group '" + missing + "' does not exist");
    }
    rows.push([name, "x", uid, gid, p.opts.c || "", home, shell]);
    dbSave(state, "/etc/passwd", rows);
    dbSave(state, "/etc/group", groups);
    var shadow = dbRows(state, "/etc/shadow");
    shadow.push([name, "!", String(daysNow()), "0", "99999", "7", "", p.opts.e ? String(daysNow() + 30) : "", ""]);
    dbSave(state, "/etc/shadow", shadow);
    var out = [];
    if (makeHome) {
      if (!state.files[home]) {
        state.files[home] = { kind: "dir", mode: 488, owner: name, group: p.opts.g || name, text: "" };
        children(state, "/etc/skel").forEach(function (ch) {
          state.files[join(home, ch.name)] = { kind: "file", mode: 420, owner: name, group: p.opts.g || name, text: ch.node.text };
        });
      }
    }
    if (debian) {
      out.push("Adding user `" + name + "' ...", "Adding new group `" + name + "' (" + gid + ") ...", "Adding new user `" + name + "' (" + uid + ") with group `" + name + "' ...", "Creating home directory `" + home + "' ...", "Copying files from `/etc/skel' ...", "lab: adduser would now ask for a password and the full name. Set one with: sudo passwd " + name);
      return ok(asText(out));
    }
    return ok("");
  }
  function cmdPasswd(state, argv) {
    var p = parseUserOpts(argv, []);
    var name = p.rest[0] || state.user;
    if (name !== state.user && state.user !== "root") return bad("passwd: You may not view or modify password information for " + name + ".");
    if (!userRow(state, name)) return bad("passwd: user '" + name + "' does not exist");
    var shadow = dbRows(state, "/etc/shadow");
    var row = shadow.filter(function (r) { return r[0] === name; })[0];
    if (!row) { row = [name, "!", String(daysNow()), "0", "99999", "7", "", "", ""]; shadow.push(row); }
    if (p.opts.S) return ok(name + " " + (row[1].charAt(0) === "!" ? "L" : row[1] === "" ? "NP" : "P") + " 11/02/2026 " + row[3] + " " + row[4] + " " + row[5] + " -1\n");
    if (p.opts.l || p.opts.u) {
      if (state.user !== "root") return needRoot(state, "passwd", argv);
      if (p.opts.l && row[1].charAt(0) !== "!") row[1] = "!" + row[1];
      if (p.opts.u) row[1] = row[1].replace(/^!+/, "");
      dbSave(state, "/etc/shadow", shadow);
      return ok("passwd: password " + (p.opts.l ? "changed" : "changed") + ".\n");
    }
    if (p.opts.e) {
      if (state.user !== "root") return needRoot(state, "passwd", argv);
      row[2] = "0";
      dbSave(state, "/etc/shadow", shadow);
      return ok("passwd: password expiry information changed.\n");
    }
    row[1] = "$6$lab$" + name.split("").reverse().join("") + "Practice";
    row[2] = String(daysNow());
    dbSave(state, "/etc/shadow", shadow);
    var lines = [];
    if (state.user !== "root") lines.push("Changing password for " + name + ".", "Current password: (the lab typed it for you)");
    lines.push("New password: (the lab typed a practice password)", "Retype new password: (typed again)", "passwd: password updated successfully");
    return ok(asText(lines));
  }
  function cmdUsermod(state, argv) {
    var denied = needRoot(state, "usermod", argv, "Permission denied.\nusermod: cannot lock /etc/passwd; try again later.");
    if (denied) return denied;
    var p = parseUserOpts(argv, ["G", "s", "c", "d", "l", "e", "g", "u"]);
    var name = p.rest[0];
    if (!name) return bad("Usage: usermod [options] LOGIN");
    var rows = dbRows(state, "/etc/passwd");
    var row = rows.filter(function (r) { return r[0] === name; })[0];
    if (!row) return bad("usermod: user '" + name + "' does not exist");
    var groups = dbRows(state, "/etc/group");
    if (p.opts.G) {
      var want = p.opts.G.split(",");
      var missing = want.filter(function (gn) { return !groups.some(function (g) { return g[0] === gn; }); })[0];
      if (missing) return bad("usermod: group '" + missing + "' does not exist");
      groups.forEach(function (g) {
        var members = (g[3] || "").split(",").filter(Boolean);
        var has = members.indexOf(name) !== -1;
        if (want.indexOf(g[0]) !== -1 && !has) members.push(name);
        if (!p.opts.a && want.indexOf(g[0]) === -1 && has) members = members.filter(function (m) { return m !== name; });
        g[3] = members.join(",");
      });
    } else if (p.opts.a) return bad("usermod: -a needs -G. Example: usermod -aG sudo " + name);
    if (p.opts.s) row[6] = p.opts.s;
    if (p.opts.c) row[4] = p.opts.c;
    if (p.opts.g) {
      var g1 = groups.filter(function (g) { return g[0] === p.opts.g || g[2] === p.opts.g; })[0];
      if (!g1) return bad("usermod: group '" + p.opts.g + "' does not exist");
      row[3] = g1[2];
    }
    if (p.opts.d) {
      var oldHome = row[5];
      row[5] = p.opts.d;
      if (p.opts.m && state.files[oldHome]) moveNode(state, oldHome, p.opts.d);
    }
    var shadow = dbRows(state, "/etc/shadow");
    var srow = shadow.filter(function (r) { return r[0] === name; })[0];
    if (srow && p.opts.L && srow[1].charAt(0) !== "!") srow[1] = "!" + srow[1];
    if (srow && p.opts.U) srow[1] = srow[1].replace(/^!+/, "");
    if (srow && p.opts.e != null) srow[7] = p.opts.e === "" || p.opts.e === "-1" ? "" : (p.opts.e === "1" ? "1" : String(daysNow() + 1));
    if (p.opts.l) {
      if (userRow(state, p.opts.l)) return bad("usermod: user '" + p.opts.l + "' already exists");
      row[0] = p.opts.l;
      if (srow) srow[0] = p.opts.l;
      groups.forEach(function (g) { g[3] = (g[3] || "").split(",").map(function (m) { return m === name ? p.opts.l : m; }).join(","); });
    }
    dbSave(state, "/etc/passwd", rows);
    dbSave(state, "/etc/group", groups);
    if (srow) dbSave(state, "/etc/shadow", shadow);
    return ok("");
  }
  function cmdUserdel(state, argv) {
    var denied = needRoot(state, "userdel", argv, "Permission denied.\nuserdel: cannot lock /etc/passwd; try again later.");
    if (denied) return denied;
    var p = parseUserOpts(argv, []);
    var name = p.rest[0];
    if (!name) return bad("Usage: userdel [options] LOGIN");
    if (name === "root" || name === "ana") return bad("userdel: the lab keeps " + name + ". Practise on ken, mina, or a user you added.");
    var row = userRow(state, name);
    if (!row) return bad("userdel: user '" + name + "' does not exist");
    dbSave(state, "/etc/passwd", dbRows(state, "/etc/passwd").filter(function (r) { return r[0] !== name; }));
    dbSave(state, "/etc/shadow", dbRows(state, "/etc/shadow").filter(function (r) { return r[0] !== name; }));
    var groups = dbRows(state, "/etc/group").filter(function (g) { return !(g[0] === name && !(g[3] || "")); });
    groups.forEach(function (g) { g[3] = (g[3] || "").split(",").filter(function (m) { return m && m !== name; }).join(","); });
    dbSave(state, "/etc/group", groups);
    if (p.opts.r) {
      Object.keys(state.files).forEach(function (k) { if (k === row[5] || k.indexOf(row[5] + "/") === 0) delete state.files[k]; });
      return ok("userdel: " + name + " mail spool (/var/mail/" + name + ") not found\n");
    }
    return ok("");
  }
  function cmdGroupadd(state, argv) {
    var denied = needRoot(state, "groupadd", argv, "Permission denied.\ngroupadd: cannot lock /etc/group; try again later.");
    if (denied) return denied;
    var p = parseUserOpts(argv, ["g"]);
    var name = p.rest[0];
    if (!name) return bad("Usage: groupadd [options] GROUP");
    var groups = dbRows(state, "/etc/group");
    if (groups.some(function (g) { return g[0] === name; })) return bad("groupadd: group '" + name + "' already exists");
    var gid = p.opts.g || String(Math.max.apply(null, groups.map(function (g) { return Number(g[2]) < 60000 ? Number(g[2]) : 0; })) + 1);
    groups.push([name, "x", gid, ""]);
    dbSave(state, "/etc/group", groups);
    return ok("");
  }
  function cmdGroupdel(state, argv) {
    var denied = needRoot(state, "groupdel", argv);
    if (denied) return denied;
    var name = argv[0];
    var groups = dbRows(state, "/etc/group");
    var row = groups.filter(function (g) { return g[0] === name; })[0];
    if (!row) return bad("groupdel: group '" + name + "' does not exist");
    if (dbRows(state, "/etc/passwd").some(function (r) { return r[3] === row[2]; })) return bad("groupdel: cannot remove the primary group of a user");
    dbSave(state, "/etc/group", groups.filter(function (g) { return g[0] !== name; }));
    return ok("");
  }
  function cmdGpasswd(state, argv) {
    var denied = needRoot(state, "gpasswd", argv);
    if (denied) return denied;
    var mode = argv[0], user = argv[1], grp = argv[2];
    if ((mode !== "-a" && mode !== "-d") || !user || !grp) return bad("Usage: gpasswd -a USER GROUP   or   gpasswd -d USER GROUP");
    if (!userRow(state, user)) return bad("gpasswd: user '" + user + "' does not exist");
    var groups = dbRows(state, "/etc/group");
    var row = groups.filter(function (g) { return g[0] === grp; })[0];
    if (!row) return bad("gpasswd: group '" + grp + "' does not exist in /etc/group");
    var members = (row[3] || "").split(",").filter(Boolean);
    if (mode === "-a") { if (members.indexOf(user) === -1) members.push(user); row[3] = members.join(","); dbSave(state, "/etc/group", groups); return ok("Adding user " + user + " to group " + grp + "\n"); }
    if (members.indexOf(user) === -1) return bad("gpasswd: user '" + user + "' is not a member of '" + grp + "'");
    row[3] = members.filter(function (m) { return m !== user; }).join(",");
    dbSave(state, "/etc/group", groups);
    return ok("Removing user " + user + " from group " + grp + "\n");
  }
  function cmdChage(state, argv) {
    var p = parseUserOpts(argv, ["M", "m", "W", "E", "I", "d"]);
    var name = p.rest[0];
    if (!name) return bad("Usage: chage [options] LOGIN   Example: chage -l ana");
    var shadow = dbRows(state, "/etc/shadow");
    var row = shadow.filter(function (r) { return r[0] === name; })[0];
    if (!row) return bad("chage: user '" + name + "' does not exist in /etc/shadow");
    function day(n) {
      if (n === "" || n == null) return "never";
      var d = new Date(Date.UTC(1970, 0, 1) + Number(n) * 86400000);
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()] + " " + String(d.getUTCDate()).padStart(2, "0") + ", " + d.getUTCFullYear();
    }
    if (p.opts.l) {
      if (name !== state.user && state.user !== "root") return bad("chage: Permission denied.");
      var max = Number(row[4]);
      return ok([
        "Last password change                                    : " + (row[2] === "0" ? "password must be changed" : day(row[2])),
        "Password expires                                        : " + (row[2] === "0" ? "password must be changed" : max >= 99999 ? "never" : day(Number(row[2]) + max)),
        "Password inactive                                       : " + (row[6] ? day(Number(row[2]) + max + Number(row[6])) : "never"),
        "Account expires                                         : " + day(row[7]),
        "Minimum number of days between password change          : " + row[3],
        "Maximum number of days between password change          : " + row[4],
        "Number of days of warning before password expires       : " + row[5]
      ].join("\n") + "\n");
    }
    var denied = needRoot(state, "chage", argv);
    if (denied) return denied;
    if (p.opts.M != null) row[4] = p.opts.M;
    if (p.opts.m != null) row[3] = p.opts.m;
    if (p.opts.W != null) row[5] = p.opts.W;
    if (p.opts.I != null) row[6] = p.opts.I;
    if (p.opts.d != null) row[2] = p.opts.d === "0" ? "0" : String(daysNow());
    if (p.opts.E != null) {
      var e = p.opts.E;
      if (e === "-1") row[7] = "";
      else if (/^\d{4}-\d{2}-\d{2}$/.test(e)) row[7] = String(Math.round((Date.parse(e + "T00:00:00Z") - Date.UTC(1970, 0, 1)) / 86400000));
      else row[7] = e;
    }
    dbSave(state, "/etc/shadow", shadow);
    return ok("");
  }
  function cmdSudo(state, argv, stdin) {
    if (!argv.length) return bad("usage: sudo command   (for example: sudo cat /etc/shadow)");
    if (argv[0] === "-l") return ok("Matching Defaults entries for ana on lab:\n    env_reset, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\n\nUser ana may run the following commands on lab:\n    (ALL : ALL) ALL\n");
    if (argv[0] === "-i" || argv[0] === "-s" || argv[0] === "su" || argv[0] === "bash") return bad("lab: an interactive root shell is not offered here. Put sudo in front of each command instead, for example: sudo whoami");
    if (state.user !== "ana" && state.user !== "root") return bad(state.user + " is not in the sudoers file.  This incident will be reported.");
    var target = "root";
    var args = argv.slice();
    if (args[0] === "-u") { target = args[1]; args = args.slice(2); }
    if (!userRow(state, target)) return bad("sudo: unknown user " + target);
    var cmd = args[0];
    if (!cmd) return bad("usage: sudo -u user command");
    if (!COMMANDS[cmd]) return bad("sudo: " + cmd + ": command not found");
    var saved = { user: state.user, group: state.group, groups: state.groups, sudo: state.inSudo };
    state.user = target;
    state.group = groupsOf(state, target)[0];
    state.groups = groupsOf(state, target);
    state.inSudo = true;
    try { return COMMANDS[cmd](state, args.slice(1), stdin || ""); }
    finally { state.user = saved.user; state.group = saved.group; state.groups = saved.groups; state.inSudo = saved.sudo; }
  }
  function cmdSu(state, argv) {
    var who = argv.filter(function (a) { return a !== "-" && a !== "-l"; })[0] || "root";
    return bad("lab: su starts a whole new login shell as " + who + ", which this practice terminal cannot open.\nUse sudo instead: sudo -u " + who + " whoami   (or: sudo command for root)");
  }
  function cmdVisudo(state, argv) {
    var denied = needRoot(state, "visudo", argv, "/etc/sudoers: Permission denied");
    if (denied) return denied;
    if (argv[0] === "-c") {
      var names = ["/etc/sudoers"].concat(children(state, "/etc/sudoers.d").map(function (c) { return c.path; }));
      var bad1 = null;
      var lines = names.map(function (n) {
        var text = state.files[n].text || "";
        var broken = linesOf(text).some(function (l) { return l.trim() && l.trim().charAt(0) !== "#" && !/^(%?[\w-]+|Defaults)\s+\S/.test(l.trim()); });
        if (broken) bad1 = n;
        return n + ": " + (broken ? "syntax error" : "parsed OK");
      });
      return bad1 ? bad(lines.join("\n"), 1) : ok(asText(lines));
    }
    return bad("lab: visudo opens an editor, which this terminal cannot show. It checks the file before saving.\nHere, write a drop-in file and check it:\n  echo 'ken ALL=(ALL:ALL) ALL' | sudo tee /etc/sudoers.d/ken\n  sudo visudo -c");
  }

  var ZONES = { UTC: [0, "UTC"], "Etc/UTC": [0, "UTC"], "Asia/Tokyo": [540, "JST"], "Asia/Kolkata": [330, "IST"], "Asia/Kathmandu": [345, "+0545"], "America/New_York": [-300, "EST"], "America/Chicago": [-360, "CST"], "America/Los_Angeles": [-480, "PST"], "Europe/London": [0, "GMT"], "Europe/Berlin": [60, "CET"], "Australia/Sydney": [660, "AEDT"] };
  var BASE_TIME = Date.UTC(2026, 10, 2, 9, 4, 1);
  function zoneOf(state) {
    var tz = state.env.TZ || state.timezone || "Etc/UTC";
    return ZONES[tz] ? { name: tz, off: ZONES[tz][0], abbr: ZONES[tz][1] } : { name: tz, off: 0, abbr: "UTC" };
  }
  function fmtDate(ms, zone, fmt) {
    var d = new Date(ms + zone.off * 60000);
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function p2(n) { return String(n).padStart(2, "0"); }
    var sign = zone.off < 0 ? "-" : "+";
    var abs = Math.abs(zone.off);
    var map = {
      Y: String(d.getUTCFullYear()), m: p2(d.getUTCMonth() + 1), d: p2(d.getUTCDate()), e: String(d.getUTCDate()).padStart(2, " "),
      H: p2(d.getUTCHours()), M: p2(d.getUTCMinutes()), S: p2(d.getUTCSeconds()), I: p2(d.getUTCHours() % 12 || 12), p: d.getUTCHours() < 12 ? "AM" : "PM",
      a: days[d.getUTCDay()].slice(0, 3), A: days[d.getUTCDay()], b: months[d.getUTCMonth()].slice(0, 3), B: months[d.getUTCMonth()], u: String(d.getUTCDay() || 7),
      j: String(Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1).padStart(3, "0"), s: String(Math.floor(ms / 1000)),
      Z: zone.abbr, z: sign + p2(Math.floor(abs / 60)) + p2(abs % 60), n: "\n", t: "\t", "%": "%"
    };
    map.F = map.Y + "-" + map.m + "-" + map.d;
    map.T = map.H + ":" + map.M + ":" + map.S;
    map.D = map.m + "/" + map.d + "/" + map.Y.slice(2);
    map.R = map.H + ":" + map.M;
    var out = "";
    for (var i = 0; i < fmt.length; i++) {
      if (fmt.charAt(i) === "%" && map[fmt.charAt(i + 1)] != null) { out += map[fmt.charAt(i + 1)]; i++; }
      else out += fmt.charAt(i);
    }
    return out;
  }
  function parseWhen(text) {
    var t = String(text).trim().toLowerCase();
    var day = 86400000;
    if (t === "now" || t === "today") return BASE_TIME;
    if (t === "tomorrow") return BASE_TIME + day;
    if (t === "yesterday") return BASE_TIME - day;
    var m = t.match(/^([+-]?\d+)\s*(day|days|hour|hours|minute|minutes|week|weeks)(\s+ago)?$/) || t.match(/^(?:next\s+)?(\d+)?\s*(week|month)$/);
    if (m) {
      var n = Number(m[1] || 1) * (m[3] ? -1 : 1);
      var unit = /day/.test(m[2]) ? day : /hour/.test(m[2]) ? 3600000 : /minute/.test(m[2]) ? 60000 : /week/.test(m[2]) ? 7 * day : 30 * day;
      return BASE_TIME + n * unit;
    }
    if (/^@\d+$/.test(t)) return Number(t.slice(1)) * 1000;
    if (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(t)) return Date.parse(t.replace(" ", "T") + (t.length === 10 ? "T00:00:00" : "") + "Z");
    return null;
  }
  function cmdDate2(state, argv) {
    var zone = zoneOf(state);
    var when = BASE_TIME;
    var fmt = null;
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-u" || a === "--utc") zone = { name: "UTC", off: 0, abbr: "UTC" };
      else if (a === "-d" || a === "--date") {
        when = parseWhen(argv[++i]);
        if (when == null) return bad("date: invalid date '" + argv[i] + "'");
      } else if (a.indexOf("--date=") === 0) {
        when = parseWhen(a.slice(7));
        if (when == null) return bad("date: invalid date '" + a.slice(7) + "'");
      } else if (a === "-s" || a === "--set") return needRoot(state, "date", argv, "cannot set date: Operation not permitted") || bad("lab: the lab clock is fixed at Mon Nov 2 09:04:01 UTC 2026. On a real host, prefer timedatectl set-time.");
      else if (a === "-I" || a === "--iso-8601") fmt = "%F";
      else if (a === "-R") fmt = "%a, %d %b %Y %T %z";
      else if (a.charAt(0) === "+") fmt = a.slice(1);
    }
    return ok(fmtDate(when, zone, fmt || "%a %b %e %T %Z %Y") + "\n");
  }
  function cmdTimedatectl(state, argv) {
    var sub = argv[0] || "status";
    var zone = { name: state.timezone || "Etc/UTC", off: (ZONES[state.timezone || "Etc/UTC"] || [0])[0], abbr: (ZONES[state.timezone || "Etc/UTC"] || [0, "UTC"])[1] };
    if (sub === "status") {
      return ok([
        "               Local time: " + fmtDate(BASE_TIME, zone, "%a %F %T %Z"),
        "           Universal time: " + fmtDate(BASE_TIME, { off: 0, abbr: "UTC" }, "%a %F %T %Z"),
        "                 RTC time: " + fmtDate(BASE_TIME, { off: 0, abbr: "UTC" }, "%a %F %T"),
        "                Time zone: " + zone.name + " (" + zone.abbr + ", " + fmtDate(BASE_TIME, zone, "%z") + ")",
        "System clock synchronized: yes",
        "              NTP service: " + (state.ntp === false ? "inactive" : "active"),
        "          RTC in local mode: no"
      ].join("\n") + "\n");
    }
    if (sub === "list-timezones") return ok(asText(Object.keys(ZONES).filter(function (z) { return z !== "UTC"; }).sort()));
    if (sub === "show") return ok("Timezone=" + zone.name + "\nLocalRTC=no\nCanNTP=yes\nNTP=" + (state.ntp === false ? "no" : "yes") + "\nNTPSynchronized=yes\n");
    if (sub === "set-timezone" || sub === "set-ntp" || sub === "set-time") {
      var denied = needRoot(state, "timedatectl", argv, "Failed to " + sub.replace("-", " ") + ": Access denied");
      if (denied) return denied;
      if (sub === "set-timezone") {
        if (!ZONES[argv[1]]) return bad("Failed to set time zone: Invalid or not installed time zone '" + argv[1] + "'");
        state.timezone = argv[1];
        return ok("");
      }
      if (sub === "set-ntp") { state.ntp = argv[1] === "true" || argv[1] === "yes" || argv[1] === "1"; return ok(""); }
      return bad("Failed to set time: Automatic time synchronization is enabled. Turn it off with: sudo timedatectl set-ntp false");
    }
    return bad("timedatectl: unknown command " + sub + ". Try status, list-timezones, set-timezone, set-ntp");
  }

  function cmdXargs(state, argv, stdin) {
    var perCall = 0;
    var place = null;
    var trace = false;
    var noEmpty = false;
    var delim = null;
    var i = 0;
    for (; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-n") perCall = Number(argv[++i]);
      else if (/^-n\d+$/.test(a)) perCall = Number(a.slice(2));
      else if (a === "-I") place = argv[++i];
      else if (a.indexOf("-I") === 0 && a.length > 2) place = a.slice(2);
      else if (a === "-t") trace = true;
      else if (a === "-r" || a === "--no-run-if-empty") noEmpty = true;
      else if (a === "-0" || a === "--null") delim = "\0";
      else if (a === "-d") delim = argv[++i].replace("\\n", "\n");
      else if (a === "-P") i++;
      else break;
    }
    var cmd = argv.slice(i);
    if (!cmd.length) cmd = ["echo"];
    var items;
    if (place != null) items = linesOf(stdin).filter(function (l) { return l.trim() !== ""; });
    else if (delim != null) items = String(stdin).split(delim).filter(Boolean);
    else items = String(stdin).trim() === "" ? [] : String(stdin).trim().split(/\s+/);
    if (!items.length && (noEmpty || place != null)) return ok("");
    function q(s) { return /^[\w.\/@%+=:,-]+$/.test(s) ? s : "'" + s.replace(/'/g, "'\\''") + "'"; }
    var calls = [];
    if (place != null) items.forEach(function (it) { calls.push(cmd.map(function (w) { return w.split(place).join(it); })); });
    else if (perCall > 0) for (var k = 0; k < items.length; k += perCall) calls.push(cmd.concat(items.slice(k, k + perCall)));
    else calls.push(cmd.concat(items));
    var out = "", err = "", code = 0;
    calls.slice(0, 50).forEach(function (words) {
      if (trace) err += words.join(" ") + "\n";
      var res = runLine(state, words.map(q).join(" "));
      out += res.stdout || "";
      err += res.stderr || "";
      if (res.code) code = 123;
    });
    return { stdout: out, stderr: err, code: code, clear: false };
  }

  var PACK = {
    gzip: { ext: ".gz", format: "gz", un: "gunzip", cat: "zcat" },
    bzip2: { ext: ".bz2", format: "bz2", un: "bunzip2", cat: "bzcat" },
    xz: { ext: ".xz", format: "xz", un: "unxz", cat: "xzcat" }
  };
  function cmdPack(state, tool, argv) {
    var info = PACK[tool];
    var flags = argv.filter(function (a) { return /^-[a-z0-9]+$/i.test(a); }).join("");
    var names = argv.filter(function (a) { return !/^-[a-z0-9]+$/i.test(a); });
    var keep = flags.indexOf("k") !== -1;
    var decompress = flags.indexOf("d") !== -1;
    var toStdout = flags.indexOf("c") !== -1;
    var verbose = flags.indexOf("v") !== -1;
    if (flags.indexOf("l") !== -1 && tool === "gzip") {
      var rows = ["         compressed        uncompressed  ratio uncompressed_name"];
      for (var j = 0; j < names.length; j++) {
        var nd = state.files[resolve(state, names[j])];
        if (!nd || nd.kind !== "archive") return bad("gzip: " + names[j] + ": not in gzip format");
        var raw = nd.members.reduce(function (t, m) { return t + m.text.length; }, 0) + (nd.isTar ? 1024 : 0);
        var packed = sizeOf(nd);
        rows.push(String(packed).padStart(19) + String(raw).padStart(20) + (((1 - packed / Math.max(raw, 1)) * 100).toFixed(1) + "%").padStart(7) + " " + names[j].replace(/\.gz$/, ""));
      }
      return ok(asText(rows));
    }
    if (decompress) return cmdUnpack(state, tool, names, keep, toStdout);
    if (!names.length) return bad(tool + ": compressed data not written to a terminal. Name a file: " + tool + " notes.txt");
    var notes = [];
    for (var i = 0; i < names.length; i++) {
      var path = resolve(state, names[i]);
      var node = state.files[path];
      if (!node) return bad(tool + ": " + names[i] + ": No such file or directory");
      if (node.kind === "dir") return bad(tool + ": " + names[i] + " is a directory -- ignored. Pack a folder with tar first: tar -czf " + names[i] + ".tar.gz " + names[i]);
      if (node.kind === "archive" && node.format !== "tar") return bad(tool + ": " + names[i] + " already has a compressed suffix -- unchanged");
      if (state.files[path + info.ext]) return bad(tool + ": " + names[i] + info.ext + " already exists; not overwritten");
      var packedNode = { kind: "archive", format: info.format, mode: node.mode, owner: node.owner, group: node.group, text: "", isTar: node.kind === "archive", members: node.kind === "archive" ? node.members : [{ name: base(path), text: node.text }] };
      touchTimes(packedNode, ["atime", "mtime", "ctime", "btime"]);
      if (toStdout) return ok("lab: compressed bytes are binary, so the lab will not print them. Use " + tool + " -k " + names[i] + " to keep both files.\n");
      state.files[path + info.ext] = packedNode;
      if (!keep) delete state.files[path];
      var before = node.kind === "archive" ? sizeOf(node) : sizeOf(node);
      if (verbose) notes.push(names[i] + ":\t" + ((1 - sizeOf(packedNode) / Math.max(before, 1)) * 100).toFixed(1) + "% -- replaced with " + names[i] + info.ext);
    }
    return ok(asText(notes));
  }
  function cmdUnpack(state, tool, names, keep, toStdout) {
    var info = PACK[tool];
    if (!names.length) return bad(info.un + ": name a file, for example " + info.un + " notes.txt" + info.ext);
    var out = "";
    for (var i = 0; i < names.length; i++) {
      var path = resolve(state, names[i]);
      var node = state.files[path];
      if (!node) return bad(info.un + ": " + names[i] + ": No such file or directory");
      if (node.kind !== "archive" || node.format !== info.format) return bad(info.un + ": " + names[i] + ": not in " + tool + " format");
      if (toStdout) {
        if (node.isTar) return bad("lab: this is a tar archive inside " + tool + ". List it with tar -tf " + names[i]);
        out += node.members.map(function (m) { return m.text; }).join("");
        continue;
      }
      var dest = path.slice(-info.ext.length) === info.ext ? path.slice(0, -info.ext.length) : path + ".out";
      if (node.isTar) state.files[dest] = { kind: "archive", format: "tar", mode: node.mode, owner: node.owner, group: node.group, text: "", members: node.members };
      else { var restored = file(node.members[0].text, node.mode); restored.owner = node.owner; restored.group = node.group; state.files[dest] = restored; }
      if (!keep) delete state.files[path];
    }
    return ok(out);
  }
  function gatherMembers(state, name, list) {
    var path = resolve(state, name);
    var node = state.files[path];
    if (!node) return false;
    if (node.kind === "dir") {
      list.push({ name: name.replace(/\/$/, "") + "/", text: "", dir: true });
      children(state, path).forEach(function (ch) { gatherMembers(state, name.replace(/\/$/, "") + "/" + ch.name, list); });
    } else if (node.kind === "file") list.push({ name: name, text: node.text, mode: node.mode });
    else if (node.kind === "archive") list.push({ name: name, text: "", mode: node.mode, archive: node });
    return true;
  }
  function cmdTar2(state, argv) {
    if (!argv.length) return bad("tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options");
    var args = argv.slice();
    var letters = "";
    var archive = null;
    var dir = null;
    var excludes = [];
    var rest = [];
    if (/^[a-zA-Z]+$/.test(args[0])) args[0] = "-" + args[0];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a === "-C" || a === "--directory") dir = args[++i];
      else if (a.indexOf("--exclude=") === 0) excludes.push(a.slice(10));
      else if (a === "--exclude") excludes.push(args[++i]);
      else if (a === "--gzip") letters += "z";
      else if (a === "--list") letters += "t";
      else if (a === "--extract") letters += "x";
      else if (a === "--create") letters += "c";
      else if (a.indexOf("--file=") === 0) archive = a.slice(7);
      else if (a.charAt(0) === "-" && a.length > 1 && a.charAt(1) !== "-") {
        var ls = a.slice(1);
        for (var k = 0; k < ls.length; k++) {
          if (ls.charAt(k) === "f") { archive = ls.slice(k + 1) || args[++i]; break; }
          letters += ls.charAt(k);
        }
      } else rest.push(a);
    }
    if (!archive) return bad("tar: the f flag needs an archive name, for example tar -czf backup.tar.gz work");
    var verbose = letters.indexOf("v") !== -1;
    var path = resolve(state, archive);
    var format = letters.indexOf("z") !== -1 ? "gz" : letters.indexOf("j") !== -1 ? "bz2" : letters.indexOf("J") !== -1 ? "xz" : null;
    function skip(name) { return excludes.some(function (pat) { return globToReg(pat).test(base(name.replace(/\/$/, ""))); }); }
    if (letters.indexOf("c") !== -1) {
      if (!rest.length) return bad("tar: Cowardly refusing to create an empty archive");
      var members = [];
      var saveCwd = state.cwd;
      if (dir) state.cwd = resolve(state, dir);
      for (var r = 0; r < rest.length; r++) {
        if (!gatherMembers(state, rest[r], members)) { state.cwd = saveCwd; return bad("tar: " + rest[r] + ": Cannot stat: No such file or directory"); }
      }
      state.cwd = saveCwd;
      members = members.filter(function (m) { return !skip(m.name); }).map(function (m) { return { name: m.name.replace(/^\//, ""), text: m.text, dir: m.dir }; });
      var node = { kind: "archive", format: format || "tar", isTar: true, mode: 420, owner: state.user, group: state.group, members: members, text: "" };
      touchTimes(node, ["atime", "mtime", "ctime", "btime"]);
      state.files[path] = node;
      var note = rest.some(function (n) { return n.charAt(0) === "/"; }) ? "tar: Removing leading `/' from member names\n" : "";
      return { stdout: verbose ? asText(members.map(function (m) { return m.name; })) : "", stderr: note, code: 0, clear: false };
    }
    var arc = state.files[path];
    if (!arc || arc.kind !== "archive") return bad("tar: " + archive + ": Cannot open: No such file or directory");
    if (!arc.isTar && arc.format !== "tar") return bad("tar: This does not look like a tar archive");
    var picked = arc.members.filter(function (m) {
      if (!rest.length) return true;
      return rest.some(function (want) { return m.name === want || m.name.indexOf(want.replace(/\/$/, "") + "/") === 0 || globToReg(want).test(m.name); });
    });
    if (rest.length && !picked.length) return bad("tar: " + rest[0] + ": Not found in archive\ntar: Exiting with failure status due to previous errors");
    if (letters.indexOf("t") !== -1) {
      return ok(asText(picked.map(function (m) {
        return verbose ? (m.dir ? "drwxr-xr-x" : "-rw-r--r--") + " ana/ana " + String(m.text.length).padStart(6) + " 2026-11-02 09:00 " + m.name : m.name;
      })));
    }
    if (letters.indexOf("x") !== -1) {
      var into = dir ? resolve(state, dir) : state.cwd;
      if (!state.files[into] || state.files[into].kind !== "dir") return bad("tar: " + dir + ": Cannot open: No such file or directory");
      picked.forEach(function (m) {
        var dest = normalize(into + "/" + m.name);
        if (m.dir) { if (!state.files[dest]) { var parts = dest.split("/").filter(Boolean); var cur = ""; parts.forEach(function (p) { cur += "/" + p; if (!state.files[cur]) ensureDir(state, cur); }); } return; }
        var pp = parent(dest).split("/").filter(Boolean); var c2 = "";
        pp.forEach(function (p) { c2 += "/" + p; if (!state.files[c2]) ensureDir(state, c2); });
        writeFile(state, dest, m.text, false);
      });
      return ok(verbose ? asText(picked.map(function (m) { return m.name; })) : "");
    }
    return bad("tar: use c to create, t to list, or x to extract");
  }
  function cmd7z(state, argv) {
    var sub = argv[0];
    var rest = argv.slice(1).filter(function (a) { return a.charAt(0) !== "-"; });
    var head = "\n7-Zip [64] 16.02 : Copyright (c) 1999-2016 Igor Pavlov\n\n";
    if (!sub || !rest.length) return bad("Usage: 7z a archive.7z files   |   7z l archive.7z   |   7z x archive.7z");
    var path = resolve(state, rest[0]);
    if (sub === "a") {
      var members = [];
      for (var i = 1; i < rest.length; i++) if (!gatherMembers(state, rest[i], members)) return bad(head + "WARNING: The system cannot find the file specified.\n" + rest[i]);
      var enc = argv.some(function (a) { return /^-p/.test(a); });
      state.files[path] = { kind: "archive", format: "7z", isTar: false, mode: 420, owner: state.user, group: state.group, members: members.filter(function (m) { return !m.dir; }), text: "", encrypted: enc };
      return ok(head + "Scanning the drive:\n" + members.length + " files\n\nCreating archive: " + rest[0] + "\n\nEverything is Ok\n");
    }
    var node = state.files[path];
    if (!node || node.format !== "7z") return bad(head + "ERROR: " + rest[0] + "\nCan not open the file as archive");
    if (sub === "l") return ok(head + "   Date      Time    Attr         Size   Name\n------------------- ----- ------------ ------------------------\n" + node.members.map(function (m) { return "2026-11-02 09:00:00 ....A " + String(m.text.length).padStart(12) + "  " + m.name; }).join("\n") + "\n");
    if (sub === "x" || sub === "e") {
      node.members.forEach(function (m) {
        var dest = resolve(state, sub === "e" ? base(m.name) : m.name);
        var pp = parent(dest).split("/").filter(Boolean); var c2 = "";
        pp.forEach(function (p) { c2 += "/" + p; if (!state.files[c2]) ensureDir(state, c2); });
        writeFile(state, dest, m.text, false);
      });
      return ok(head + (node.encrypted ? "Enter password (will not be echoed): (the lab typed it)\n" : "") + "Extracting archive: " + rest[0] + "\nEverything is Ok\n\nFiles: " + node.members.length + "\n");
    }
    return bad("7z: this lab knows a (add), l (list), x (extract with folders), e (extract flat)");
  }

  function cmdRsync2(state, argv) {
    var flags = argv.filter(function (a) { return /^-[a-zA-Z]+$/.test(a); }).join("");
    var verbose = flags.indexOf("v") !== -1;
    var dry = flags.indexOf("n") !== -1 || argv.indexOf("--dry-run") !== -1;
    var del = argv.indexOf("--delete") !== -1;
    var excludes = argv.filter(function (a) { return a.indexOf("--exclude=") === 0; }).map(function (a) { return a.slice(10); });
    var args = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (args.length < 2) return bad("usage: rsync -av source/ dest/");
    var src = args[0], dest = args[1];
    if (splitRemote(dest) || splitRemote(src)) return cmdRsync(state, argv);
    var from = resolve(state, src);
    var node = state.files[from];
    if (!node) return bad("rsync: change_dir \"" + src + "\" failed: No such file or directory (2)");
    var into = resolve(state, dest);
    var contents = /\/$/.test(src) || node.kind !== "dir";
    var root = into;
    var delRoot = node.kind === "dir" && !contents ? join(into, base(from)) : into;
    var list = [];
    function walkSrc(p, rel) {
      var n = state.files[p];
      if (excludes.some(function (pat) { return globToReg(pat).test(base(p)); })) return;
      if (n.kind === "dir") {
        if (rel) list.push({ rel: rel + "/", dir: true });
        children(state, p).sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (ch) { walkSrc(ch.path, rel ? rel + "/" + ch.name : ch.name); });
      } else if (n.kind === "file") list.push({ rel: rel || base(p), text: n.text });
    }
    if (node.kind === "dir") walkSrc(from, contents ? "" : base(from));
    else list.push({ rel: base(from), text: node.text });
    var changed = [];
    var sent = 0;
    var targetDir = node.kind === "dir" ? root : (state.files[into] && state.files[into].kind === "dir" ? into : parent(into));
    if (!dry && !state.files[targetDir]) {
      var chain = [];
      for (var up = parent(targetDir); up && up !== "/" && !state.files[up]; up = parent(up)) chain.unshift(up);
      chain.forEach(function (d) { ensureDir(state, d); });
      var made = ensureDir(state, targetDir);
      if (made.code) return bad("rsync: mkdir \"" + dest + "\" failed: " + made.stderr.trim());
    }
    list.forEach(function (item) {
      var to = node.kind === "dir" ? normalize(root + "/" + item.rel) : (state.files[into] && state.files[into].kind === "dir" ? join(into, item.rel) : into);
      if (item.dir) {
        if (!state.files[to.replace(/\/$/, "")]) { changed.push(item.rel); if (!dry) ensureDir(state, to.replace(/\/$/, "")); }
        return;
      }
      var have = state.files[to];
      if (have && have.kind === "file" && have.text === item.text) return;
      changed.push(item.rel);
      sent += item.text.length;
      if (!dry) writeFile(state, to, item.text, false);
    });
    var deleted = [];
    if (del && node.kind === "dir" && state.files[delRoot]) {
      var wanted = {};
      list.forEach(function (item) { wanted[normalize(root + "/" + item.rel)] = true; });
      Object.keys(state.files).filter(function (k) { return k.indexOf(delRoot + "/") === 0 && !wanted[k]; }).sort().reverse().forEach(function (k) {
        deleted.push("deleting " + k.slice(root.length + 1) + (state.files[k].kind === "dir" ? "/" : ""));
        if (!dry) delete state.files[k];
      });
    }
    if (!verbose && !dry) return ok("");
    var lines = ["sending incremental file list"].concat(deleted.reverse(), changed, ["", "sent " + (sent + 120) + " bytes  received " + (changed.length * 19 + 35) + " bytes", "total size is " + list.reduce(function (t, x) { return t + (x.text || "").length; }, 0) + "  speedup is 1.00" + (dry ? " (DRY RUN)" : "")]);
    return ok(asText(lines));
  }

  function cmdCrontab2(state, argv, stdin) {
    var p = argv.filter(function (a) { return a.charAt(0) === "-"; }).join("");
    var fileArg = argv.filter(function (a) { return a.charAt(0) !== "-"; })[0];
    if (argv.indexOf("-u") !== -1 && state.user !== "root") return bad("crontab: must be privileged to use -u");
    if (p.indexOf("l") !== -1) return state.crontab ? ok(state.crontab) : bad("no crontab for " + state.user);
    if (p.indexOf("r") !== -1) { state.crontab = ""; return ok(""); }
    if (p.indexOf("e") !== -1) return bad("lab: crontab -e opens your editor, which this terminal cannot show.\nThe same result without an editor:\n  (crontab -l; echo '30 2 * * * /home/ana/backup.sh') | crontab -\n  crontab -l");
    if (argv[0] === "-" || fileArg === "-") {
      var text = String(stdin || "");
      var problem = cronCheck(text);
      if (problem) return bad("\"-\":" + problem + "\nerrors in crontab file, can't install.");
      state.crontab = text;
      return ok("");
    }
    if (fileArg) {
      var got = readPath(state, resolve(state, fileArg));
      if (got.code) return bad("crontab: " + fileArg + ": No such file or directory");
      var problem2 = cronCheck(got.stdout);
      if (problem2) return bad("\"" + fileArg + "\":" + problem2 + "\nerrors in crontab file, can't install.");
      state.crontab = got.stdout;
      return ok("");
    }
    return bad("usage: crontab -l | crontab -r | crontab file | crontab -   (crontab -e opens an editor)");
  }
  function cronCheck(text) {
    var rows = linesOf(text);
    for (var i = 0; i < rows.length; i++) {
      var l = rows[i].trim();
      if (!l || l.charAt(0) === "#" || /^[A-Z_]+=/.test(l)) continue;
      if (/^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)\s+\S/.test(l)) continue;
      var parts = l.split(/\s+/);
      if (parts.length < 6) return (i + 1) + ": bad minute (a line needs 5 time fields and a command)";
      var names = ["minute", "hour", "day-of-month", "month", "day-of-week"];
      var max = [59, 23, 31, 12, 7];
      for (var f = 0; f < 5; f++) {
        if (!/^(\*|\d+(-\d+)?)(\/\d+)?(,(\*|\d+(-\d+)?)(\/\d+)?)*$/i.test(parts[f]) && !(f >= 3 && /^[a-z]{3}(-[a-z]{3})?(,[a-z]{3})*$/i.test(parts[f]))) return (i + 1) + ": bad " + names[f];
        var nums = parts[f].match(/\d+/g) || [];
        if (nums.some(function (n, idx) { return Number(n) > max[f] && parts[f].indexOf("/" + n) === -1; })) return (i + 1) + ": bad " + names[f];
      }
    }
    return null;
  }
  function cmdAt(state, argv, stdin) {
    if (argv[0] === "-l") return cmdAtq(state);
    if (argv[0] === "-c") {
      var job = state.atjobs.filter(function (j) { return String(j.id) === argv[1]; })[0];
      if (!job) return bad("Cannot find jobid " + argv[1]);
      return ok("#!/bin/sh\n# atrun uid=1000 gid=1000\ncd /home/ana/work || exit 1\n" + job.cmd + "\n");
    }
    if (argv[0] === "-d") return cmdAtrm(state, argv.slice(1));
    var spec = argv.filter(function (a) { return a !== "-f" && a.charAt(0) !== "-"; }).join(" ");
    if (!spec) return bad("Garbled time. Examples: at now + 5 minutes, at 17:30, at 09:00 tomorrow");
    var when = null;
    var s = spec.toLowerCase();
    var rel = s.match(/^now\s*\+\s*(\d+)\s*(minute|minutes|hour|hours|day|days)$/);
    var clock = s.match(/^(\d{1,2}):?(\d{2})\s*(am|pm)?(\s+tomorrow)?$/);
    if (s === "now") when = BASE_TIME;
    else if (rel) when = BASE_TIME + Number(rel[1]) * (/min/.test(rel[2]) ? 60000 : /hour/.test(rel[2]) ? 3600000 : 86400000);
    else if (clock) {
      var h = Number(clock[1]) % 24 + (clock[3] === "pm" && Number(clock[1]) < 12 ? 12 : 0);
      when = Date.UTC(2026, 10, 2, h, Number(clock[2]), 0);
      if (clock[4] || when <= BASE_TIME) when += 86400000;
    } else if (s === "noon" || s === "midnight" || s === "teatime") when = Date.UTC(2026, 10, s === "noon" ? 2 : 3, s === "noon" ? 12 : s === "teatime" ? 16 : 0, 0, 0);
    if (when == null) return bad("syntax error. Last token seen: " + spec.split(" ").pop() + "\nGarbled time");
    var cmd = argv.indexOf("-f") !== -1 ? (readPath(state, resolve(state, argv[argv.indexOf("-f") + 1])).stdout || "") : String(stdin || "").trim();
    if (!cmd) return bad("lab: pipe the command in, for example: echo 'df -h > /tmp/disk.txt' | at now + 5 minutes");
    var id = (state.atNext = (state.atNext || 0) + 1);
    state.atjobs.push({ id: id, when: when, cmd: cmd });
    return { stdout: "", stderr: "warning: commands will be executed using /bin/sh\njob " + id + " at " + fmtDate(when, { off: 0, abbr: "UTC" }, "%a %b %e %T %Y") + "\n", code: 0, clear: false };
  }
  function cmdAtq(state) {
    return ok(asText(state.atjobs.map(function (j) { return j.id + "\t" + fmtDate(j.when, { off: 0 }, "%a %b %e %T %Y") + " a " + state.user; })));
  }
  function cmdAtrm(state, argv) {
    for (var i = 0; i < argv.length; i++) {
      var before = state.atjobs.length;
      state.atjobs = state.atjobs.filter(function (j) { return String(j.id) !== argv[i]; });
      if (state.atjobs.length === before) return bad("Cannot find jobid " + argv[i]);
    }
    return ok("");
  }
  function unitText(state, name) {
    var node = state.files["/etc/systemd/system/" + name];
    return node ? node.text : null;
  }
  function cmdSystemctl(state, argv) {
    var args = argv.filter(function (a) { return a !== "--no-pager" && a !== "--user" && a !== "--now"; });
    var sub = args[0] || "status";
    var unit = args[1] || "";
    if (unit && !/\./.test(unit)) unit += ".service";
    state.units = state.units || { "backup.timer": { enabled: true, active: true }, "backup.service": { enabled: false, active: false } };
    if (sub === "list-timers") {
      var rows = ["NEXT                        LEFT              LAST                        PASSED       UNIT                         ACTIVATES"];
      Object.keys(state.units).filter(function (u) { return /\.timer$/.test(u) && state.units[u].active; }).sort().forEach(function (u) {
        var cal = (unitText(state, u) || "").match(/OnCalendar=(.+)/);
        var spec = cal ? cal[1].trim() : "daily";
        var next = calendarNext(spec);
        rows.push((fmtDate(next, { off: 0, abbr: "UTC" }, "%a %F %T %Z")).padEnd(28) + humanLeft(next - BASE_TIME).padEnd(18) + "Mon 2026-11-02 02:30:04 UTC".padEnd(28) + "6h ago".padEnd(13) + u.padEnd(29) + u.replace(".timer", ".service"));
      });
      var count = rows.length - 1;
      rows.push("", count + " timer" + (count === 1 ? "" : "s") + " listed. (A real host also lists logrotate.timer and friends.)");
      return ok(asText(rows));
    }
    if (sub === "cat") {
      var text = unitText(state, unit);
      if (text == null) return bad("No files found for " + unit + ".");
      return ok("# /etc/systemd/system/" + unit + "\n" + text);
    }
    if (sub === "status" || sub === "is-active" || sub === "is-enabled") {
      if (!unit) return ok("● lab\n    State: running\n    Units: 212 loaded\n     Jobs: 0 queued\n   Failed: 0 units\n");
      var info = state.units[unit];
      if (!info && unitText(state, unit) == null) return bad("Unit " + unit + " could not be found.", 4);
      info = info || (state.units[unit] = { enabled: false, active: false });
      if (sub === "is-active") return info.active ? ok("active\n") : ok("inactive\n", 3);
      if (sub === "is-enabled") return info.enabled ? ok("enabled\n") : ok("disabled\n", 1);
      var desc = ((unitText(state, unit) || "").match(/Description=(.+)/) || [0, unit])[1];
      var lines = ["● " + unit + " - " + desc, "     Loaded: loaded (/etc/systemd/system/" + unit + "; " + (info.enabled ? "enabled" : "disabled") + "; preset: enabled)"];
      if (/\.timer$/.test(unit)) {
        var cal2 = (unitText(state, unit) || "").match(/OnCalendar=(.+)/);
        lines.push("     Active: " + (info.active ? "active (waiting) since Mon 2026-11-02 06:00:11 UTC; 3h ago" : "inactive (dead)"));
        if (info.active) lines.push("    Trigger: " + fmtDate(calendarNext(cal2 ? cal2[1].trim() : "daily"), { off: 0, abbr: "UTC" }, "%a %F %T %Z"), "   Triggers: ● " + unit.replace(".timer", ".service"));
      } else {
        lines.push("     Active: inactive (dead) since Mon 2026-11-02 02:30:09 UTC; 6h ago", "TriggeredBy: ● " + unit.replace(".service", ".timer"), "    Process: 2210 ExecStart=/usr/local/bin/backup.sh /home /srv/backup 7 (code=exited, status=0/SUCCESS)");
      }
      return ok(asText(lines), info.active || /\.service$/.test(unit) ? 0 : 3);
    }
    if (["start", "stop", "enable", "disable", "restart", "daemon-reload"].indexOf(sub) !== -1) {
      var denied = needRoot(state, "systemctl", argv, "Failed to " + sub + " " + unit + ": Access denied. (Interactive authentication required.)");
      if (denied) return denied;
      if (sub === "daemon-reload") return ok("");
      if (unitText(state, unit) == null) return bad("Failed to " + sub + " " + unit + ": Unit " + unit + " not found.");
      var u2 = state.units[unit] = state.units[unit] || { enabled: false, active: false };
      var out = "";
      if (sub === "enable") { u2.enabled = true; out = "Created symlink /etc/systemd/system/timers.target.wants/" + unit + " → /etc/systemd/system/" + unit + ".\n"; if (argv.indexOf("--now") !== -1) u2.active = true; }
      if (sub === "disable") { u2.enabled = false; out = "Removed \"/etc/systemd/system/timers.target.wants/" + unit + "\".\n"; if (argv.indexOf("--now") !== -1) u2.active = false; }
      if (sub === "start" || sub === "restart") u2.active = /\.timer$/.test(unit);
      if (sub === "stop") u2.active = false;
      return ok(out);
    }
    return bad("systemctl: this lab knows status, cat, list-timers, start, stop, enable, disable, daemon-reload, is-active, is-enabled");
  }
  function calendarNext(spec) {
    var s = spec.trim();
    var short = { daily: "*-*-* 00:00:00", hourly: "*-*-* *:00:00", weekly: "Mon *-*-* 00:00:00", monthly: "*-*-01 00:00:00" }[s];
    if (short) s = short;
    var m = s.match(/(?:([A-Za-z,.]+)\s+)?(?:(\*|\d{4})-(\*|\d{1,2})-(\*|\d{1,2})\s+)?(\*|\d{1,2}):(\*|\d{1,2})(?::(\d{1,2}))?/);
    if (!m) return BASE_TIME + 86400000;
    m[3] = m[3] || "*";
    m[4] = m[4] || "*";
    if (m[1]) {
      var names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      m[1] = m[1].split(",").map(function (part) {
        var r = part.split("..");
        if (r.length !== 2) return part;
        var a = names.indexOf(r[0].slice(0, 3)), b = names.indexOf(r[1].slice(0, 3)), out = [];
        for (var k = a; a !== -1 && b !== -1; k = (k + 1) % 7) { out.push(names[k]); if (k === b) break; }
        return out.join(",");
      }).join(",");
    }
    for (var t = Math.floor(BASE_TIME / 60000) * 60000 + 60000; t < BASE_TIME + 400 * 86400000; t += 60000) {
      var d = new Date(t);
      if (m[5] !== "*" && d.getUTCHours() !== Number(m[5])) { t = Math.floor(t / 3600000) * 3600000 + 3600000 - 60000; continue; }
      if (m[6] !== "*" && d.getUTCMinutes() !== Number(m[6])) continue;
      if (m[4] !== "*" && d.getUTCDate() !== Number(m[4])) continue;
      if (m[3] !== "*" && d.getUTCMonth() + 1 !== Number(m[3])) continue;
      if (m[1]) {
        var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
        if (m[1].split(/[,.]+/).every(function (x) { return x.slice(0, 3) !== day; })) continue;
      }
      return Math.floor(t / 60000) * 60000 + (m[7] ? Number(m[7]) * 1000 : 0);
    }
    return BASE_TIME + 86400000;
  }
  function humanLeft(ms) {
    var mins = Math.round(ms / 60000);
    if (mins < 60) return mins + "min left";
    var h = Math.floor(mins / 60);
    if (h < 48) return h + "h " + (mins % 60) + "min left";
    return Math.floor(h / 24) + " days left";
  }
  function cmdAnalyze(state, argv) {
    if (argv[0] !== "calendar" || !argv[1]) return bad("Usage: systemd-analyze calendar '*-*-* 02:30:00'");
    var spec = argv.slice(1).join(" ");
    var next = calendarNext(spec);
    var norm = { daily: "*-*-* 00:00:00", hourly: "*-*-* *:00:00", weekly: "Mon *-*-* 00:00:00", monthly: "*-*-01 00:00:00" }[spec] || spec;
    return ok("  Original form: " + spec + "\nNormalized form: " + norm + "\n    Next elapse: " + fmtDate(next, { off: 0, abbr: "UTC" }, "%a %F %T %Z") + "\n       From now: " + humanLeft(next - BASE_TIME).replace(" left", "") + "\n");
  }
  function cmdJournalctl(state, argv) {
    var unit = argv[argv.indexOf("-u") + 1];
    if (argv.indexOf("-u") === -1) return ok("Nov 02 09:00:01 lab CRON[812]: (ana) CMD (du -sh /home/ana/work)\nNov 02 09:04:01 lab sshd[412]: Accepted publickey for ana from 192.0.2.5\n");
    if (/backup/.test(unit)) return ok("Nov 02 02:30:04 lab systemd[1]: Starting backup.service - Nightly backup of /home...\nNov 02 02:30:09 lab backup.sh[2210]: saved /srv/backup/home-2026-11-02.tar.gz\nNov 02 02:30:09 lab systemd[1]: backup.service: Deactivated successfully.\nNov 02 02:30:09 lab systemd[1]: Finished backup.service - Nightly backup of /home.\n");
    return ok("-- No entries --\n");
  }

  function procList(state) {
    var rows = [
      { user: "root", pid: 1, ni: 0, cpu: "0.0", mem: "0.1", cmd: "systemd" },
      { user: "root", pid: 412, ni: 0, cpu: "0.0", mem: "0.2", cmd: "sshd" },
      { user: "ana", pid: 880, ni: 0, cpu: "2.0", mem: "1.1", cmd: "app" },
      { user: "ana", pid: 901, ni: 0, cpu: "0.0", mem: "0.4", cmd: "bash" }
    ];
    state.procNice = state.procNice || {};
    rows.forEach(function (r) { if (state.procNice[r.pid] != null) r.ni = state.procNice[r.pid]; });
    state.jobs.forEach(function (j) { rows.push({ user: state.user === "root" ? "ana" : state.user, pid: j.pid, ni: j.ni || 0, cpu: "0.0", mem: "0.0", cmd: j.cmd, stat: j.state === "Stopped" ? "T" : "S" }); });
    (state.killed || []).forEach(function (pid) { rows = rows.filter(function (r) { return r.pid !== pid; }); });
    return rows;
  }
  function cmdPs2(state, argv) {
    var flags = argv.join(" ");
    var rows = procList(state);
    var o = argv.indexOf("-o") !== -1 ? argv[argv.indexOf("-o") + 1] : null;
    if (o) {
      var cols = o.split(",");
      var head = cols.map(function (c) {
        var label = { comm: "COMMAND", args: "COMMAND", cmd: "CMD" }[c] || c.toUpperCase();
        if (c === "pid") return label.padStart(5);
        if (c === "ni") return label.padStart(3);
        if (c === "user") return label.padEnd(4);
        return label;
      }).join("  ");
      return ok(asText([head].concat(rows.map(function (r) {
        return cols.map(function (c) { return { pid: String(r.pid).padStart(5), ni: String(r.ni).padStart(3), comm: r.cmd.split(" ")[0], user: r.user, "%cpu": r.cpu, "%mem": r.mem, args: r.cmd, cmd: r.cmd, stat: r.stat || "S" }[c] || "?"; }).join("  ");
      }))));
    }
    if (/aux|-ef|-e|ax/.test(flags) || !argv.length) {
      return ok(asText(["USER       PID %CPU %MEM  NI STAT COMMAND"].concat(rows.map(function (r) {
        return r.user.padEnd(8) + String(r.pid).padStart(6) + r.cpu.padStart(5) + r.mem.padStart(5) + String(r.ni).padStart(4) + " " + ((r.stat || (r.ni > 0 ? "SN" : r.ni < 0 ? "S<" : "S")).padEnd(4)) + " " + r.cmd;
      }))));
    }
    return ok(asText(["USER PID %CPU %MEM COMMAND"].concat(rows.map(function (r) { return r.user + "  " + r.pid + "  " + r.cpu + "  " + r.mem + " " + r.cmd; }))));
  }
  function cmdTop2(state, argv) {
    var rows = procList(state);
    var head = "top - 09:04:01 up 3 days,  4:12,  1 user,  load average: 0.15, 0.10, 0.08\nTasks:  " + rows.length + " total,   1 running,  " + (rows.length - 1) + " sleeping,   0 stopped,   0 zombie\n%Cpu(s):  2.1 us,  0.4 sy,  0.0 ni, 97.3 id,  0.2 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :   3891.2 total,   2150.4 free,   1228.8 used,    512.0 buff/cache\nMiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2420.1 avail Mem\n\n";
    var table = "    PID USER      PR  NI    VIRT    RES  %CPU  %MEM COMMAND\n" + rows.slice().sort(function (a, b) { return Number(b.cpu) - Number(a.cpu); }).map(function (r) {
      return String(r.pid).padStart(7) + " " + r.user.padEnd(9) + String(20 + r.ni).padStart(3) + String(r.ni).padStart(4) + "  223412  11264" + r.cpu.padStart(6) + r.mem.padStart(6) + " " + r.cmd.split(" ")[0];
    }).join("\n") + "\n";
    var note = argv.indexOf("-b") !== -1 ? "" : "\nlab: this is one frame. A real top redraws every 3 seconds until you press q.\nKeys on a real host: P sort by CPU, M sort by memory, k kill, r renice, 1 per-CPU, q quit.\n";
    return ok(head + table + note);
  }
  function cmdNice(state, argv) {
    if (!argv.length) return ok("0\n");
    var n = 10;
    var args = argv.slice();
    if (args[0] === "-n") { n = Number(args[1]); args = args.slice(2); }
    else if (/^-\d+$/.test(args[0])) { n = Number(args[0].slice(1)); args = args.slice(1); }
    else if (/^--\d+$/.test(args[0])) { n = -Number(args[0].slice(2)); args = args.slice(1); }
    var warn = "";
    if (n < 0 && state.user !== "root") { warn = "nice: cannot set niceness: Permission denied\n"; n = 0; }
    if (!args.length) return ok(String(n) + "\n");
    var res = runLine(state, args.join(" "));
    return { stdout: res.stdout, stderr: warn + (res.stderr || ""), code: res.code, clear: false };
  }
  function cmdRenice(state, argv) {
    var args = argv.filter(function (a) { return a !== "-p" && a !== "-n"; });
    var value = Number(args[0]);
    var pids = args.slice(1).map(Number);
    if (isNaN(value) || !pids.length) return bad("Usage: renice -n 5 -p 880");
    var rows = procList(state);
    var out = [], err = [];
    pids.forEach(function (pid) {
      var r = rows.filter(function (x) { return x.pid === pid; })[0];
      if (!r) { err.push("renice: failed to get priority for " + pid + " (process ID): No such process"); return; }
      if (state.user !== "root" && (r.user !== state.user || value < r.ni)) { err.push("renice: failed to set priority for " + pid + " (process ID): Permission denied"); return; }
      state.procNice[pid] = value;
      state.jobs.forEach(function (j) { if (j.pid === pid) j.ni = value; });
      out.push(pid + " (process ID) old priority " + r.ni + ", new priority " + value);
    });
    return { stdout: asText(out), stderr: asText(err), code: err.length ? 1 : 0, clear: false };
  }
  function findJob(state, spec) {
    if (!state.jobs.length) return null;
    if (!spec || spec === "%" || spec === "%+" || spec === "%%") return state.jobs[state.jobs.length - 1];
    var n = Number(String(spec).replace("%", ""));
    return state.jobs.filter(function (j) { return j.num === n; })[0] || null;
  }
  function cmdJobs(state, argv) {
    var withPid = argv.indexOf("-l") !== -1;
    return ok(asText(state.jobs.map(function (j, i) {
      var mark = i === state.jobs.length - 1 ? "+" : i === state.jobs.length - 2 ? "-" : " ";
      return "[" + j.num + "]" + mark + "  " + (withPid ? j.pid + " " : "") + j.state.padEnd(24) + j.cmd + (j.state === "Running" ? " &" : "");
    })));
  }
  function cmdFg(state, argv, bg) {
    var job = findJob(state, argv[0]);
    if (!job) return bad((bg ? "bg" : "fg") + ": " + (argv[0] || "current") + ": no such job");
    if (bg) { job.state = "Running"; return ok("[" + job.num + "]+ " + job.cmd + " &\n"); }
    state.jobs = state.jobs.filter(function (j) { return j !== job; });
    return ok(job.cmd + "\nlab: the job is in the foreground now. The lab lets it finish at once; on a real host you would wait, or press Ctrl+Z to stop it again.\n");
  }
  function cmdKill2(state, argv) {
    var sig = "TERM";
    var targets = [];
    if (argv[0] === "-l") return ok(" 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 9) SIGKILL\n15) SIGTERM\t18) SIGCONT\t19) SIGSTOP\t20) SIGTSTP\n");
    argv.forEach(function (a) {
      if (/^-(9|KILL|SIGKILL)$/.test(a)) sig = "KILL";
      else if (/^-(15|TERM|SIGTERM)$/.test(a)) sig = "TERM";
      else if (/^-(19|STOP|SIGSTOP)$/.test(a)) sig = "STOP";
      else if (/^-(18|CONT|SIGCONT)$/.test(a)) sig = "CONT";
      else if (/^-(1|HUP|SIGHUP)$/.test(a)) sig = "HUP";
      else if (a === "-s") { }
      else if (/^[A-Z]+$/.test(a)) sig = a.replace(/^SIG/, "");
      else targets.push(a);
    });
    if (!targets.length) return bad("kill: usage: kill [-s sigspec | -signum] pid | jobspec ... or kill -l");
    var out = [], err = [];
    targets.forEach(function (t) {
      if (t.charAt(0) === "%") {
        var job = findJob(state, t);
        if (!job) { err.push("bash: kill: " + t + ": no such job"); return; }
        if (sig === "STOP") { job.state = "Stopped"; out.push("[" + job.num + "]+  Stopped                 " + job.cmd); return; }
        if (sig === "CONT") { job.state = "Running"; return; }
        state.jobs = state.jobs.filter(function (j) { return j !== job; });
        out.push("[" + job.num + "]+  " + (sig === "KILL" ? "Killed" : "Terminated").padEnd(24) + job.cmd);
        return;
      }
      var pid = Number(t);
      if (pid === 1) { err.push("bash: kill: (1) - Operation not permitted"); return; }
      var row = procList(state).filter(function (r) { return r.pid === pid; })[0];
      if (!row) { err.push("bash: kill: (" + t + ") - No such process"); return; }
      if (row.user !== state.user && state.user !== "root") { err.push("bash: kill: (" + t + ") - Operation not permitted"); return; }
      var jobHit = state.jobs.filter(function (j) { return j.pid === pid; })[0];
      if (jobHit) {
        state.jobs = state.jobs.filter(function (j) { return j !== jobHit; });
        out.push("[" + jobHit.num + "]+  " + (sig === "KILL" ? "Killed" : "Terminated").padEnd(24) + jobHit.cmd);
      } else if (sig === "TERM" || sig === "KILL") {
        state.killed = (state.killed || []).concat([pid]);
        if (row.cmd === "bash") out.push("lab: that was your own shell. A real terminal would close. The lab keeps going.");
      }
    });
    return { stdout: asText(out), stderr: asText(err), code: err.length ? 1 : 0, clear: false };
  }
  function cmdSessions(state, tool, argv) {
    state.sessions = state.sessions || { screen: [], tmux: [] };
    var list = state.sessions[tool];
    var nameAfter = function (flag) {
      var i = argv.indexOf(flag);
      if (i === -1) argv.forEach(function (a, k) { if (i === -1 && /^-[a-zA-Z]+$/.test(a) && a.slice(-1) === flag.slice(1)) i = k; });
      return i === -1 ? null : argv[i + 1];
    };
    if (argv.some(function (a) { return /^-[dmS]{3}$/.test(a); })) argv = argv.concat(["-d", "-m"]);
    if (tool === "screen") {
      if (argv.indexOf("-ls") !== -1 || argv.indexOf("-list") !== -1) {
        if (!list.length) return ok("No Sockets found in /run/screen/S-" + state.user + ".\n\n", 1);
        return ok("There " + (list.length === 1 ? "is a screen" : "are screens") + " on:\n" + list.map(function (s) { return "\t" + s.pid + "." + s.name + "\t(11/02/2026 09:04:01 AM)\t(Detached)"; }).join("\n") + "\n" + list.length + " Socket" + (list.length === 1 ? "" : "s") + " in /run/screen/S-" + state.user + ".\n\n");
      }
      if (argv.indexOf("-r") !== -1 || argv.indexOf("-x") !== -1) {
        var want = nameAfter("-r") || nameAfter("-x");
        var hit = list.filter(function (s) { return !want || s.name === want || String(s.pid) === want; });
        if (!hit.length) return bad("There is no screen to be resumed" + (want ? " matching " + want : "") + ".");
        return ok("lab: on a real host you are now inside screen session " + hit[0].name + ". Detach again with Ctrl-a d.\n");
      }
      if (argv.indexOf("-X") !== -1 && argv.indexOf("quit") !== -1) {
        var target = nameAfter("-S");
        var left = list.filter(function (s) { return s.name !== target; });
        if (left.length === list.length) return bad("No screen session found.");
        state.sessions.screen = left;
        return ok("");
      }
      var name = nameAfter("-S") || "pts-0.lab";
      list.push({ name: name, pid: 5200 + list.length * 11 });
      var detached = argv.indexOf("-dm") !== -1 || (argv.indexOf("-d") !== -1 && argv.indexOf("-m") !== -1);
      return ok(detached ? "" : "lab: screen would now fill the terminal with session " + name + ". This practice terminal records it as detached.\nKeys inside screen: Ctrl-a c new window, Ctrl-a n next, Ctrl-a d detach, Ctrl-a ? help.\nList it with: screen -ls\n");
    }
    var sub = argv[0] || "new-session";
    var aliases = { new: "new-session", ls: "list-sessions", a: "attach", at: "attach", "attach-session": "attach", kill: "kill-session" };
    sub = aliases[sub] || sub;
    var server = "no server running on /tmp/tmux-1000/default";
    if (sub === "list-sessions") {
      if (!list.length) return bad(server);
      return ok(asText(list.map(function (s) { return s.name + ": " + s.windows + " windows (created Mon Nov  2 09:04:01 2026)" + (s.shared ? " (attached)" : ""); })));
    }
    if (sub === "new-session") {
      var nm = nameAfter("-s") || String(list.length);
      if (list.some(function (s) { return s.name === nm; })) return bad("duplicate session: " + nm);
      list.push({ name: nm, windows: 1 });
      return ok(argv.indexOf("-d") !== -1 ? "" : "lab: tmux would now fill the terminal with session " + nm + ". This practice terminal records it as detached.\nKeys inside tmux: Ctrl-b c new window, Ctrl-b % split left/right, Ctrl-b \" split top/bottom, Ctrl-b d detach.\n");
    }
    if (!list.length) return bad(server);
    var t = nameAfter("-t");
    var found = list.filter(function (s) { return !t || s.name === t.split(":")[0]; })[0];
    if (!found) return bad("can't find session: " + t);
    if (sub === "attach") return ok("lab: on a real host you are now inside tmux session " + found.name + ". Detach with Ctrl-b d.\n");
    if (sub === "kill-session") { state.sessions.tmux = list.filter(function (s) { return s !== found; }); return ok(""); }
    if (sub === "kill-server") { state.sessions.tmux = []; return ok(""); }
    if (sub === "new-window") { found.windows++; return ok(""); }
    if (sub === "rename-session") { found.name = argv[argv.length - 1]; return ok(""); }
    if (sub === "split-window" || sub === "select-pane" || sub === "resize-pane" || sub === "send-keys") return ok("");
    if (sub === "source-file") {
      var conf = resolve(state, argv[1] || "~/.tmux.conf");
      return state.files[conf] ? ok("") : bad("/home/ana/.tmux.conf: No such file or directory");
    }
    if (sub === "show-options") return ok("prefix C-b\nmouse off\nbase-index 0\nhistory-limit 2000\n");
    return bad("tmux: this lab knows new, ls, attach, kill-session, new-window, split-window, rename-session, source-file");
  }
  function cmdEnv(state, argv, stdin) {
    if (argv.length && /^[A-Za-z_]\w*=/.test(argv[0])) {
      var saved = {};
      var savedExp = {};
      state.exported = state.exported || {};
      var i = 0;
      for (; i < argv.length && /^[A-Za-z_]\w*=/.test(argv[i]); i++) {
        var k = argv[i].slice(0, argv[i].indexOf("="));
        saved[k] = state.env[k];
        savedExp[k] = state.exported[k];
        state.env[k] = argv[i].slice(k.length + 1);
        state.exported[k] = true;
      }
      var res = argv.length > i ? runLine(state, argv.slice(i).join(" ")) : cmdEnv(state, [], stdin);
      Object.keys(saved).forEach(function (key) {
        if (saved[key] == null) delete state.env[key]; else state.env[key] = saved[key];
        if (!savedExp[key]) delete state.exported[key];
      });
      return res;
    }
    var exported = state.exported || {};
    var keys = Object.keys(state.env).filter(function (k) { return exported[k]; });
    return ok(asText(keys.map(function (k) { return k + "=" + state.env[k]; })));
  }
  function cmdPrintenv(state, argv) {
    if (!argv.length) return cmdEnv(state, [], "");
    var out = [];
    var missing = false;
    argv.forEach(function (k) { if (state.env[k] == null) missing = true; else out.push(state.env[k]); });
    return ok(asText(out), missing ? 1 : 0);
  }
  function cmdCommand(state, argv, stdin) {
    if (argv[0] === "-v" || argv[0] === "-V") {
      var name = argv[1];
      if (!name) return ok("", 1);
      if (state.aliases[name]) return ok(argv[0] === "-v" ? "alias " + name + "='" + state.aliases[name] + "'\n" : name + " is aliased to `" + state.aliases[name] + "'\n");
      if (state.fns[name]) return ok(argv[0] === "-v" ? name + "\n" : name + " is a function\n");
      if (BUILTIN[name]) return ok(argv[0] === "-v" ? name + "\n" : name + " is a shell builtin\n");
      if (visible(state, name)) return ok(argv[0] === "-v" ? "/usr/bin/" + name + "\n" : name + " is /usr/bin/" + name + "\n");
      return argv[0] === "-v" ? ok("", 1) : bad("bash: command: " + name + ": not found");
    }
    var cmd = argv[0];
    if (!cmd) return ok("");
    if (!BUILTIN[cmd] && !visible(state, cmd)) return bad("bash: " + cmd + ": command not found", 127);
    if (cmd === "[") return testCmd(state, argv.slice(1), "]");
    return COMMANDS[cmd] ? COMMANDS[cmd](state, argv.slice(1), stdin || "") : bad("bash: " + cmd + ": command not found", 127);
  }
  function cmdWhich(state, argv) {
    var all = argv.indexOf("-a") !== -1;
    var names = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    var out = [];
    var missing = false;
    names.forEach(function (n) {
      var onPath = String(state.env.PATH || "").split(":").indexOf("/usr/bin") !== -1 && COMMANDS[n] && (!BUILTIN[n] || ON_DISK_TOO[n]);
      if (onPath) { out.push("/usr/bin/" + n); if (all) out.push("/bin/" + n); }
      else missing = true;
    });
    return ok(asText(out), missing ? 1 : 0);
  }

  function freshDisks() {
    return {
      sda: { size: 21, rm: 0, model: "LAB SSD 21G", serial: "LAB0001", table: "gpt", parts: [
        { name: "sda1", size: 1, fs: "ext4", uuid: "8a2d4e61-0c3f-4b59-8e7a-1f9c3d5b2a77", label: "", partlabel: "", fixed: true },
        { name: "sda2", size: 20, fs: "ext4", uuid: "3f1c2a9e-5b7d-4c11-9a0e-6d2f8b1e7c40", label: "", partlabel: "", fixed: true }
      ] },
      sdb: { size: 14.9, rm: 1, model: "USB Flash Disk", serial: "USB4E219F0A", table: "msdos", parts: [
        { name: "sdb1", size: 14.9, fs: "vfat", uuid: "4E21-9F0A", label: "USBSTICK", partlabel: "", store: { "photos": { kind: "dir" }, "photos/trip.jpg": { kind: "file", text: "jpeg bytes\n" }, "readme.txt": { kind: "file", text: "files from the USB stick\n" } } }
      ] },
      sdc: { size: 10, rm: 0, model: "LAB HDD 10G", serial: "SN1001", table: null, parts: [] },
      sdd: { size: 10, rm: 0, model: "LAB HDD 10G", serial: "SN1002", table: null, parts: [] },
      sde: { size: 10, rm: 0, model: "LAB HDD 10G", serial: "SN1003", table: null, parts: [] },
      sdf: { size: 10, rm: 0, model: "LAB HDD 10G", serial: "SN1004", table: null, parts: [] }
    };
  }
  function sysState(state) {
    if (!state.sys) {
      state.sys = { disks: freshDisks(), mounts: [], lvm: { pvs: {}, vgs: {}, lvs: {} }, zfs: { pools: {}, sets: {}, snaps: {} }, luks: {}, maps: {}, raw: {} };
    }
    return state.sys;
  }
  function gfmt(n) {
    if (n < 1) return Math.round(n * 1024) + "M";
    return (Math.round(n * 10) / 10) + "G";
  }
  function devName(spec) { return String(spec || "").replace(/^\/dev\//, ""); }
  function byIdTarget(state, spec) {
    var m = String(spec).match(/by-id\/(.+)$/);
    if (!m) return null;
    var sys = sysState(state);
    var found = null;
    Object.keys(sys.disks).forEach(function (d) { if (m[1].indexOf(sys.disks[d].serial) !== -1) found = d; });
    return found;
  }
  function mapperName(key) {
    return key.split("/").map(function (x) { return x.replace(/-/g, "--"); }).join("-");
  }
  function mapperKey(name) {
    var s = String(name).replace(/--/g, "\u0000");
    var at = s.indexOf("-");
    if (at === -1) return s.replace(/\u0000/g, "-");
    return (s.slice(0, at) + "/" + s.slice(at + 1)).replace(/\u0000/g, "-");
  }
  function blockDev(state, spec) {
    var sys = sysState(state);
    var s = String(spec || "");
    var viaId = byIdTarget(state, s);
    if (viaId) s = "/dev/" + viaId;
    var label = s.match(/^(?:LABEL=|\/dev\/disk\/by-label\/)(.+)$/);
    var uuid = s.match(/^(?:UUID=|\/dev\/disk\/by-uuid\/)(.+)$/);
    var hit = null;
    Object.keys(sys.disks).forEach(function (d) {
      var disk = sys.disks[d];
      if (s === "/dev/" + d) hit = { kind: "disk", name: d, obj: disk, size: disk.size };
      disk.parts.forEach(function (p) {
        if (s === "/dev/" + p.name || (label && p.label === label[1]) || (uuid && p.uuid === uuid[1])) hit = { kind: "part", name: p.name, obj: p, size: p.size, disk: d };
      });
      if (!hit && disk.fs && ((label && disk.label === label[1]) || (uuid && disk.uuid === uuid[1]))) hit = { kind: "disk", name: d, obj: disk, size: disk.size };
    });
    if (hit) return hit;
    var lvk = null;
    var direct = s.match(/^\/dev\/([\w.+-]+)\/([\w.+-]+)$/);
    if (direct && direct[1] !== "mapper" && direct[1] !== "disk") lvk = direct[1] + "/" + direct[2];
    var viaMapper = s.match(/^\/dev\/mapper\/([\w.+-]+)$/);
    if (viaMapper) lvk = mapperKey(viaMapper[1]);
    if (lvk && sys.lvm.lvs[lvk]) {
      var lv = sys.lvm.lvs[lvk];
      return { kind: "lv", name: mapperName(lvk), obj: lv, size: lv.size / 256 };
    }
    var mp = s.match(/^\/dev\/mapper\/([\w.-]+)$/);
    if (mp && sys.maps[mp[1]]) return { kind: "crypt", name: mp[1], obj: sys.maps[mp[1]], size: sys.maps[mp[1]].size };
    return null;
  }
  function holderOf(state, name) {
    var sys = sysState(state);
    if (sys.lvm.pvs["/dev/" + name]) return "LVM physical volume";
    var pool = Object.keys(sys.zfs.pools).filter(function (p) { return sys.zfs.pools[p].devs.indexOf(name) !== -1; })[0];
    if (pool) return "ZFS pool " + pool;
    if (sys.luks["/dev/" + name]) return "LUKS container";
    return null;
  }
  function mountedAt(state, devname) {
    return sysState(state).mounts.filter(function (m) { return m.devname === devname; })[0] || null;
  }
  function stashMount(state, dir) {
    var store = {};
    Object.keys(state.files).forEach(function (k) {
      if (k.indexOf(dir + "/") === 0) { store[k.slice(dir.length + 1)] = state.files[k]; delete state.files[k]; }
    });
    return store;
  }
  function unstash(state, dir, store) {
    Object.keys(store || {}).sort().forEach(function (rel) {
      var n = store[rel];
      state.files[dir + "/" + rel] = n.mode != null ? n : (n.kind === "dir" ? { kind: "dir", mode: 493, owner: "root", group: "root", text: "" } : { kind: "file", mode: 420, owner: "root", group: "root", text: n.text });
    });
  }
  function cmdLsblk(state, argv) {
    var sys = sysState(state);
    var withFs = argv.indexOf("-f") !== -1;
    var cols = argv.indexOf("-o") !== -1 ? argv[argv.indexOf("-o") + 1].toUpperCase().split(",") : null;
    var rows = [];
    function mountOf(name) {
      if (name === "sda1") return "/boot";
      if (name === "sda2") return "/";
      var m = mountedAt(state, name);
      return m ? m.dir : "";
    }
    function add(prefix, name, size, rm, type, fsType, label, uuid, partlabel) {
      rows.push({ NAME: prefix + name, "MAJ:MIN": "8:" + rows.length * 16, RM: String(rm), SIZE: gfmt(size), RO: "0", TYPE: type, MOUNTPOINTS: mountOf(name), FSTYPE: fsType || "", LABEL: label || "", UUID: uuid || "", PARTLABEL: partlabel || "", MODEL: "" });
    }
    Object.keys(sys.disks).forEach(function (d) {
      var disk = sys.disks[d];
      var pool = holderOf(state, d);
      add("", d, disk.size, disk.rm, "disk", disk.fs || (sys.lvm.pvs["/dev/" + d] ? "LVM2_member" : pool && pool.indexOf("ZFS") === 0 ? "zfs_member" : sys.luks["/dev/" + d] ? "crypto_LUKS" : ""), disk.label, disk.uuid);
      rows[rows.length - 1].MODEL = disk.model;
      var kids = disk.parts.map(function (p) { return { p: p }; });
      Object.keys(sys.lvm.lvs).forEach(function (key) {
        var lv = sys.lvm.lvs[key];
        if (lv.segs.some(function (s) { return s.pv === "/dev/" + d; })) kids.push({ lv: lv, key: key });
      });
      Object.keys(sys.maps).forEach(function (mname) { if (sys.maps[mname].dev === "/dev/" + d) kids.push({ map: mname }); });
      kids.forEach(function (k, i) {
        var pre = i === kids.length - 1 ? "└─" : "├─";
        if (k.p) add(pre, k.p.name, k.p.size, disk.rm, "part", k.p.fs, k.p.label, k.p.uuid, k.p.partlabel);
        else if (k.lv) add(pre, mapperName(k.key), k.lv.size / 256, 0, k.lv.type === "linear" ? "lvm" : k.lv.type, k.lv.fs, "", k.lv.uuid);
        else add(pre, k.map, sys.maps[k.map].size, 0, "crypt", sys.maps[k.map].fs, "", "");
      });
    });
    var show = cols || (withFs ? ["NAME", "FSTYPE", "LABEL", "UUID", "MOUNTPOINTS"] : ["NAME", "MAJ:MIN", "RM", "SIZE", "RO", "TYPE", "MOUNTPOINTS"]);
    if (argv.indexOf("-d") !== -1) rows = rows.filter(function (r) { return r.TYPE === "disk"; });
    var widths = show.map(function (c) { return Math.max(c.length, Math.max.apply(null, rows.map(function (r) { return String(r[c] || "").length; }))); });
    var lines = [show.map(function (c, i) { return c.padEnd(widths[i]); }).join(" ").trimEnd()];
    rows.forEach(function (r) { lines.push(show.map(function (c, i) { return String(r[c] || "").padEnd(widths[i]); }).join(" ").trimEnd()); });
    return ok(asText(lines));
  }
  function cmdBlkid(state, argv) {
    var sys = sysState(state);
    var out = [];
    function line(name, o, extra) {
      if (!o.fs && !extra) return;
      var bits = [];
      if (o.label) bits.push('LABEL="' + o.label + '"');
      if (o.uuid) bits.push('UUID="' + o.uuid + '"');
      bits.push('TYPE="' + (extra || o.fs) + '"');
      if (o.partlabel) bits.push('PARTLABEL="' + o.partlabel + '"');
      out.push("/dev/" + name + ": " + bits.join(" "));
    }
    Object.keys(sys.disks).forEach(function (d) {
      var disk = sys.disks[d];
      line(d, disk, sys.lvm.pvs["/dev/" + d] ? "LVM2_member" : sys.luks["/dev/" + d] ? "crypto_LUKS" : holderOf(state, d) ? "zfs_member" : null);
      disk.parts.forEach(function (p) { line(p.name, p); });
    });
    Object.keys(sys.lvm.lvs).forEach(function (k) { if (sys.lvm.lvs[k].fs) out.push("/dev/mapper/" + mapperName(k) + ': UUID="' + sys.lvm.lvs[k].uuid + '" TYPE="' + sys.lvm.lvs[k].fs + '"'); });
    Object.keys(sys.maps).forEach(function (m) { if (sys.maps[m].fs) out.push("/dev/mapper/" + m + ': UUID="' + sys.maps[m].uuid + '" TYPE="' + sys.maps[m].fs + '"'); });
    var want = argv.filter(function (a) { return a.charAt(0) === "/"; });
    if (want.length) out = out.filter(function (l) { return want.some(function (w) { return l.indexOf(w + ":") === 0; }); });
    return ok(asText(out), out.length ? 0 : 2);
  }
  function fakeUuid(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    var hex = "";
    for (var k = 0; k < 32; k++) { h = (h * 1103515245 + 12345) >>> 0; hex += (h >>> 24 & 15).toString(16); }
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }
  function cmdMkfs(state, type, argv) {
    var denied = needRoot(state, "mkfs." + type, argv, "Permission denied while trying to determine filesystem size");
    if (denied) return denied;
    var p = parseUserOpts(argv, ["L", "n", "t"]);
    var dev = p.rest[0];
    var quiet = argv.indexOf("-q") !== -1;
    var bd = blockDev(state, dev);
    if (!bd) return bad("mkfs." + type + ": The file " + dev + " does not exist and no size was specified.");
    if (bd.kind === "disk" && bd.obj.parts.length) return bad("mkfs." + type + ": " + dev + " contains a partition table. Format a partition such as " + dev + "1, or wipe it first.");
    var held = bd.kind === "disk" ? holderOf(state, bd.name) : null;
    if (held) return bad("mkfs." + type + ": " + dev + " is in use by a " + held + ".");
    if (mountedAt(state, bd.name)) return bad(dev + " is mounted; will not make a filesystem here!");
    bd.obj.fs = type === "fat" || type === "vfat" ? "vfat" : type;
    bd.obj.fsSize = bd.size;
    bd.obj.uuid = type === "vfat" || type === "fat" ? fakeUuid(dev).slice(0, 4).toUpperCase() + "-" + fakeUuid(dev + "x").slice(0, 4).toUpperCase() : fakeUuid(dev + type + Date.now());
    bd.obj.label = p.opts.L || p.opts.n || "";
    bd.obj.store = {};
    if (type === "ext4") bd.obj.store = { "lost+found": { kind: "dir", mode: 448, owner: "root", group: "root", text: "" } };
    var blocks = Math.round(bd.size * 262144);
    if (quiet) return ok("");
    if (type === "xfs") return ok("meta-data=" + dev + "             isize=512    agcount=4, agsize=" + Math.round(blocks / 4) + " blks\ndata     =                       bsize=4096   blocks=" + blocks + ", imaxpct=25\nlog      =internal log           bsize=4096   blocks=16384, version=2\n");
    if (type === "vfat" || type === "fat") return ok("mkfs.fat 4.2 (2021-01-31)\n");
    return ok("mke2fs 1.47.0 (5-Feb-2023)\nCreating filesystem with " + blocks + " 4k blocks and " + Math.round(blocks / 4) + " inodes\nFilesystem UUID: " + bd.obj.uuid + "\nAllocating group tables: done\nWriting inode tables: done\nCreating journal (16384 blocks): done\nWriting superblocks and filesystem accounting information: done\n");
  }
  function cmdMount(state, argv) {
    var sys = sysState(state);
    var p = parseUserOpts(argv, ["t", "o"]);
    if (!p.rest.length && !p.opts.a) {
      var base0 = ["/dev/sda2 on / type ext4 (rw,relatime)", "/dev/sda1 on /boot type ext4 (rw,relatime)", "tmpfs on /run type tmpfs (rw,nosuid,nodev,size=398436k,mode=755)", "proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)"];
      sys.mounts.forEach(function (m) { base0.push(m.src + " on " + m.dir + " type " + m.fs + " (" + (m.opts || "rw,relatime") + ")"); });
      Object.keys(sys.zfs.sets).forEach(function (n) { if (sys.zfs.sets[n].mounted) base0.push(n + " on " + sys.zfs.sets[n].mountpoint + " type zfs (rw,xattr,noacl)"); });
      return ok(asText(p.opts.t ? base0.filter(function (l) { return l.indexOf("type " + p.opts.t + " ") !== -1; }) : base0));
    }
    var denied = needRoot(state, "mount", argv, "only root can do that");
    if (denied) return denied;
    if (p.opts.a) {
      var errs = [];
      linesOf(state.files["/etc/fstab"].text).forEach(function (l) {
        var t = l.trim();
        if (!t || t.charAt(0) === "#") return;
        var f = t.split(/\s+/);
        if (f[1] === "/" || f[1] === "/boot" || f[1] === "none" || f[1] === "swap") return;
        if (sys.mounts.some(function (m) { return m.dir === f[1]; })) return;
        var r = doMount(state, f[0], f[1], f[3]);
        if (r.code && !/nofail/.test(f[3] || "")) errs.push(r.stderr.trim());
      });
      return errs.length ? bad(errs.join("\n"), 32) : ok("");
    }
    var src = p.rest[0], dir = p.rest[1];
    if (!dir) {
      var row = linesOf(state.files["/etc/fstab"].text).map(function (l) { return l.trim().split(/\s+/); }).filter(function (f) { return f[0] && f[0].charAt(0) !== "#" && (f[1] === src || f[0] === src); })[0];
      if (!row) return bad("mount: " + src + ": can't find in /etc/fstab.", 1);
      return doMount(state, row[0], row[1], row[3]);
    }
    return doMount(state, src, dir, p.opts.o);
  }
  function doMount(state, src, dir, opts) {
    var sys = sysState(state);
    var bd = blockDev(state, src);
    var target = resolve(state, dir);
    if (!bd) return bad("mount: " + target + ": special device " + src + " does not exist.", 32);
    if (!state.files[target] || state.files[target].kind !== "dir") return bad("mount: " + target + ": mount point does not exist.", 32);
    if (!bd.obj.fs) return bad("mount: " + target + ": wrong fs type, bad option, bad superblock on " + src + ", missing codepage or helper program, or other error.\nlab: there is no filesystem on " + src + " yet. Make one first, for example: sudo mkfs.ext4 " + src, 32);
    if (mountedAt(state, bd.name)) return bad("mount: " + target + ": " + src + " already mounted on " + mountedAt(state, bd.name).dir + ".", 32);
    if (sys.mounts.some(function (m) { return m.dir === target; })) return bad("mount: " + target + ": a filesystem is already mounted here.", 32);
    var hidden = stashMount(state, target);
    sys.mounts.push({ src: bd.kind === "lv" ? "/dev/mapper/" + bd.name : bd.kind === "crypt" ? "/dev/mapper/" + bd.name : "/dev/" + bd.name, devname: bd.name, dir: target, fs: bd.obj.fs, opts: opts && opts !== "defaults" ? opts : "rw,relatime", hidden: hidden, obj: bd.obj });
    unstash(state, target, bd.obj.store || {});
    if (bd.obj.fs === "vfat") Object.keys(state.files).forEach(function (k) { if (k.indexOf(target + "/") === 0) { state.files[k].owner = "root"; state.files[k].group = "root"; } });
    return ok("");
  }
  function cmdUmount(state, argv) {
    var denied = needRoot(state, "umount", argv, "must be superuser to unmount.");
    if (denied) return denied;
    var sys = sysState(state);
    var spec = argv.filter(function (a) { return a.charAt(0) !== "-"; })[0];
    if (!spec) return bad("umount: bad usage");
    var abs = spec.charAt(0) === "/" && spec.indexOf("/dev/") !== 0 ? resolve(state, spec) : spec;
    var bd = spec.indexOf("/dev/") === 0 ? blockDev(state, spec) : null;
    var m = sys.mounts.filter(function (x) { return x.dir === abs || (bd && x.devname === bd.name); })[0];
    if (!m) return bad("umount: " + spec + ": not mounted.", 32);
    if (state.cwd === m.dir || state.cwd.indexOf(m.dir + "/") === 0) return bad("umount: " + m.dir + ": target is busy.\nlab: your shell is inside it. cd somewhere else first.", 32);
    m.obj.store = stashMount(state, m.dir);
    unstash(state, m.dir, m.hidden);
    sys.mounts = sys.mounts.filter(function (x) { return x !== m; });
    return ok("");
  }
  function cmdFindmnt(state, argv) {
    var sys = sysState(state);
    var rows = [["TARGET", "SOURCE", "FSTYPE", "OPTIONS"], ["/", "/dev/sda2", "ext4", "rw,relatime"], ["├─/boot", "/dev/sda1", "ext4", "rw,relatime"]];
    sys.mounts.forEach(function (m) { rows.push(["├─" + m.dir, m.src, m.fs, m.opts]); });
    Object.keys(sys.zfs.sets).forEach(function (n) { if (sys.zfs.sets[n].mounted) rows.push(["├─" + sys.zfs.sets[n].mountpoint, n, "zfs", "rw,xattr,noacl"]); });
    rows.push(["└─/run", "tmpfs", "tmpfs", "rw,nosuid,nodev"]);
    var want = argv.filter(function (a) { return a.charAt(0) !== "-"; })[0];
    if (want) rows = [rows[0]].concat(rows.slice(1).filter(function (r) { return r[0].replace(/^[├└]─/, "") === resolve(state, want) || r[1] === want; }).map(function (r) { return [r[0].replace(/^[├└]─/, "")].concat(r.slice(1)); }));
    rows = rows.map(function (r) { return r.slice(0, 3).concat([/^(defaults|nofail|,)+$/.test(r[3] || "") || !r[3] ? "rw,relatime" : r[3].replace(/(^|,)(defaults|nofail)(?=,|$)/g, "").replace(/^,/, "") || "rw,relatime"]); });
    if (rows.length === 1) return ok("", 1);
    var w = [0, 1, 2].map(function (i) { return Math.max.apply(null, rows.map(function (r) { return r[i].length; })); });
    return ok(asText(rows.map(function (r) { return r[0].padEnd(w[0]) + " " + r[1].padEnd(w[1]) + " " + r[2].padEnd(w[2]) + " " + r[3]; })));
  }
  function cmdDf2(state, argv) {
    var sys = sysState(state);
    var withType = argv.some(function (a) { return /^-\w*T/.test(a); });
    var inodes = argv.some(function (a) { return /^-\w*i/.test(a); });
    var rows = [
      { fs: "tmpfs", type: "tmpfs", size: "392M", used: "1.1M", avail: "391M", pct: "1%", on: "/run" },
      { fs: "/dev/sda2", type: "ext4", size: "20G", used: "8.2G", avail: "11G", pct: "42%", on: "/" },
      { fs: "tmpfs", type: "tmpfs", size: "2.0G", used: "0", avail: "2.0G", pct: "0%", on: "/dev/shm" },
      { fs: "/dev/sda1", type: "ext4", size: "974M", used: "180M", avail: "727M", pct: "20%", on: "/boot" }
    ];
    sys.mounts.forEach(function (m) {
      var size = (m.obj.fsSize || m.obj.size || 1) * (m.fs === "vfat" ? 1 : 0.97);
      var used = m.obj.usedG != null ? m.obj.usedG : (m.fs === "vfat" ? 0.002 : 0.00003);
      rows.push({ fs: m.src, type: m.fs, size: gfmt(size), used: used < 0.001 ? "24K" : gfmt(used), avail: gfmt(size * (m.fs === "vfat" ? 1 : 0.95) - used), pct: Math.max(1, Math.round(used / size * 100)) + "%", on: m.dir });
    });
    Object.keys(sys.zfs.sets).forEach(function (n) {
      var ds = sys.zfs.sets[n];
      if (!ds.mounted) return;
      var pool = sys.zfs.pools[n.split("/")[0]];
      var avail = ds.quota || pool.usable * 0.96;
      rows.push({ fs: n, type: "zfs", size: gfmt(avail), used: "128K", avail: gfmt(avail), pct: "1%", on: ds.mountpoint });
    });
    var want = argv.filter(function (a) { return a.charAt(0) !== "-"; });
    if (want.length) {
      rows = want.map(function (w) {
        var abs = resolve(state, w);
        var best = null;
        rows.forEach(function (r) { if ((abs === r.on || abs.indexOf(r.on === "/" ? "/" : r.on + "/") === 0) && (!best || r.on.length > best.on.length)) best = r; });
        return best;
      }).filter(Boolean);
    }
    if (inodes) return ok(asText(["Filesystem       Inodes  IUsed   IFree IUse% Mounted on"].concat(rows.map(function (r) { return r.fs.padEnd(15) + "1310720".padStart(8) + " 201544".padStart(7) + " 1109176".padStart(8) + "   16% " + r.on; }))));
    var fw = Math.max.apply(null, [15].concat(rows.map(function (r) { return r.fs.length; }))) + 1;
    var lines = [("Filesystem").padEnd(fw) + (withType ? "Type   " : "") + " Size  Used Avail Use% Mounted on"];
    rows.forEach(function (r) {
      lines.push(r.fs.padEnd(fw) + (withType ? r.type.padEnd(7) : "") + r.size.padStart(5) + r.used.padStart(6) + r.avail.padStart(6) + r.pct.padStart(5) + " " + r.on);
    });
    return ok(asText(lines));
  }
  function cmdFdisk(state, argv) {
    var denied = needRoot(state, "fdisk", argv, "cannot open " + (argv.filter(function (a) { return a.charAt(0) === "/"; })[0] || "/dev/sda") + ": Permission denied");
    if (denied) return denied;
    var sys = sysState(state);
    if (argv[0] === "-l") {
      var want = argv[1] ? devName(argv[1]) : null;
      var blocks = [];
      Object.keys(sys.disks).filter(function (d) { return !want || d === want; }).forEach(function (d) {
        var disk = sys.disks[d];
        var bytes = Math.round(disk.size * 1073741824);
        var b = ["Disk /dev/" + d + ": " + gfmt(disk.size).replace("G", " GiB") + ", " + bytes + " bytes, " + Math.round(bytes / 512) + " sectors", "Disk model: " + disk.model, "Units: sectors of 1 * 512 = 512 bytes", "Sector size (logical/physical): 512 bytes / 512 bytes"];
        if (disk.table) {
          b.push("Disklabel type: " + (disk.table === "msdos" ? "dos" : "gpt"), "");
          var start = 2048;
          b.push("Device     Start      End  Sectors  Size Type");
          disk.parts.forEach(function (p) {
            var sectors = Math.round(p.size * 2097152) - (start === 2048 ? 2048 : 0);
            b.push(("/dev/" + p.name).padEnd(10) + String(start).padStart(6) + String(start + sectors - 1).padStart(9) + String(sectors).padStart(9) + gfmt(p.size).padStart(6) + " " + (p.fs === "vfat" ? "W95 FAT32 (LBA)" : "Linux filesystem"));
            start += sectors;
          });
        }
        blocks.push(b.join("\n"));
      });
      return ok(blocks.join("\n\n") + "\n");
    }
    return bad("lab: fdisk is interactive (a menu that waits for keys), which this terminal cannot show.\nThe keys on a real host: p print, g new GPT table, o new DOS table, n new partition, t type, d delete, w write and quit, q quit without saving.\nTo practise the same steps here, use parted, which takes the whole job on one line:\n  sudo parted /dev/sdc mklabel gpt\n  sudo parted /dev/sdc mkpart data ext4 1MiB 100%");
  }
  function cmdParted(state, argv) {
    var sys = sysState(state);
    var args = argv.filter(function (a) { return a !== "-s" && a !== "--script" && a !== "-a" && a !== "optimal"; });
    if (args[0] === "-l") args = ["/dev/sda", "print"];
    var dev = devName(args[0]);
    var disk = sys.disks[dev];
    if (!disk) return bad("Error: Could not stat device " + args[0] + " - No such file or directory.");
    var sub = args[1] || "print";
    if (sub !== "print") {
      var denied = needRoot(state, "parted", argv, "Error: Error opening /dev/" + dev + ": Permission denied");
      if (denied) return denied;
    }
    var held = holderOf(state, dev);
    if (sub === "print") {
      var lines = ["Model: " + disk.model + " (scsi)", "Disk /dev/" + dev + ": " + (disk.size * 1.074).toFixed(1) + "GB", "Sector size (logical/physical): 512B/512B", "Partition Table: " + (disk.table || "unknown"), "Disk Flags: ", ""];
      if (!disk.table) return bad("Error: /dev/" + dev + ": unrecognised disk label\n" + lines.slice(0, 3).join("\n"));
      lines.push("Number  Start   End     Size    File system  Name" + (disk.table === "msdos" ? "  Type" : "") + "  Flags");
      var at = 1.05;
      disk.parts.forEach(function (p, i) {
        var size = p.size * 1074;
        lines.push(" " + (i + 1) + "      " + (at.toFixed(0) + "MB").padEnd(8) + ((at + size).toFixed(0) + "MB").padEnd(8) + (size.toFixed(0) + "MB").padEnd(8) + (p.fs || "").padEnd(13) + (p.partlabel || "").padEnd(6));
        at += size;
      });
      return ok(asText(lines));
    }
    if (held) return bad("Error: Partition(s) on /dev/" + dev + " are being used. (" + held + ")");
    if (sub === "mklabel" || sub === "mktable") {
      var kind = args[2];
      if (kind !== "gpt" && kind !== "msdos") return bad("parted: invalid token: " + kind + "\nUse mklabel gpt (modern) or mklabel msdos (old MBR, 4 primary partitions)");
      if (disk.parts.some(function (p) { return mountedAt(state, p.name); })) return bad("Error: Partition(s) on /dev/" + dev + " are being used.");
      var warn = disk.parts.length ? "Warning: The existing disk label on /dev/" + dev + " will be destroyed and all data on this disk will be lost. Do you want to continue?\nYes/No? Yes (the lab answered)\n" : "";
      disk.table = kind;
      disk.parts = [];
      disk.fs = null;
      return ok(warn);
    }
    if (sub === "mkpart") {
      if (!disk.table) return bad("Error: /dev/" + dev + ": unrecognised disk label. Run mklabel gpt first.");
      var rest = args.slice(2);
      if (disk.table === "msdos" && /^(primary|logical|extended)$/.test(rest[0])) rest = rest.slice(1);
      if (/^(ext4|xfs|fat32|linux-swap|btrfs)$/.test(rest[0])) rest.unshift("");
      var name = rest[0], fsHint = rest[1], start = rest[2], end = rest[3];
      if (!start || !end) return bad("Usage: parted /dev/" + dev + " mkpart NAME ext4 1MiB 100%");
      function toG(v) {
        var m = String(v).match(/^([\d.]+)(%|MiB|MB|GiB|GB|s)?$/i);
        if (!m) return null;
        var n = Number(m[1]);
        var u = (m[2] || "MB").toLowerCase();
        return u === "%" ? disk.size * n / 100 : u === "gib" || u === "gb" ? n : u === "s" ? n / 2097152 : n / 1024;
      }
      var a = toG(start), b = toG(end);
      if (a == null || b == null || b <= a) return bad("Error: Invalid partition start or end.");
      var used = disk.parts.reduce(function (t, p) { return t + p.size; }, 0);
      if (a < used - 0.01) return bad("Error: You requested a partition from " + start + " to " + end + ".\nThe closest location we can manage is after the last partition. Start at " + Math.ceil(used * 1024) + "MiB.");
      var size = Math.round(Math.min(b, disk.size) * 10 - a * 10) / 10 || Math.min(b, disk.size) - a;
      disk.parts.push({ name: dev + (disk.parts.length + 1), size: size, fs: null, uuid: "", label: "", partlabel: disk.table === "gpt" ? name : "", hint: fsHint });
      return ok("");
    }
    if (sub === "name") {
      var part = disk.parts[Number(args[2]) - 1];
      if (!part) return bad("Error: Partition doesn't exist.");
      if (disk.table !== "gpt") return bad("Error: msdos disk labels do not support partition names. Use a filesystem label instead: sudo e2label /dev/" + part.name + " NAME");
      part.partlabel = args[3] || "";
      return ok("");
    }
    if (sub === "rm") {
      var idx = Number(args[2]) - 1;
      if (!disk.parts[idx]) return bad("Error: Partition doesn't exist.");
      if (mountedAt(state, disk.parts[idx].name)) return bad("Error: Partition /dev/" + disk.parts[idx].name + " is being used. You must unmount it before you modify it with Parted.");
      disk.parts.splice(idx, 1);
      return ok("");
    }
    return bad("parted: this lab knows print, mklabel (or mktable) gpt|msdos, mkpart, name, rm");
  }
  function cmdLabel(state, tool, argv) {
    var dev = argv[0];
    var bd = blockDev(state, dev);
    if (!bd) return bad(tool + ": No such file or directory while trying to open " + dev);
    if (argv.length < 2) return ok((bd.obj.label || "") + "\n");
    var denied = needRoot(state, tool, argv, "Permission denied while trying to open " + dev);
    if (denied) return denied;
    if (tool === "e2label" && bd.obj.fs !== "ext4") return bad("e2label: Bad magic number in super-block while trying to open " + dev + "\nlab: e2label is for ext2/3/4. FAT uses fatlabel, XFS uses xfs_admin -L.");
    if (tool === "fatlabel" && bd.obj.fs !== "vfat") return bad("fatlabel: " + dev + " is not a FAT filesystem");
    bd.obj.label = tool === "fatlabel" ? argv[1].toUpperCase().slice(0, 11) : argv[1].slice(0, 16);
    return ok("");
  }
  function cmdDd(state, argv) {
    var o = {};
    argv.forEach(function (a) { var eq = a.indexOf("="); if (eq > 0) o[a.slice(0, eq)] = a.slice(eq + 1); });
    if (!o["if"] && !o.of) return bad("dd: this lab needs if= and of=. Example: dd if=/dev/zero of=blank.img bs=1M count=10");
    function bytesOf2(v) {
      var m = String(v || "512").match(/^(\d+)([KMG]?)$/i);
      if (!m) return null;
      return Number(m[1]) * { "": 1, k: 1024, m: 1048576, g: 1073741824 }[m[2].toLowerCase()];
    }
    var bs = bytesOf2(o.bs);
    if (bs == null) return bad("dd: invalid number: '" + o.bs + "'");
    var count = o.count != null ? Number(o.count) : null;
    var src = o["if"] || "/dev/stdin";
    var dst = o.of || "/dev/stdout";
    var srcDev = /^\/dev\/(sd[a-z]\d*)$/.test(src) ? blockDev(state, src) : null;
    var dstDev = /^\/dev\/(sd[a-z]\d*)$/.test(dst) ? blockDev(state, dst) : null;
    var text = null, total;
    if (src === "/dev/zero" || src === "/dev/urandom" || src === "/dev/random") {
      if (count == null) return bad("lab: reading " + src + " never ends. Add count=, for example count=10");
      total = bs * count;
    } else if (srcDev) {
      if (state.user !== "root") return bad("dd: failed to open '" + src + "': Permission denied");
      var srcBytes = Math.round(srcDev.size * 1073741824);
      total = count == null ? srcBytes : Math.min(srcBytes, bs * count);
      if (total > 50 * 1048576 && !dstDev && dst !== "/dev/null") return bad("lab: that would write a " + gfmt(total / 1073741824) + " image file. Add count= to copy only the start, for example bs=1M count=10");
    } else {
      var got = readPath(state, resolve(state, src));
      if (got.code) return bad("dd: failed to open '" + src + "': No such file or directory");
      text = got.stdout;
      var skip = o.skip ? Number(o.skip) * bs : 0;
      text = text.slice(skip, count == null ? undefined : skip + bs * count);
      total = text.length;
    }
    if (dstDev) {
      if (state.user !== "root") return bad("dd: failed to open '" + dst + "': Permission denied");
      if (dstDev.name === "sda" || /^sda\d/.test(dstDev.name)) return bad("lab: refusing to write over " + dst + ". It holds / and /boot, the running system. Real dd would not ask; it would just do it.");
      if (mountedAt(state, dstDev.name) || dstDev.obj.parts && dstDev.obj.parts.some(function (p) { return mountedAt(state, p.name); })) return bad("lab: " + dst + " is mounted. Unmount it first; writing under a mounted filesystem corrupts it.");
      if (holderOf(state, dstDev.name)) return bad("lab: " + dst + " is in use by a " + holderOf(state, dstDev.name) + ".");
      if (dstDev.kind === "disk") { dstDev.obj.parts = []; dstDev.obj.table = null; }
      dstDev.obj.fs = null; dstDev.obj.label = ""; dstDev.obj.uuid = ""; dstDev.obj.store = {};
    } else if (dst === "/dev/stdout") {
      if (text == null) return bad("lab: those bytes are binary, so the lab will not print them. Write to a file with of=");
    } else if (dst !== "/dev/null") {
      var path = resolve(state, dst);
      var w = writeFile(state, path, text == null ? "" : text, false);
      if (w.code) return w;
      if (text == null) state.files[path].size = total;
      else delete state.files[path].size;
    }
    var recs = Math.ceil(total / bs);
    var mb = total / 1000000;
    var stat = recs + "+0 records in\n" + recs + "+0 records out\n" + total + " bytes" + (total >= 1000000 ? " (" + (mb >= 1000 ? (mb / 1000).toFixed(1) + " GB" : Math.round(mb) + " MB") + ", " + (total >= 1073741824 ? (total / 1073741824).toFixed(1) + " GiB" : Math.round(total / 1048576) + " MiB") + ")" : "") + " copied, 0.0213 s, " + Math.max(1, Math.round(mb / 0.0213)) + " MB/s\n";
    return { stdout: "", stderr: stat, code: 0, clear: false };
  }
  function cmdSmartctl(state, argv) {
    var dev = argv.filter(function (a) { return a.charAt(0) === "/"; })[0];
    var flags = argv.filter(function (a) { return a.charAt(0) === "-"; });
    var head = "smartctl 7.4 2023-08-01 r5530 [x86_64-linux] (local build)\nCopyright (C) 2002-23, Bruce Allen, Christian Franke, www.smartmontools.org\n\n";
    if (argv[0] === "--scan") return ok("/dev/sda -d scsi # /dev/sda, SCSI device\n/dev/sdb -d scsi # /dev/sdb, SCSI device\n/dev/sdc -d sat # /dev/sdc [SAT], ATA device\n/dev/sdd -d sat # /dev/sdd [SAT], ATA device\n/dev/sde -d sat # /dev/sde [SAT], ATA device\n/dev/sdf -d sat # /dev/sdf [SAT], ATA device\n");
    if (!dev) return bad(head + "ERROR: smartctl requires a device name as the final command-line argument.\nExample: sudo smartctl -H /dev/sda");
    if (state.user !== "root") return bad(head + "Smartctl open device: " + dev + " failed: Permission denied\nlab: try sudo smartctl -H " + dev, 2);
    var d = devName(dev);
    var sys = sysState(state);
    if (!sys.disks[d]) return bad(head + "Smartctl open device: " + dev + " failed: No such device", 2);
    if (d === "sdb") return bad(head + dev + ": Unknown USB bridge [0x0781:0x5583]\nPlease specify device type with the -d option.\nlab: many USB sticks do not pass SMART data through. Try -d sat, or test an internal disk.", 1);
    var worn = d === "sdf";
    var info = "=== START OF INFORMATION SECTION ===\nDevice Model:     " + sys.disks[d].model + "\nSerial Number:    " + sys.disks[d].serial + "\nUser Capacity:    " + Math.round(sys.disks[d].size * 1073741824).toLocaleString("en-US") + " bytes [" + (sys.disks[d].size * 1.074).toFixed(1) + " GB]\nRotation Rate:    " + (d === "sda" ? "Solid State Device" : "7200 rpm") + "\nSMART support is: Available - device has SMART capability.\nSMART support is: Enabled\n\n";
    var health = "=== START OF READ SMART DATA SECTION ===\nSMART overall-health self-assessment test result: PASSED\n" + (worn ? "lab note: PASSED does not mean healthy. Look at the attributes below: sdf has reallocated and pending sectors.\n" : "") + "\n";
    var attrs = "SMART Attributes Data Structure revision number: 16\nID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE\n" +
      "  5 Reallocated_Sector_Ct   0x0033   " + (worn ? "088   088" : "100   100") + "   010    Pre-fail  Always       -       " + (worn ? "184" : "0") + "\n" +
      "  9 Power_On_Hours          0x0032   097   097   000    Old_age   Always       -       " + (worn ? "41877" : "2611") + "\n" +
      "194 Temperature_Celsius     0x0022   064   051   000    Old_age   Always       -       36\n" +
      "197 Current_Pending_Sector  0x0012   100   100   000    Old_age   Always       -       " + (worn ? "16" : "0") + "\n" +
      "198 Offline_Uncorrectable   0x0010   100   100   000    Old_age   Offline      -       " + (worn ? "3" : "0") + "\n" +
      "199 UDMA_CRC_Error_Count    0x003e   200   200   000    Old_age   Always       -       0\n\n";
    var tests = "SMART Self-test log structure revision number 1\nNum  Test_Description    Status                  Remaining  LifeTime(hours)  LBA_of_first_error\n" + ((sys.smartTests || {})[d] ? "# 1  Short offline       Completed without error       00%      " + (worn ? "41877" : "2611") + "         -\n" : "No self-tests have been logged.  [To run self-tests, use: smartctl -t]\n");
    var j = flags.join(" ");
    if (/-t/.test(j)) {
      sys.smartTests = sys.smartTests || {};
      sys.smartTests[d] = true;
      return ok(head + "=== START OF OFFLINE IMMEDIATE AND SELF-TEST SECTION ===\nSending command: \"Execute SMART Short self-test routine immediately in off-line mode\".\nDrive command \"Execute SMART Short self-test routine immediately in off-line mode\" successful.\nTesting has begun.\nPlease wait 2 minutes for test to complete.\nTest will complete after Mon Nov  2 09:06:01 2026 UTC\nUse smartctl -X to abort test.\nlab: the lab finishes it at once. Read the result with: sudo smartctl -l selftest " + dev + "\n");
    }
    if (/-H/.test(j) && !/-a|-x/.test(j)) return ok(head + health);
    if (/-i/.test(j) && !/-a|-x/.test(j)) return ok(head + info);
    if (/-A/.test(j)) return ok(head + attrs);
    if (/-l/.test(j)) return ok(head + tests);
    return ok(head + info + health + attrs + tests);
  }
  function needDisks(state, tool, argv) {
    return needRoot(state, tool, argv, "WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permission denied");
  }
  function sizeArg(v, freeExt, vgExt) {
    var s = String(v || "");
    var pct = s.match(/^\+?(\d+)%(FREE|VG)$/i);
    if (pct) return Math.floor((pct[2].toUpperCase() === "FREE" ? freeExt : vgExt) * Number(pct[1]) / 100);
    var m = s.match(/^\+?([\d.]+)([MGT]?)$/i);
    if (!m) return null;
    var g = Number(m[1]) * { "": 1, m: 1 / 1024, g: 1, t: 1024 }[m[2].toLowerCase()];
    return Math.round(g * 256);
  }
  function extG(n) { return n / 256; }
  function lvmSize(n) {
    var g = extG(n);
    return (g < 1 ? (g * 1024).toFixed(2) + "m" : g.toFixed(2) + "g");
  }
  function cmdLvm(state, tool, argv) {
    var sys = sysState(state);
    var L = sys.lvm;
    var readOnly = ["pvs", "vgs", "lvs", "pvdisplay", "vgdisplay", "lvdisplay"].indexOf(tool) !== -1;
    var denied = needDisks(state, tool, argv);
    if (denied && !readOnly) return denied;
    if (denied && readOnly) return bad("  WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permission denied\nlab: try sudo " + tool);
    var p = parseUserOpts(argv, ["L", "l", "n", "m", "i", "o", "S", "type", "size", "extents", "name", "mirrors", "stripes"]);
    if (p.opts.size) p.opts.L = p.opts.size;
    if (p.opts.extents) p.opts.l = p.opts.extents;
    if (p.opts.name) p.opts.n = p.opts.name;
    if (p.opts.mirrors) p.opts.m = p.opts.mirrors;
    if (p.opts.stripes) p.opts.i = p.opts.stripes;
    if (p.opts.snapshot) p.opts.s = true;
    if (p.opts.resizefs) p.opts.r = true;
    function vgFree(vg) { return vg.pvs.reduce(function (t, d) { return t + L.pvs[d].free; }, 0); }
    function vgTotal(vg) { return vg.pvs.reduce(function (t, d) { return t + L.pvs[d].pe; }, 0); }
    function devArg(d) { var n = d.charAt(0) === "/" ? d : "/dev/" + d; var id = byIdTarget(state, n); return id ? "/dev/" + id : n; }
    function lvKey(spec) {
      var s = String(spec || "");
      if (/^\/dev\/mapper\//.test(s)) return mapperKey(s.replace(/^\/dev\/mapper\//, ""));
      return s.replace(/^\/dev\//, "");
    }
    function take(vg, ext, perPv, count) {
      var pvs = vg.pvs.slice().sort(function (a, b) { return L.pvs[b].free - L.pvs[a].free; });
      var segs = [];
      if (perPv) {
        if (pvs.length < count) return { error: "Insufficient suitable allocatable extents: need " + count + " physical volumes, volume group \"" + vg.name + "\" has " + pvs.length + ". Add a disk with vgextend." };
        var chosen = pvs.slice(0, count);
        if (chosen.some(function (d) { return L.pvs[d].free < perPv + 1; })) return { error: "Insufficient free space: " + (perPv * count + count) + " extents needed, but only " + chosen.reduce(function (t, d) { return t + L.pvs[d].free; }, 0) + " available on " + count + " disks" };
        chosen.forEach(function (d) { L.pvs[d].free -= perPv + 1; segs.push({ pv: d, pe: perPv + 1 }); });
        return { segs: segs };
      }
      if (vgFree(vg) < ext) return { error: "Volume group \"" + vg.name + "\" has insufficient free space (" + vgFree(vg) + " extents): " + ext + " required." };
      var left = ext;
      pvs.forEach(function (d) {
        if (!left) return;
        var use = Math.min(left, L.pvs[d].free);
        if (use) { L.pvs[d].free -= use; left -= use; segs.push({ pv: d, pe: use }); }
      });
      return { segs: segs };
    }
    function giveBack(lv) { lv.segs.forEach(function (s) { if (L.pvs[s.pv]) L.pvs[s.pv].free += s.pe; }); }
    function table(head, rows) {
      var w = head.map(function (h, i) { return Math.max(h.length, Math.max.apply(null, rows.map(function (r) { return String(r[i]).length; }).concat([0]))); });
      return asText(["  " + head.map(function (h, i) { return h.padEnd(w[i]); }).join(" ").trimEnd()].concat(rows.map(function (r) { return "  " + r.map(function (c, i) { return String(c).padEnd(w[i]); }).join(" ").trimEnd(); })));
    }
    switch (tool) {
      case "pvcreate": {
        var out = [];
        for (var i = 0; i < p.rest.length; i++) {
          var dev = devArg(p.rest[i]);
          var bd = blockDev(state, dev);
          if (!bd) return bad("  No device found for " + p.rest[i] + ".");
          if (bd.kind === "disk" && bd.obj.parts.length) return bad("  Cannot use " + dev + ": device is partitioned");
          var held = holderOf(state, bd.name);
          if (held && L.pvs[dev]) return bad("  Can't initialize physical volume \"" + dev + "\" of volume group \"" + (L.pvs[dev].vg || "") + "\" without -ff");
          if (held) return bad("  Can't open " + dev + " exclusively.  Mounted filesystem? (" + held + ")");
          if (bd.obj.fs && mountedAt(state, bd.name)) return bad("  Can't open " + dev + " exclusively.  Mounted filesystem?");
          L.pvs[dev] = { dev: dev, pe: Math.round(bd.size * 256) - 1, free: Math.round(bd.size * 256) - 1, vg: null };
          out.push("  Physical volume \"" + dev + "\" successfully created.");
        }
        return ok(asText(out));
      }
      case "vgcreate": case "vgextend": {
        var name = p.rest[0];
        var devs = p.rest.slice(1).map(devArg);
        if (!name || !devs.length) return bad("  Please enter a volume group name and at least one physical volume: " + tool + " data /dev/sdc");
        if (tool === "vgcreate" && L.vgs[name]) return bad("  /dev/" + name + ": already exists in filesystem");
        if (tool === "vgextend" && !L.vgs[name]) return bad("  Volume group \"" + name + "\" not found");
        var made = [];
        for (var k = 0; k < devs.length; k++) {
          if (!L.pvs[devs[k]]) {
            var r = cmdLvm(state, "pvcreate", [devs[k]]);
            if (r.code) return r;
            made.push(r.stdout.replace(/\n$/, ""));
          }
          if (L.pvs[devs[k]].vg) return bad("  Physical volume '" + devs[k] + "' is already in volume group '" + L.pvs[devs[k]].vg + "'");
        }
        if (tool === "vgcreate") L.vgs[name] = { name: name, pvs: [], uuid: fakeUuid(name) };
        devs.forEach(function (d) { L.pvs[d].vg = name; L.vgs[name].pvs.push(d); });
        made.push(tool === "vgcreate" ? "  Volume group \"" + name + "\" successfully created" : "  Volume group \"" + name + "\" successfully extended");
        return ok(asText(made));
      }
      case "lvcreate": {
        var vgName = p.rest[0];
        var snapOf = p.opts.s ? p.rest[0] : null;
        if (snapOf) {
          var okey = lvKey(snapOf);
          var origin = L.lvs[okey];
          if (!origin) return bad("  Failed to find logical volume \"" + okey + "\"");
          var vg0 = L.vgs[origin.vg];
          var sext = sizeArg(p.opts.L, vgFree(vg0), vgTotal(vg0)) || (p.opts.l ? sizeArg(p.opts.l, vgFree(vg0), vgTotal(vg0)) : null);
          if (!sext) return bad("  Please specify a size for the snapshot: -L 1G");
          var sname = p.opts.n || "lvol0";
          var got = take(vg0, sext);
          if (got.error) return bad("  " + got.error);
          var mnt = sysState(state).mounts.filter(function (m) { return m.obj === origin; })[0];
          var frozen = mnt ? JSON.parse(JSON.stringify(collectStore(state, mnt.dir))) : JSON.parse(JSON.stringify(origin.store || {}));
          L.lvs[origin.vg + "/" + sname] = { name: sname, vg: origin.vg, type: "snapshot", size: sext, segs: got.segs, origin: origin.name, frozen: frozen, fs: origin.fs, fsSize: origin.fsSize, uuid: origin.uuid, store: JSON.parse(JSON.stringify(frozen)), used: 0.01 };
          return ok("  Logical volume \"" + sname + "\" created.\n");
        }
        var vg = L.vgs[vgName];
        if (!vg) return bad("  Volume group \"" + (vgName || "") + "\" not found\n  Cannot process volume group " + (vgName || ""));
        var lvName = p.opts.n || "lvol" + Object.keys(L.lvs).length;
        if (L.lvs[vgName + "/" + lvName]) return bad("  Logical Volume \"" + lvName + "\" already exists in volume group \"" + vgName + "\"");
        var type = p.opts.type || (p.opts.m ? "raid1" : p.opts.i ? "striped" : "linear");
        if (type === "mirror") type = "raid1";
        if (["linear", "raid1", "raid0", "striped", "raid5"].indexOf(type) === -1) return bad("  Logical volume type " + type + " is not supported in this lab. Use linear, raid1, raid0 (striped), or raid5.");
        var stripes = Number(p.opts.i || (type === "raid5" ? Math.max(2, vg.pvs.length - 1) : type === "raid0" || type === "striped" ? vg.pvs.length : 1));
        var mirrors = Number(p.opts.m || (type === "raid1" ? 1 : 0));
        var copies = type === "raid1" ? mirrors + 1 : type === "raid5" ? stripes + 1 : type === "raid0" || type === "striped" ? stripes : 1;
        var free = vgFree(vg);
        var usableFree = type === "linear" ? free : Math.floor(Math.min.apply(null, vg.pvs.map(function (d) { return L.pvs[d].free; }).sort(function (a, b) { return b - a; }).slice(0, copies)) - 1) * (type === "raid1" ? 1 : type === "raid5" ? stripes : stripes);
        var ext = p.opts.L ? sizeArg(p.opts.L, usableFree, vgTotal(vg)) : p.opts.l ? sizeArg(p.opts.l, usableFree, vgTotal(vg)) : null;
        if (!ext) return bad("  Please specify either size or extents (-L 5G or -l 100%FREE)");
        var res;
        if (type === "linear") res = take(vg, ext);
        else if (type === "raid1") res = take(vg, 0, ext, copies);
        else res = take(vg, 0, Math.ceil(ext / stripes), copies);
        if (res.error) return bad("  " + res.error);
        if (type === "raid0" || type === "striped") res.segs.forEach(function (s) { s.pe -= 1; L.pvs[s.pv].free += 1; });
        L.lvs[vgName + "/" + lvName] = { name: lvName, vg: vgName, type: type === "striped" ? "raid0" : type, size: ext, segs: res.segs, stripes: stripes, mirrors: mirrors, uuid: fakeUuid(vgName + lvName), store: {} };
        return ok("  Logical volume \"" + lvName + "\" created.\n");
      }
      case "lvextend": case "lvresize": case "lvreduce": {
        var key = lvKey(p.rest[0]);
        var lv = L.lvs[key];
        if (!lv) return bad("  Failed to find logical volume \"" + key + "\"");
        var vg2 = L.vgs[lv.vg];
        var spec = String(p.opts.L || p.opts.l || "");
        var rel = /^[+-]/.test(spec);
        var amount = sizeArg(spec.replace(/^-/, ""), vgFree(vg2), vgTotal(vg2));
        if (amount == null) return bad("  Please specify a size: -L +2G or -l +100%FREE");
        var target2 = spec.charAt(0) === "-" ? lv.size - amount : rel ? lv.size + amount : amount;
        if (tool === "lvextend" && target2 <= lv.size) return bad("  New size given (" + target2 + " extents) not larger than existing size (" + lv.size + " extents)");
        var lines2 = [];
        if (target2 < lv.size) {
          if (lv.fs === "xfs") return bad("  lab: XFS cannot shrink. Back up, make a smaller volume, and restore.");
          if (lv.fs && !p.opts.r) lines2.push("  WARNING: Reducing active logical volume to " + lvmSize(target2) + ".\n  THIS MAY DESTROY YOUR DATA (filesystem etc.)\n  lab: shrink the filesystem first (resize2fs), or use -r so lvreduce does both.");
          var giveExt = lv.size - target2;
          lv.segs.slice().reverse().forEach(function (s) { var g = Math.min(giveExt, s.pe); s.pe -= g; L.pvs[s.pv].free += g; giveExt -= g; });
          lv.segs = lv.segs.filter(function (s) { return s.pe > 0; });
        } else {
          var add = target2 - lv.size;
          var more = lv.type === "linear" || lv.type === "snapshot" ? take(vg2, add) : take(vg2, 0, lv.type === "raid1" ? add : Math.ceil(add / lv.stripes), lv.segs.length);
          if (more.error) return bad("  " + more.error);
          more.segs.forEach(function (s) { var same = lv.segs.filter(function (x) { return x.pv === s.pv; })[0]; if (same) same.pe += s.pe; else lv.segs.push(s); });
        }
        var old = lv.size;
        lv.size = target2;
        lines2.push("  Size of logical volume " + key + " changed from " + lvmSize(old).replace("g", " GiB").replace("m", " MiB") + " (" + old + " extents) to " + lvmSize(target2).replace("g", " GiB").replace("m", " MiB") + " (" + target2 + " extents).", "  Logical volume " + key + " successfully resized.");
        if (p.opts.r && lv.fs) {
          lv.fsSize = extG(target2);
          lines2.push(lv.fs === "xfs" ? "data blocks changed from " + Math.round(extG(old) * 262144) + " to " + Math.round(extG(target2) * 262144) : "resize2fs 1.47.0 (5-Feb-2023)\nThe filesystem on /dev/mapper/" + mapperName(key) + " is now " + Math.round(extG(target2) * 262144) + " (4k) blocks long.");
        } else if (lv.fs) lines2.push("  lab: the filesystem is still " + gfmt(lv.fsSize || extG(old)) + ". Grow it too: sudo resize2fs /dev/" + key + "  (or use lvextend -r next time)");
        return ok(asText(lines2));
      }
      case "lvremove": case "vgremove": case "pvremove": {
        var outR = [];
        for (var q = 0; q < p.rest.length; q++) {
          if (tool === "lvremove") {
            var k2 = lvKey(p.rest[q]);
            var targets = L.lvs[k2] ? [k2] : Object.keys(L.lvs).filter(function (x) { return x.split("/")[0] === k2; });
            if (!targets.length) return bad("  Failed to find logical volume \"" + k2 + "\"");
            for (var t = 0; t < targets.length; t++) {
              var lv2 = L.lvs[targets[t]];
              if (sysState(state).mounts.some(function (m) { return m.obj === lv2; })) return bad("  Logical volume " + targets[t] + " contains a filesystem in use.");
              if (Object.keys(L.lvs).some(function (x) { return L.lvs[x].type === "snapshot" && L.lvs[x].origin === lv2.name && L.lvs[x].vg === lv2.vg; }) && !p.opts.f) return bad("  Logical volume " + targets[t] + " has snapshots. Remove them first, or lvremove -f removes them with it.");
              giveBack(lv2);
              delete L.lvs[targets[t]];
              outR.push((p.opts.y || p.opts.f ? "" : "Do you really want to remove active logical volume " + targets[t] + "? [y/n]: y (the lab answered)\n") + "  Logical volume \"" + lv2.name + "\" successfully removed.");
            }
          } else if (tool === "vgremove") {
            var vgN = p.rest[q];
            if (!L.vgs[vgN]) return bad("  Volume group \"" + vgN + "\" not found");
            var lvsIn = Object.keys(L.lvs).filter(function (x) { return L.lvs[x].vg === vgN; });
            if (lvsIn.length && !p.opts.f) return bad("  Volume group \"" + vgN + "\" still contains " + lvsIn.length + " logical volume(s). Remove them first with lvremove, or use vgremove -f.");
            lvsIn.forEach(function (x) { delete L.lvs[x]; });
            L.vgs[vgN].pvs.forEach(function (d) { L.pvs[d].vg = null; L.pvs[d].free = L.pvs[d].pe; });
            delete L.vgs[vgN];
            outR.push("  Volume group \"" + vgN + "\" successfully removed");
          } else {
            var dv = devArg(p.rest[q]);
            if (!L.pvs[dv]) return bad("  No PV found on device " + dv + ".");
            if (L.pvs[dv].vg) return bad("  PV " + dv + " is used by VG " + L.pvs[dv].vg + " so please use vgreduce first.");
            delete L.pvs[dv];
            outR.push("  Labels on physical volume \"" + dv + "\" successfully wiped.");
          }
        }
        return ok(asText(outR));
      }
      case "vgreduce": {
        var vgR = L.vgs[p.rest[0]];
        var dR = devArg(p.rest[1] || "");
        if (!vgR) return bad("  Volume group \"" + p.rest[0] + "\" not found");
        if (!L.pvs[dR] || L.pvs[dR].vg !== vgR.name) return bad("  Physical volume \"" + dR + "\" not in volume group \"" + vgR.name + "\"");
        if (L.pvs[dR].free !== L.pvs[dR].pe) return bad("  Physical volume \"" + dR + "\" still in use. Move its data first: sudo pvmove " + dR);
        vgR.pvs = vgR.pvs.filter(function (d) { return d !== dR; });
        L.pvs[dR].vg = null;
        return ok("  Removed \"" + dR + "\" from volume group \"" + vgR.name + "\"\n");
      }
      case "lvconvert": {
        if (!p.opts.merge && argv.indexOf("--merge") === -1) return bad("  lab: this lab's lvconvert knows --merge (roll an origin back to a snapshot).");
        var sk = lvKey(p.rest[0]);
        var snap = L.lvs[sk];
        if (!snap || snap.type !== "snapshot") return bad("  \"" + sk + "\" is not a snapshot. Name the snapshot: lvconvert --merge /dev/vg/snapname");
        var orig = L.lvs[snap.vg + "/" + snap.origin];
        var busy = sysState(state).mounts.some(function (m) { return m.obj === orig; });
        if (busy) return ok("  Delaying merge since origin is open.\n  Merging of snapshot " + sk + " will occur on next activation of " + snap.vg + "/" + snap.origin + ".\n  lab: unmount the origin, then run: sudo lvchange -an " + snap.vg + "/" + snap.origin + " && sudo lvchange -ay " + snap.vg + "/" + snap.origin + "\n" + (orig.pendingMerge = sk, ""));
        doMerge(L, sk);
        return ok("  Merging of volume " + sk + " started.\n  " + snap.vg + "/" + snap.origin + ": Merged: 100.00%\n");
      }
      case "lvchange": {
        var ck = lvKey(argv.filter(function (a) { return a.charAt(0) !== "-" && a !== "y" && a !== "n"; })[0]);
        var clv = L.lvs[ck];
        if (!clv) return bad("  Failed to find logical volume \"" + ck + "\"");
        var activate = argv.indexOf("-ay") !== -1 || (argv.indexOf("-a") !== -1 && argv[argv.indexOf("-a") + 1] === "y");
        if (activate && clv.pendingMerge) { var pm = clv.pendingMerge; clv.pendingMerge = null; doMerge(L, pm); return ok("  lab: the snapshot merged into " + ck + " on activation.\n"); }
        return ok("");
      }
      case "pvs": {
        var rowsP = Object.keys(L.pvs).sort().map(function (d) { var pv = L.pvs[d]; return [d, pv.vg || "", "lvm2", pv.vg ? "a--" : "---", "<" + lvmSize(pv.pe + 1), "<" + lvmSize(pv.free + (pv.free === pv.pe ? 1 : 0))]; });
        return ok(table(["PV", "VG", "Fmt", "Attr", "PSize", "PFree"], rowsP));
      }
      case "vgs": {
        var rowsV = Object.keys(L.vgs).sort().map(function (n) { var vg = L.vgs[n]; var lvsIn = Object.keys(L.lvs).filter(function (x) { return L.lvs[x].vg === n; }); return [n, vg.pvs.length, lvsIn.filter(function (x) { return L.lvs[x].type !== "snapshot"; }).length, lvsIn.filter(function (x) { return L.lvs[x].type === "snapshot"; }).length, "wz--n-", "<" + lvmSize(vgTotal(vg)), vgFree(vg) ? lvmSize(vgFree(vg)) : "0"]; });
        return ok(table(["VG", "#PV", "#LV", "#SN", "Attr", "VSize", "VFree"], rowsV));
      }
      case "lvs": {
        var withDevs = argv.indexOf("+devices") !== -1 || argv.indexOf("-a") !== -1 || (p.opts.o && /devices/.test(p.opts.o));
        var hidden = argv.indexOf("-a") !== -1 || argv.some(function (a) { return /^-a/.test(a); });
        var rowsL = [];
        Object.keys(L.lvs).sort().forEach(function (k) {
          var lv = L.lvs[k];
          var attr = { linear: "-wi-a-----", raid1: "rwi-a-r---", raid0: "rwi-a-r---", raid5: "rwi-a-r---", snapshot: "swi-a-s---" }[lv.type] || "-wi-a-----";
          if (lv.type !== "snapshot" && Object.keys(L.lvs).some(function (x) { return L.lvs[x].origin === lv.name && L.lvs[x].vg === lv.vg; })) attr = "owi-a-s---";
          var raid = /raid/.test(lv.type);
          var row = [lv.name, lv.vg, attr, lvmSize(lv.size), lv.origin || "", lv.type === "snapshot" ? lv.used.toFixed(2) : "", raid && lv.type !== "raid0" ? "100.00" : ""];
          if (withDevs) row.push(raid ? lv.segs.map(function (s, i) { return lv.name + "_rimage_" + i + "(0)"; }).join(",") : lv.segs.map(function (s) { return s.pv + "(0)"; }).join(","));
          rowsL.push(row);
          if (raid && hidden) {
            lv.segs.forEach(function (s, i) {
              var img = ["[" + lv.name + "_rimage_" + i + "]", lv.vg, "iwi-aor---", lvmSize(lv.type === "raid1" ? lv.size : s.pe - 1), "", "", ""];
              if (withDevs) img.push(s.pv + "(1)");
              rowsL.push(img);
            });
            lv.segs.forEach(function (s, i) {
              var meta = ["[" + lv.name + "_rmeta_" + i + "]", lv.vg, "ewi-aor---", "4.00m", "", "", ""];
              if (withDevs) meta.push(s.pv + "(0)");
              rowsL.push(meta);
            });
          }
        });
        var head = ["LV", "VG", "Attr", "LSize", "Origin", "Data%", "Cpy%Sync"];
        if (withDevs) head.push("Devices");
        return ok(table(head, rowsL));
      }
      case "pvdisplay": case "vgdisplay": case "lvdisplay": {
        var blocks = [];
        if (tool === "lvdisplay") Object.keys(L.lvs).sort().forEach(function (k) {
          var lv = L.lvs[k];
          var b = ["  --- Logical volume ---", "  LV Path                /dev/" + k, "  LV Name                " + lv.name, "  VG Name                " + lv.vg, "  LV UUID                " + lv.uuid, "  LV Status              available", "  LV Size                " + lvmSize(lv.size).replace("g", " GiB").replace("m", " MiB"), "  Current LE             " + lv.size, "  Segments               " + lv.segs.length, "  Type                   " + lv.type];
          if (argv.indexOf("-m") !== -1) { b.push("", "  --- Segments ---"); lv.segs.forEach(function (s, i) { b.push("  Physical volume " + (i + 1) + "     " + s.pv + "  (" + s.pe + " extents)"); }); }
          blocks.push(b.join("\n"));
        });
        if (tool === "vgdisplay") Object.keys(L.vgs).sort().forEach(function (n) {
          var vg = L.vgs[n];
          blocks.push(["  --- Volume group ---", "  VG Name               " + n, "  Format                lvm2", "  VG Size               " + lvmSize(vgTotal(vg)).replace("g", " GiB"), "  PE Size               4.00 MiB", "  Total PE              " + vgTotal(vg), "  Alloc PE / Size       " + (vgTotal(vg) - vgFree(vg)) + " / " + lvmSize(vgTotal(vg) - vgFree(vg)).replace("g", " GiB").replace("m", " MiB"), "  Free  PE / Size       " + vgFree(vg) + " / " + lvmSize(vgFree(vg)).replace("g", " GiB").replace("m", " MiB"), "  Cur PV                " + vg.pvs.length].join("\n"));
        });
        if (tool === "pvdisplay") Object.keys(L.pvs).sort().forEach(function (d) {
          var pv = L.pvs[d];
          blocks.push(["  --- Physical volume ---", "  PV Name               " + d, "  VG Name               " + (pv.vg || ""), "  PV Size               " + lvmSize(pv.pe + 1).replace("g", " GiB"), "  PE Size               4.00 MiB", "  Total PE              " + pv.pe, "  Free PE               " + pv.free, "  Allocated PE          " + (pv.pe - pv.free)].join("\n"));
        });
        return ok(blocks.length ? blocks.join("\n\n") + "\n" : "");
      }
    }
    return bad(tool + ": not in this lab");
  }
  function collectStore(state, dir) {
    var store = {};
    Object.keys(state.files).forEach(function (k) {
      if (k.indexOf(dir + "/") === 0) {
        var n = state.files[k];
        store[k.slice(dir.length + 1)] = { kind: n.kind, mode: n.mode, owner: n.owner, group: n.group, text: n.text || "" };
      }
    });
    return store;
  }
  function doMerge(L, sk) {
    var snap = L.lvs[sk];
    var orig = L.lvs[snap.vg + "/" + snap.origin];
    orig.store = JSON.parse(JSON.stringify(snap.frozen));
    snap.segs.forEach(function (s) { if (L.pvs[s.pv]) L.pvs[s.pv].free += s.pe; });
    delete L.lvs[sk];
  }
  function cmdResize2fs(state, argv) {
    var denied = needRoot(state, "resize2fs", argv, "Permission denied while trying to open " + argv[0]);
    if (denied) return denied;
    var bd = blockDev(state, argv[0]);
    if (!bd) return bad("resize2fs: No such file or directory while trying to open " + argv[0]);
    if (bd.obj.fs !== "ext4") return bad("resize2fs: Bad magic number in super-block while trying to open " + argv[0] + (bd.obj.fs === "xfs" ? "\nlab: XFS grows with xfs_growfs /mountpoint" : ""));
    bd.obj.fsSize = bd.size;
    return ok("resize2fs 1.47.0 (5-Feb-2023)\n" + (mountedAt(state, bd.name) ? "Filesystem at " + argv[0] + " is mounted on " + mountedAt(state, bd.name).dir + "; on-line resizing required\n" : "") + "The filesystem on " + argv[0] + " is now " + Math.round(bd.size * 262144) + " (4k) blocks long.\n\n");
  }
  function cmdXfsGrow(state, argv) {
    var denied = needRoot(state, "xfs_growfs", argv);
    if (denied) return denied;
    var m = sysState(state).mounts.filter(function (x) { return x.dir === resolve(state, argv[0] || ""); })[0];
    if (!m || m.fs !== "xfs") return bad("xfs_growfs: " + argv[0] + " is not a mounted XFS filesystem");
    var old = m.obj.fsSize;
    var now = m.obj.vg ? m.obj.size / 256 : m.obj.size;
    m.obj.fsSize = now;
    return ok("data blocks changed from " + Math.round(old * 262144) + " to " + Math.round(now * 262144) + "\n");
  }

  function zfsDevs(state, words) {
    var groups = [];
    var current = null;
    var bad1 = null;
    words.forEach(function (w) {
      if (/^(mirror|raidz|raidz1|raidz2|raidz3)$/.test(w)) { current = { kind: w === "raidz1" ? "raidz" : w, devs: [] }; groups.push(current); return; }
      var name = byIdTarget(state, w) || devName(w);
      if (!sysState(state).disks[name]) { bad1 = w; return; }
      if (!current || current.kind === "stripe") { if (!current) { current = { kind: "stripe", devs: [] }; groups.push(current); } }
      current.devs.push({ name: name, label: w.indexOf("by-id") !== -1 ? w.split("/").pop() : name });
    });
    return { groups: groups, bad: bad1 };
  }
  function cmdZpool(state, argv) {
    var sys = sysState(state);
    var Z = sys.zfs;
    var sub = argv[0];
    var rest = argv.slice(1).filter(function (a) { return a !== "-f"; });
    var readOnly = ["status", "list", "iostat", undefined].indexOf(sub) !== -1;
    if (!readOnly) { var denied = needRoot(state, "zpool", argv, "permission denied"); if (denied) return denied; }
    function vdevUsable(g) {
      var each = Math.min.apply(null, g.devs.map(function (d) { return sys.disks[d.name].size; }));
      var n = g.devs.length;
      return g.kind === "mirror" ? each : g.kind === "raidz" ? each * (n - 1) : g.kind === "raidz2" ? each * (n - 2) : g.kind === "raidz3" ? each * (n - 3) : each * n;
    }
    if (sub === "create") {
      var oIdx = rest.indexOf("-o");
      var opts = [];
      while (oIdx !== -1) { opts.push(rest[oIdx + 1]); rest.splice(oIdx, 2); oIdx = rest.indexOf("-o"); }
      var mIdx = rest.indexOf("-m");
      var mp = null;
      if (mIdx !== -1) { mp = rest[mIdx + 1]; rest.splice(mIdx, 2); }
      var name = rest[0];
      if (!name) return bad("missing pool name");
      if (Z.pools[name]) return bad("cannot create '" + name + "': pool already exists");
      var parsed = zfsDevs(state, rest.slice(1));
      if (parsed.bad) return bad("cannot open '" + parsed.bad + "': no such device in /dev\nmust be a full path or shorthand device name");
      if (!parsed.groups.length) return bad("invalid vdev specification: at least one device is required");
      for (var g = 0; g < parsed.groups.length; g++) {
        var grp = parsed.groups[g];
        var min = { mirror: 2, raidz: 3, raidz2: 4, raidz3: 5, stripe: 1 }[grp.kind];
        if (grp.devs.length < min) return bad("invalid vdev specification: " + grp.kind + " requires at least " + min + " devices");
        for (var d = 0; d < grp.devs.length; d++) {
          var dn = grp.devs[d].name;
          if (dn === "sda") return bad("cannot use '/dev/sda': device holds the running system");
          var held = holderOf(state, dn);
          if (held) return bad("/dev/" + dn + " is part of " + held + "\ninvalid vdev specification");
          if (sys.disks[dn].parts.length && argv.indexOf("-f") === -1) return bad("invalid vdev specification\nuse '-f' to override the following errors:\n/dev/" + dn + "1 contains a filesystem of type '" + (sys.disks[dn].parts[0].fs || "unknown") + "'");
          if (sys.disks[dn].parts.some(function (pp) { return mountedAt(state, pp.name); })) return bad("/dev/" + dn + "1 is currently mounted");
        }
      }
      var usable = parsed.groups.reduce(function (t, gr) { return t + vdevUsable(gr); }, 0);
      var raw = parsed.groups.reduce(function (t, gr) { return t + gr.devs.length * Math.min.apply(null, gr.devs.map(function (x) { return sys.disks[x.name].size; })); }, 0);
      parsed.groups.forEach(function (gr) { gr.devs.forEach(function (x) { sys.disks[x.name].parts = []; sys.disks[x.name].table = "gpt"; }); });
      Z.pools[name] = { name: name, groups: parsed.groups, devs: [].concat.apply([], parsed.groups.map(function (gr) { return gr.devs.map(function (x) { return x.name; }); })), usable: usable, raw: raw, scrub: null, opts: opts };
      var mount = mp || "/" + name;
      Z.sets[name] = { mountpoint: mount, props: { compression: "off", atime: "on", quota: "none", recordsize: "128K" }, mounted: true };
      if (!state.files[mount]) state.files[mount] = { kind: "dir", mode: 493, owner: "root", group: "root", text: "" };
      return ok("");
    }
    if (sub === "destroy") {
      var dn2 = rest[0];
      if (!Z.pools[dn2]) return bad("cannot open '" + dn2 + "': no such pool");
      if (Object.keys(Z.sets).some(function (n) { return (n === dn2 || n.indexOf(dn2 + "/") === 0) && Z.sets[n].mounted && (state.cwd === Z.sets[n].mountpoint || state.cwd.indexOf(Z.sets[n].mountpoint + "/") === 0); })) return bad("cannot unmount '/" + dn2 + "': pool or dataset is busy");
      Object.keys(Z.sets).filter(function (n) { return n === dn2 || n.indexOf(dn2 + "/") === 0; }).sort().reverse().forEach(function (n) {
        var mp2 = Z.sets[n].mountpoint;
        Object.keys(state.files).forEach(function (k) { if (k === mp2 || k.indexOf(mp2 + "/") === 0) delete state.files[k]; });
        delete Z.sets[n];
      });
      Object.keys(Z.snaps).filter(function (s) { return s.split("@")[0] === dn2 || s.indexOf(dn2 + "/") === 0; }).forEach(function (s) { delete Z.snaps[s]; });
      delete Z.pools[dn2];
      return ok("");
    }
    if (sub === "scrub") {
      var sp = Z.pools[rest[0]];
      if (!sp) return bad("cannot open '" + rest[0] + "': no such pool");
      sp.scrub = "scrub repaired 0B in 00:00:01 with 0 errors on Mon Nov  2 09:04:02 2026";
      return ok("");
    }
    if (sub === "list") {
      var lines = ["NAME    SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP    HEALTH  ALTROOT"];
      Object.keys(Z.pools).sort().forEach(function (n) {
        var pl = Z.pools[n];
        var show = pl.groups.some(function (gr) { return /raidz/.test(gr.kind); }) ? pl.raw : pl.usable;
        lines.push(n.padEnd(6) + gfmt(show * 0.99).padStart(6) + "   184K".padStart(7) + gfmt(show * 0.99).padStart(7) + "        -         -     0%     0%  1.00x    ONLINE  -");
      });
      if (lines.length === 1) return ok("no pools available\n");
      return ok(asText(lines));
    }
    if (sub === "status" || sub === undefined) {
      var names = Object.keys(Z.pools).filter(function (n) { return !rest[0] || n === rest[0]; });
      if (!names.length) return rest[0] ? bad("cannot open '" + rest[0] + "': no such pool") : ok("no pools available\n");
      return ok(names.map(function (n) {
        var pl = Z.pools[n];
        var rows = ["  pool: " + n, " state: ONLINE"];
        if (pl.scrub) rows.push("  scan: " + pl.scrub);
        rows.push("config:", "", "\tNAME" + " ".repeat(28) + "STATE     READ WRITE CKSUM", "\t" + n.padEnd(32) + "ONLINE       0     0     0");
        var idx = 0;
        pl.groups.forEach(function (gr) {
          if (gr.kind !== "stripe") rows.push("\t  " + (gr.kind + "-" + idx++).padEnd(30) + "ONLINE       0     0     0");
          gr.devs.forEach(function (x) { rows.push("\t" + (gr.kind === "stripe" ? "  " : "    ") + x.label.padEnd(gr.kind === "stripe" ? 30 : 28) + "ONLINE       0     0     0"); });
        });
        rows.push("", "errors: No known data errors");
        return rows.join("\n");
      }).join("\n\n") + "\n");
    }
    return bad("zpool: this lab knows create, status, list, scrub, destroy");
  }
  function cmdZfs(state, argv) {
    var sys = sysState(state);
    var Z = sys.zfs;
    var sub = argv[0];
    var rest = argv.slice(1);
    var readOnly = ["list", "get", undefined].indexOf(sub) !== -1;
    if (!readOnly) { var denied = needRoot(state, "zfs", argv, "permission denied"); if (denied) return denied; }
    function poolOf(n) { return Z.pools[n.split("/")[0]]; }
    if (sub === "create") {
      var props = {};
      var words = [];
      for (var i = 0; i < rest.length; i++) { if (rest[i] === "-o") { var kv = rest[++i].split("="); props[kv[0]] = kv[1]; } else if (rest[i] !== "-p") words.push(rest[i]); }
      var name = words[0];
      if (!name || name.indexOf("/") === -1) return bad("usage: zfs create pool/dataset");
      if (!poolOf(name)) return bad("cannot create '" + name + "': no such pool '" + name.split("/")[0] + "'");
      var par = name.slice(0, name.lastIndexOf("/"));
      if (!Z.sets[par]) return bad("cannot create '" + name + "': parent does not exist. Use zfs create -p to make the parents too.");
      if (Z.sets[name]) return bad("cannot create '" + name + "': dataset already exists");
      var mount = props.mountpoint || Z.sets[par].mountpoint + name.slice(par.length);
      var inherited = Object.assign({}, Z.sets[par].props, { quota: "none" });
      Object.keys(props).forEach(function (k) { if (k !== "mountpoint") inherited[k] = props[k]; });
      Z.sets[name] = { mountpoint: mount, props: inherited, mounted: true, own: Object.keys(props) };
      if (!state.files[mount]) state.files[mount] = { kind: "dir", mode: 493, owner: "root", group: "root", text: "" };
      return ok("");
    }
    if (sub === "list") {
      var snaps = rest.indexOf("-t") !== -1 && /snap/.test(rest[rest.indexOf("-t") + 1]);
      var rows = ["NAME" + " ".repeat(snaps ? 22 : 12) + "USED  AVAIL     REFER  MOUNTPOINT"];
      if (snaps) {
        Object.keys(Z.snaps).sort().forEach(function (s) { rows.push(s.padEnd(26) + "  0B      -      " + "96K".padEnd(6) + " -"); });
        if (rows.length === 1) return ok("no datasets available\n");
        return ok(asText(rows));
      }
      var setNames = Object.keys(Z.sets).sort();
      var nw = Math.max.apply(null, [4].concat(setNames.map(function (n) { return n.length; }))) + 2;
      rows = ["NAME".padEnd(nw) + " USED".padStart(5) + "AVAIL".padStart(7) + "REFER".padStart(7) + "  MOUNTPOINT"];
      setNames.forEach(function (n) {
        var ds = Z.sets[n];
        var avail = ds.props.quota !== "none" ? parseFloat(ds.props.quota) : poolOf(n).usable * 0.96;
        rows.push(n.padEnd(nw) + (n.indexOf("/") === -1 ? "432K" : "96K").padStart(5) + gfmt(avail).padStart(7) + "96K".padStart(7) + "  " + ds.mountpoint);
      });
      if (rows.length === 1) return ok("no datasets available\n");
      return ok(asText(rows));
    }
    if (sub === "set") {
      var kv2 = (rest[0] || "").split("=");
      var ds2 = Z.sets[rest[1]];
      if (!ds2) return bad("cannot open '" + rest[1] + "': dataset does not exist");
      if (["compression", "atime", "quota", "recordsize", "mountpoint", "readonly"].indexOf(kv2[0]) === -1) return bad("cannot set property for '" + rest[1] + "': invalid property '" + kv2[0] + "'");
      if (kv2[0] === "mountpoint") {
        var oldM = ds2.mountpoint;
        var store = stashMount(state, oldM);
        delete state.files[oldM];
        ds2.mountpoint = kv2[1];
        if (!state.files[kv2[1]]) state.files[kv2[1]] = { kind: "dir", mode: 493, owner: "root", group: "root", text: "" };
        unstash(state, kv2[1], store);
        return ok("");
      }
      ds2.props[kv2[0]] = kv2[1];
      Object.keys(Z.sets).forEach(function (n) { if (n.indexOf(rest[1] + "/") === 0 && kv2[0] !== "quota" && (Z.sets[n].own || []).indexOf(kv2[0]) === -1) Z.sets[n].props[kv2[0]] = kv2[1]; });
      ds2.own = (ds2.own || []).concat([kv2[0]]);
      return ok("");
    }
    if (sub === "get") {
      var propList = (rest[0] || "all").split(",");
      var targetsG = rest.slice(1).length ? rest.slice(1) : Object.keys(Z.sets).sort();
      var outG = ["NAME" + " ".repeat(12) + "PROPERTY     VALUE     SOURCE"];
      for (var t = 0; t < targetsG.length; t++) {
        var dsG = Z.sets[targetsG[t]];
        if (!dsG) return bad("cannot open '" + targetsG[t] + "': dataset does not exist");
        (propList[0] === "all" ? ["compression", "atime", "quota", "recordsize", "mountpoint"] : propList).forEach(function (pr) {
          var val = pr === "mountpoint" ? dsG.mountpoint : dsG.props[pr];
          if (val == null) val = "-";
          var src = (dsG.own || []).indexOf(pr) !== -1 ? "local" : targetsG[t].indexOf("/") === -1 ? "default" : "inherited from " + targetsG[t].split("/")[0];
          outG.push(targetsG[t].padEnd(16) + pr.padEnd(13) + String(val).padEnd(10) + src);
        });
      }
      return ok(asText(outG));
    }
    if (sub === "snapshot") {
      var sname = rest.filter(function (w) { return w !== "-r"; })[0] || "";
      var parts = sname.split("@");
      if (parts.length !== 2 || !parts[1]) return bad("usage: zfs snapshot pool/dataset@name");
      if (!Z.sets[parts[0]]) return bad("cannot open '" + parts[0] + "': dataset does not exist");
      if (Z.snaps[sname]) return bad("cannot create snapshot '" + sname + "': dataset already exists");
      Z.snaps[sname] = collectStore(state, Z.sets[parts[0]].mountpoint);
      return ok("");
    }
    if (sub === "rollback") {
      var rname = rest.filter(function (w) { return w !== "-r"; })[0] || "";
      if (!Z.snaps[rname]) return bad("cannot open '" + rname + "': dataset does not exist");
      var dsName = rname.split("@")[0];
      var later = Object.keys(Z.snaps).filter(function (s) { return s.split("@")[0] === dsName; });
      var pos = later.indexOf(rname);
      var newer = later.slice(pos + 1);
      if (newer.length && rest.indexOf("-r") === -1) return bad("cannot rollback to '" + rname + "': more recent snapshots or bookmarks exist\nuse '-r' to force deletion of the following snapshots and bookmarks:\n" + newer.join("\n"));
      newer.forEach(function (s) { delete Z.snaps[s]; });
      var mpR = Z.sets[dsName].mountpoint;
      stashMount(state, mpR);
      unstash(state, mpR, JSON.parse(JSON.stringify(Z.snaps[rname])));
      return ok("");
    }
    if (sub === "clone") {
      var from = rest[0], to = rest[1];
      if (!Z.snaps[from]) return bad("cannot open '" + from + "': dataset does not exist");
      if (!to || Z.sets[to]) return bad("cannot create '" + to + "': dataset already exists");
      var parentDs = to.slice(0, to.lastIndexOf("/"));
      if (!Z.sets[parentDs]) return bad("cannot create '" + to + "': parent does not exist");
      var mountC = Z.sets[parentDs].mountpoint + to.slice(parentDs.length);
      Z.sets[to] = { mountpoint: mountC, props: Object.assign({}, Z.sets[from.split("@")[0]].props), mounted: true, origin: from };
      state.files[mountC] = { kind: "dir", mode: 493, owner: "root", group: "root", text: "" };
      unstash(state, mountC, JSON.parse(JSON.stringify(Z.snaps[from])));
      return ok("");
    }
    if (sub === "destroy") {
      var dname = rest.filter(function (w) { return w !== "-r"; })[0] || "";
      if (dname.indexOf("@") !== -1) {
        if (!Z.snaps[dname]) return bad("could not find any snapshots to destroy; check snapshot names.");
        var clones = Object.keys(Z.sets).filter(function (n) { return Z.sets[n].origin === dname; });
        if (clones.length) return bad("cannot destroy '" + dname + "': snapshot has dependent clones\nuse '-R' to destroy the following datasets:\n" + clones.join("\n"));
        delete Z.snaps[dname];
        return ok("");
      }
      if (!Z.sets[dname]) return bad("cannot open '" + dname + "': dataset does not exist");
      if (dname.indexOf("/") === -1) return bad("cannot destroy '" + dname + "': operation does not apply to pools\nuse 'zfs destroy -r " + dname + "' to destroy all datasets in the pool\nuse 'zpool destroy " + dname + "' to destroy the pool itself");
      var hasSnaps = Object.keys(Z.snaps).some(function (s) { return s.split("@")[0] === dname; });
      if (hasSnaps && rest.indexOf("-r") === -1) return bad("cannot destroy '" + dname + "': filesystem has children\nuse '-r' to destroy the following datasets:\n" + Object.keys(Z.snaps).filter(function (s) { return s.split("@")[0] === dname; }).join("\n"));
      Object.keys(Z.snaps).forEach(function (s) { if (s.split("@")[0] === dname) delete Z.snaps[s]; });
      var mpD = Z.sets[dname].mountpoint;
      Object.keys(state.files).forEach(function (k) { if (k === mpD || k.indexOf(mpD + "/") === 0) delete state.files[k]; });
      delete Z.sets[dname];
      return ok("");
    }
    return bad("zfs: this lab knows create, list, set, get, snapshot, rollback, clone, destroy");
  }

  function cmdCryptsetup(state, argv) {
    var sys = sysState(state);
    var args = argv.filter(function (a) { return a !== "-q" && a !== "--batch-mode" && a !== "-v"; });
    var sub = args[0];
    var rest = args.slice(1);
    var aliases = { luksOpen: "open", luksClose: "close" };
    sub = aliases[sub] || sub;
    if (sub === "--version") return ok("cryptsetup 2.7.0\n");
    var denied = needRoot(state, "cryptsetup", argv, "Cannot use device " + (rest[0] || "") + ", name is invalid or still in use.\nDevice " + (rest[0] || "") + " is not accessible: Permission denied");
    if (denied && sub !== "isLuks") return denied;
    var dev = rest[0] && rest[0].charAt(0) === "/" ? rest[0] : (rest[0] ? "/dev/" + rest[0] : "");
    var lk = sys.luks[dev];
    var ask = "Enter passphrase for " + dev + ": (the lab typed the practice passphrase)\n";
    if (sub === "luksFormat") {
      var bd = blockDev(state, dev);
      if (!bd) return bad("Device " + dev + " does not exist or access denied.");
      if (bd.name === "sda" || /^sda/.test(bd.name)) return bad("lab: refusing to format " + dev + ". It holds the running system.");
      var held = bd.kind === "disk" ? holderOf(state, bd.name) : null;
      if (held && !lk) return bad("Cannot format device " + dev + " in use (" + held + ").");
      if (mountedAt(state, bd.name)) return bad("Cannot format device " + dev + " which is still in use.");
      if (lk && lk.open) return bad("Cannot format device " + dev + " which is still in use.");
      sys.luks[dev] = { slots: [0], open: null, uuid: fakeUuid(dev + "luks"), size: bd.size };
      if (bd.kind === "disk") { bd.obj.parts = []; bd.obj.table = null; }
      bd.obj.fs = null;
      return ok("\nWARNING!\n========\nThis will overwrite data on " + dev + " irrevocably.\n\nAre you sure? (Type 'yes' in capital letters): YES   (the lab typed it)\nEnter passphrase for " + dev + ": (the lab typed a practice passphrase)\nVerify passphrase: (typed again)\n");
    }
    if (sub === "isLuks") return ok("", lk ? 0 : 1);
    if (!lk && ["open", "luksDump", "luksAddKey", "luksRemoveKey", "luksChangeKey", "luksKillSlot"].indexOf(sub) !== -1) return bad("Device " + dev + " is not a valid LUKS device.");
    if (sub === "open") {
      var name = rest[1];
      if (!name) return bad("Usage: cryptsetup open " + dev + " NAME");
      if (sys.maps[name]) return bad("Device " + name + " already exists.");
      if (lk.open) return bad("Device " + dev + " is already in use (opened as " + lk.open + ").");
      lk.open = name;
      sys.maps[name] = lk.inner || (lk.inner = { dev: dev, size: lk.size - 0.016, fs: null, store: {}, uuid: "" });
      sys.maps[name].dev = dev;
      return ok(ask);
    }
    if (sub === "close") {
      var nm = rest[0] ? devName(rest[0]).replace(/^mapper\//, "") : "";
      var mapped = sys.maps[nm];
      if (!mapped) return bad("Device " + nm + " is not active.");
      if (sys.mounts.some(function (m) { return m.obj === mapped; })) return bad("Device " + nm + " is still in use.\nlab: unmount it first: sudo umount /dev/mapper/" + nm);
      sys.luks[mapped.dev].open = null;
      delete sys.maps[nm];
      return ok("");
    }
    if (sub === "status") {
      var sn = rest[0] ? devName(rest[0]).replace(/^mapper\//, "") : "";
      var sm = sys.maps[sn];
      if (!sm) return ok("/dev/mapper/" + sn + " is inactive.\n", 4);
      return ok("/dev/mapper/" + sn + " is active" + (sys.mounts.some(function (m) { return m.obj === sm; }) ? " and is in use." : ".") + "\n  type:    LUKS2\n  cipher:  aes-xts-plain64\n  keysize: 512 bits\n  key location: keyring\n  device:  " + sm.dev + "\n  sector size:  512\n  offset:  32768 sectors\n  size:    " + Math.round(sm.size * 2097152) + " sectors\n  mode:    read/write\n");
    }
    if (sub === "luksDump") {
      var out = ["LUKS header information", "Version:       \t2", "UUID:          \t" + lk.uuid, "Label:         \t(no label)", "", "Data segments:", "  0: crypt", "\toffset: 16777216 [bytes]", "\tcipher: aes-xts-plain64", "\tsector: 512 [bytes]", "", "Keyslots:"];
      lk.slots.slice().sort().forEach(function (s) { out.push("  " + s + ": luks2", "\tKey:        512 bits", "\tPBKDF:      argon2id", "\tTime cost:  4", "\tMemory:     1048576"); });
      out.push("Tokens:", "Digests:", "  0: pbkdf2", "\tHash:       sha256");
      return ok(asText(out));
    }
    if (sub === "luksAddKey") {
      if (lk.slots.length >= 32) return bad("All key slots full.");
      var free = 0;
      while (lk.slots.indexOf(free) !== -1) free++;
      lk.slots.push(free);
      return ok("Enter any existing passphrase: (the lab typed it)\nEnter new passphrase for key slot: (typed)\nVerify passphrase: (typed again)\nlab: the new passphrase is in key slot " + free + ". Check with: sudo cryptsetup luksDump " + dev + "\n");
    }
    if (sub === "luksRemoveKey" || sub === "luksKillSlot") {
      var slot = sub === "luksKillSlot" ? Number(rest[1]) : lk.slots[lk.slots.length - 1];
      if (lk.slots.indexOf(slot) === -1) return bad("Keyslot " + slot + " is not active.");
      if (lk.slots.length === 1) return bad("lab: refusing to remove the last key slot. With no passphrase left, the data could never be opened again. Real cryptsetup asks once, then does it.");
      lk.slots = lk.slots.filter(function (s) { return s !== slot; });
      return ok((sub === "luksKillSlot" ? "Enter any remaining passphrase: (typed)\n" : "Enter passphrase to be deleted: (the lab typed the one in slot " + slot + ")\n") + "lab: key slot " + slot + " is now empty.\n");
    }
    if (sub === "luksChangeKey") return ok("Enter passphrase to be changed: (typed)\nEnter new passphrase: (typed)\nVerify passphrase: (typed again)\nlab: same slot, new passphrase. The data key inside did not change, so nothing was re-encrypted.\n");
    if (sub === "luksHeaderBackup") {
      var fileIdx = rest.indexOf("--header-backup-file");
      var fname = fileIdx !== -1 ? rest[fileIdx + 1] : null;
      if (!fname) return bad("Usage: cryptsetup luksHeaderBackup " + dev + " --header-backup-file sde-header.img");
      var w = writeFile(state, resolve(state, fname), "", false);
      if (w.code) return w;
      state.files[resolve(state, fname)].size = 16777216;
      state.files[resolve(state, fname)].mode = 384;
      return ok("");
    }
    return bad("cryptsetup: this lab knows luksFormat, open, close, status, luksDump, luksAddKey, luksRemoveKey, luksKillSlot, luksChangeKey, luksHeaderBackup, isLuks");
  }

  var COMMANDS = {};
  function register() {
    COMMANDS.echo = function (s, a) { return cmdEcho(a); };
    COMMANDS.pwd = function (s) { return cmdPwd(s); };
    COMMANDS.cd = function (s, a) { return cmdCd(s, a); };
    COMMANDS.ls = function (s, a) { return cmdLs(s, a); };
    COMMANDS.cat = function (s, a, i) { return cmdCat(s, a, i); };
    COMMANDS.head = function (s, a, i) { return cmdHead(s, a, i); };
    COMMANDS.tail = function (s, a, i) { return cmdTail(s, a, i); };
    COMMANDS.grep = function (s, a, i) { return cmdGrep(s, a, i); };
    COMMANDS.cut = function (s, a, i) { return cmdCut(a, i, s); };
    COMMANDS.sort = function (s, a, i) { return cmdSort(s, a, i); };
    COMMANDS.uniq = function (s, a, i) { return cmdUniq(s, a, i); };
    COMMANDS.wc = function (s, a, i) { return cmdWc(s, a, i); };
    COMMANDS.tee = function (s, a, i) { return cmdTee(s, a, i); };
    COMMANDS.awk = function (s, a, i) { return cmdAwk(s, a, i); };
    COMMANDS.sed = function (s, a, i) { return cmdSed(s, a, i); };
    COMMANDS.find = function (s, a) { return cmdFind(s, a); };
    COMMANDS.mkdir = function (s, a) { return cmdMkdir(s, a); };
    COMMANDS.touch = function (s, a) { return cmdTouch(s, a); };
    COMMANDS.cp = function (s, a) {
      var rec = a.indexOf("-r") !== -1 || a.indexOf("-R") !== -1;
      var args = a.filter(function (x) { return x !== "-r" && x !== "-R"; });
      if (args.length < 2) return bad("cp: missing file operand");
      var dest = resolve(s, args.pop());
      for (var i = 0; i < args.length; i++) {
        var from = resolve(s, args[i]);
        if (rec && s.files[from] && s.files[from].kind === "dir") {
          var made = ensureDir(s, s.files[dest] && s.files[dest].kind === "dir" ? join(dest, base(from)) : dest);
          if (made.code) return made;
          var target = s.files[dest] && s.files[dest].kind === "dir" ? join(dest, base(from)) : dest;
          children(s, from).forEach(function (ch) {
            if (ch.node.kind === "file") writeFile(s, join(target, ch.name), ch.node.text, false);
          });
        } else {
          var copied = copyNode(s, from, dest);
          if (copied.code) return copied;
        }
      }
      return ok("");
    };
    COMMANDS.mv = function (s, a) {
      if (a.length < 2) return bad("mv: missing file operand");
      var dest = resolve(s, a[a.length - 1]);
      for (var i = 0; i < a.length - 1; i++) {
        var moved = moveNode(s, resolve(s, a[i]), dest);
        if (moved.code) return moved;
      }
      return ok("");
    };
    COMMANDS.rm = function (s, a) {
      var rec = false, force = false;
      var paths = [];
      a.forEach(function (x) {
        if (x === "-r" || x === "-R" || x === "--recursive") rec = true;
        else if (x === "-f" || x === "--force") force = true;
        else if (x === "-rf" || x === "-fr") { rec = true; force = true; }
        else if (x.charAt(0) === "-" && x.length > 1) {
          if (x.indexOf("r") !== -1 || x.indexOf("R") !== -1) rec = true;
          if (x.indexOf("f") !== -1) force = true;
        } else paths.push(x);
      });
      if (!paths.length) return bad("rm: missing operand");
      for (var i = 0; i < paths.length; i++) {
        var removed = removePath(s, resolve(s, paths[i]), rec, force);
        if (removed.code) return removed;
      }
      return ok("");
    };
    COMMANDS.ln = function (s, a) { return cmdLn(s, a); };
    COMMANDS.chmod = function (s, a) { return cmdChmod(s, a); };
    COMMANDS.chown = function (s, a) { return cmdChown(s, a); };
    COMMANDS.chgrp = function (s, a) { return cmdChgrp(s, a); };
    COMMANDS.ps = function (s, a) { return cmdPs2(s, a); };
    COMMANDS.top = function (s, a) { return cmdTop2(s, a); };
    COMMANDS.df = function (s, a) { return cmdDf2(s, a); };
    COMMANDS.du = function (s, a) { return cmdDu(s, a); };
    COMMANDS.free = function () { return cmdFree(); };
    COMMANDS.uptime = function () { return cmdUptime(); };
    COMMANDS.kill = function (s, a) { return cmdKill2(s, a); };
    COMMANDS.ping = function (s, a) { return cmdPing(a); };
    COMMANDS.curl = function (s, a) { return cmdCurl(a); };
    COMMANDS.wget = function (s, a) { return cmdWget(s, a); };
    COMMANDS.ssh = function (s, a) { return cmdSsh(a); };
    COMMANDS.scp = function (s, a) { return cmdScp(s, a); };
    COMMANDS.rsync = function (s, a) { return cmdRsync2(s, a); };
    COMMANDS.zip = function (s, a) { return cmdZip(s, a); };
    COMMANDS.unzip = function (s, a) { return cmdUnzip(s, a); };
    COMMANDS.tar = function (s, a) { return cmdTar2(s, a); };
    COMMANDS.alias = function (s, a) { return cmdAlias(s, a); };
    COMMANDS.export = function (s, a) { return cmdExport(s, a); };
    COMMANDS.set = function (s, a) { return cmdSet(s, a); };
    COMMANDS.unset = function (s, a) { return cmdUnset(s, a); };
    COMMANDS.man = function (s, a) { return cmdMan(a); };
    COMMANDS.help = function () { return cmdHelp(); };
    COMMANDS.history = function (s, a) {
      if (a[0] === "-c") { s.history = []; s.histBase = 0; return ok(""); }
      if (a[0] === "-d") {
        var at = Number(a[1]) - 1 - (s.histBase || 0);
        if (isNaN(at) || !s.history[at]) return bad("bash: history: " + a[1] + ": history position out of range");
        s.history.splice(at, 1);
        return ok("");
      }
      if (a[0] === "-w") return writeFile(s, s.home + "/.bash_history", asText(s.history), false);
      var stamp = s.env.HISTTIMEFORMAT;
      var rows = s.history.map(function (line, i) {
        return String(i + 1 + (s.histBase || 0)).padStart(5) + "  " + (stamp ? fmtDate(BASE_TIME + i * 7000, zoneOf(s), stamp) : "") + line;
      });
      if (/^\d+$/.test(a[0] || "")) rows = rows.slice(-Number(a[0]));
      return ok(asText(rows));
    };
    COMMANDS.fc = function (s, a) {
      if (a[0] === "-l") return ok(asText(s.history.slice(-16).map(function (line, i, all) { return String(s.history.length - all.length + i + 1) + "\t " + line; })));
      return bad("lab: fc opens an editor on the last command. Use fc -l to list, or !! and !N to rerun.");
    };
    COMMANDS.type = function (s, a) { return cmdType(s, a); };
    COMMANDS.crontab = function (s, a, i) { return cmdCrontab2(s, a, i); };
    COMMANDS.bash = function (s, a) { return cmdBash(s, a); };
    COMMANDS.whoami = function (s) { return ok(s.user + "\n"); };
    COMMANDS.id = function (s, a) { return cmdId(s, a); };
    COMMANDS.hostname = function (s) { return ok(s.host + "\n"); };
    COMMANDS.date = function (s, a) { return cmdDate2(s, a); };
    COMMANDS.clear = function () { return { stdout: "", stderr: "", code: 0, clear: true }; };
    COMMANDS.sudo = function (s, a, i) { return cmdSudo(s, a, i); };
    COMMANDS.su = function (s, a) { return cmdSu(s, a); };
    COMMANDS.visudo = function (s, a) { return cmdVisudo(s, a); };
    COMMANDS.nano = function (s, a) {
      var name = a.filter(function (x) { return x.charAt(0) !== "-"; })[0];
      return bad("lab: nano is a full-screen editor, which this terminal cannot show." + (name ? " On a real host it would open " + name + "." : "") + "\nKeys on a real host: type to edit, Ctrl+O then Enter saves, Ctrl+X exits, Ctrl+W searches, Ctrl+K cuts a line, Ctrl+U pastes it.\nTo write a file here: use the script box, or: printf 'line one\\nline two\\n' > " + (name || "file.txt"));
    };
    COMMANDS["true"] = function () { return ok(""); };
    COMMANDS["false"] = function () { return ok("", 1); };
    COMMANDS.stat = function (s, a) { return cmdStat(s, a); };
    COMMANDS.getfacl = function (s, a) { return cmdGetfacl(s, a); };
    COMMANDS.setfacl = function (s, a) { return cmdSetfacl(s, a); };
    COMMANDS.lsattr = function (s, a) { return cmdLsattr(s, a); };
    COMMANDS.chattr = function (s, a) { return cmdChattr(s, a); };
    COMMANDS.groups = function (s, a) { return cmdGroups(s, a); };
    COMMANDS.getent = function (s, a) { return cmdGetent(s, a); };
    COMMANDS.useradd = function (s, a) { return cmdUseradd(s, a, false); };
    COMMANDS.adduser = function (s, a) { return cmdUseradd(s, a, true); };
    COMMANDS.usermod = function (s, a) { return cmdUsermod(s, a); };
    COMMANDS.userdel = function (s, a) { return cmdUserdel(s, a); };
    COMMANDS.deluser = function (s, a) { return cmdUserdel(s, a.map(function (x) { return x === "--remove-home" ? "-r" : x; })); };
    COMMANDS.groupadd = function (s, a) { return cmdGroupadd(s, a); };
    COMMANDS.groupdel = function (s, a) { return cmdGroupdel(s, a); };
    COMMANDS.gpasswd = function (s, a) { return cmdGpasswd(s, a); };
    COMMANDS.passwd = function (s, a) { return cmdPasswd(s, a); };
    COMMANDS.chage = function (s, a) { return cmdChage(s, a); };
    COMMANDS.timedatectl = function (s, a) { return cmdTimedatectl(s, a); };
    COMMANDS.xargs = function (s, a, i) { return cmdXargs(s, a, i); };
    COMMANDS.gzip = function (s, a) { return cmdPack(s, "gzip", a); };
    COMMANDS.gunzip = function (s, a) { return cmdPack(s, "gzip", ["-d"].concat(a)); };
    COMMANDS.zcat = function (s, a) { return cmdPack(s, "gzip", ["-dc"].concat(a)); };
    COMMANDS.bzip2 = function (s, a) { return cmdPack(s, "bzip2", a); };
    COMMANDS.bunzip2 = function (s, a) { return cmdPack(s, "bzip2", ["-d"].concat(a)); };
    COMMANDS.bzcat = function (s, a) { return cmdPack(s, "bzip2", ["-dc"].concat(a)); };
    COMMANDS.xz = function (s, a) { return cmdPack(s, "xz", a); };
    COMMANDS.unxz = function (s, a) { return cmdPack(s, "xz", ["-d"].concat(a)); };
    COMMANDS.xzcat = function (s, a) { return cmdPack(s, "xz", ["-dc"].concat(a)); };
    COMMANDS["7z"] = function (s, a) { return cmd7z(s, a); };
    COMMANDS.at = function (s, a, i) { return cmdAt(s, a, i); };
    COMMANDS.atq = function (s) { return cmdAtq(s); };
    COMMANDS.atrm = function (s, a) { return cmdAtrm(s, a); };
    COMMANDS.systemctl = function (s, a) { return cmdSystemctl(s, a); };
    COMMANDS["systemd-analyze"] = function (s, a) { return cmdAnalyze(s, a); };
    COMMANDS.journalctl = function (s, a) { return cmdJournalctl(s, a); };
    COMMANDS.anacron = function (s, a) {
      if (a.indexOf("-T") !== -1) return ok("");
      return needRoot(s, "anacron", a, "Can't open timestamp directory /var/spool/anacron: Permission denied") || ok("lab: anacron checked /etc/anacrontab. Every job already ran within its period, so nothing ran now.\n");
    };
    COMMANDS.nice = function (s, a) { return cmdNice(s, a); };
    COMMANDS.renice = function (s, a) { return cmdRenice(s, a); };
    COMMANDS.jobs = function (s, a) { return cmdJobs(s, a); };
    COMMANDS.fg = function (s, a) { return cmdFg(s, a, false); };
    COMMANDS.bg = function (s, a) { return cmdFg(s, a, true); };
    COMMANDS.sleep = function (s, a) {
      if (!a[0] || !/^\d+(\.\d+)?[smhd]?$/.test(a[0])) return bad("sleep: missing operand");
      return ok("");
    };
    COMMANDS.screen = function (s, a) { return cmdSessions(s, "screen", a); };
    COMMANDS.tmux = function (s, a) { return cmdSessions(s, "tmux", a); };
    COMMANDS.env = function (s, a, i) { return cmdEnv(s, a, i); };
    COMMANDS.printenv = function (s, a) { return cmdPrintenv(s, a); };
    COMMANDS.command = function (s, a, i) { return cmdCommand(s, a, i); };
    COMMANDS.which = function (s, a) { return cmdWhich(s, a); };
    COMMANDS.unalias = function (s, a) {
      if (a[0] === "-a") { s.aliases = {}; return ok(""); }
      for (var i = 0; i < a.length; i++) { if (!s.aliases[a[i]]) return bad("bash: unalias: " + a[i] + ": not found"); delete s.aliases[a[i]]; }
      return ok("");
    };
    COMMANDS.umask = function (s, a) { if (a[0]) { s.umask = a[0]; return ok(""); } return ok((s.umask || "0022") + "\n"); };
    COMMANDS.lsblk = function (s, a) { return cmdLsblk(s, a); };
    COMMANDS.blkid = function (s, a) { return s.user === "root" ? cmdBlkid(s, a) : cmdBlkid(s, a); };
    COMMANDS.mount = function (s, a) { return cmdMount(s, a); };
    COMMANDS.umount = function (s, a) { return cmdUmount(s, a); };
    COMMANDS.findmnt = function (s, a) { return cmdFindmnt(s, a); };
    COMMANDS.fdisk = function (s, a) { return cmdFdisk(s, a); };
    COMMANDS.parted = function (s, a) { return cmdParted(s, a); };
    COMMANDS.gparted = function () { return bad("lab: GParted is a desktop window, so it cannot open in this terminal. It drives the same steps as parted: pick a disk, Device > Create Partition Table, then Partition > New, then Apply.\nPractise the same thing here with: sudo parted /dev/sdc mklabel gpt"); };
    COMMANDS.e2label = function (s, a) { return cmdLabel(s, "e2label", a); };
    COMMANDS.fatlabel = function (s, a) { return cmdLabel(s, "fatlabel", a); };
    COMMANDS["mkfs.ext4"] = function (s, a) { return cmdMkfs(s, "ext4", a); };
    COMMANDS["mkfs.xfs"] = function (s, a) { return cmdMkfs(s, "xfs", a); };
    COMMANDS["mkfs.vfat"] = function (s, a) { return cmdMkfs(s, "vfat", a); };
    COMMANDS["mkfs.fat"] = function (s, a) { return cmdMkfs(s, "vfat", a); };
    COMMANDS.mkfs = function (s, a) {
      var t = a.indexOf("-t");
      var type = t === -1 ? "ext2" : a[t + 1];
      var rest = t === -1 ? a : a.slice(0, t).concat(a.slice(t + 2));
      if (["ext4", "xfs", "vfat", "fat"].indexOf(type) === -1) return bad("mkfs: this lab makes ext4, xfs, and vfat. Example: sudo mkfs -t ext4 /dev/sdb1");
      return cmdMkfs(s, type === "fat" ? "vfat" : type, rest);
    };
    COMMANDS.resize2fs = function (s, a) { return cmdResize2fs(s, a); };
    COMMANDS.xfs_growfs = function (s, a) { return cmdXfsGrow(s, a); };
    COMMANDS.dd = function (s, a) { return cmdDd(s, a); };
    COMMANDS.smartctl = function (s, a) { return cmdSmartctl(s, a); };
    ["pvcreate", "vgcreate", "vgextend", "vgreduce", "lvcreate", "lvextend", "lvresize", "lvreduce", "lvremove", "vgremove", "pvremove", "lvconvert", "lvchange", "pvs", "vgs", "lvs", "pvdisplay", "vgdisplay", "lvdisplay"].forEach(function (tool) {
      COMMANDS[tool] = function (s, a) { return cmdLvm(s, tool, a); };
    });
    COMMANDS.zpool = function (s, a) { return cmdZpool(s, a); };
    COMMANDS.zfs = function (s, a) { return cmdZfs(s, a); };
    COMMANDS.cryptsetup = function (s, a) { return cmdCryptsetup(s, a); };
    COMMANDS["grub-mkpasswd-pbkdf2"] = function () { return ok("Enter password: (the lab typed a practice password)\nReenter password: (typed again)\nPBKDF2 hash of your password is grub.pbkdf2.sha512.10000.4C61622D50726163746963652D53616C74.9E0B7A1F3C55D2A8B6E4F1C0D9A7B3E2F5C8A1D4B7E0F3A6C9D2E5B8A1F4C7D0\n"); };
    COMMANDS["update-grub"] = function (s, a) { return needRoot(s, "update-grub", a, "/usr/sbin/grub-mkconfig: You must run this as root") || ok("Sourcing file `/etc/default/grub'\nGenerating grub configuration file ...\nFound linux image: /boot/vmlinuz-6.8.0-45-generic\nFound initrd image: /boot/initrd.img-6.8.0-45-generic\ndone\n"); };
    COMMANDS.vim = function () { return bad("vim: this lab has no full-screen editor. Press Esc :q! on a real host if you are stuck in vim. Here, use the script box."); };
    COMMANDS.less = function (s, a) { return cmdLess(s, a); };
    COMMANDS.printf = function (s, a) { return cmdPrintf(a); };
    COMMANDS.tr = function (s, a, i) { return cmdTr(a, i); };
    COMMANDS.read = function (s, a, i) { return cmdRead(s, a, i); };
    COMMANDS.source = function (s, a) { return cmdSource(s, a); };
    COMMANDS["."] = function (s, a) { return cmdSource(s, a); };
    COMMANDS.shopt = function (s, a) { return cmdShopt(s, a); };
    COMMANDS.ulimit = function (s, a) { return cmdUlimit(a); };
  }

  function expandTrSet(s) {
    var out = "";
    var classes = { "[:upper:]": "A-Z", "[:lower:]": "a-z", "[:digit:]": "0-9", "[:alpha:]": "A-Za-z", "[:alnum:]": "A-Za-z0-9", "[:space:]": " \t\n", "[:blank:]": " \t", "[:punct:]": "!\"#$%&'()*+,./:;<=>?@[\\]^_`{|}~" };
    Object.keys(classes).forEach(function (k) { s = s.split(k).join(classes[k]); });
    s = s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i + 1) === "-" && s.charAt(i + 2)) {
        var a = s.charCodeAt(i);
        var b = s.charCodeAt(i + 2);
        var step = a <= b ? 1 : -1;
        for (var c = a; step > 0 ? c <= b : c >= b; c += step) out += String.fromCharCode(c);
        i += 2;
      } else out += s.charAt(i);
    }
    return out;
  }
  function cmdPrintf(argv) {
    if (!argv.length) return bad("printf: missing format. Example: printf 'Hello %s\\n' ana");
    var fmt = argv[0].replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
    var args = argv.slice(1);
    var slots = (fmt.match(/%[-0]?\d*(?:\.\d+)?[sdifcx]/g) || []).length;
    var out = "";
    var at = 0;
    var turns = 0;
    do {
      var chunk = args.slice(at, at + Math.max(slots, 1));
      while (chunk.length < slots) chunk.push("");
      out += awkFormat([fmt].concat(chunk.map(function (v) { return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v; })));
      at += slots;
      turns++;
    } while (slots && at < args.length && turns < 100);
    return ok(out);
  }
  function cmdTr(argv, stdin) {
    var flags = "";
    var sets = [];
    argv.forEach(function (a) { if (/^-[dsc]+$/.test(a)) flags += a.slice(1); else sets.push(a); });
    var del = flags.indexOf("d") !== -1, squeeze = flags.indexOf("s") !== -1, comp = flags.indexOf("c") !== -1;
    if (!sets.length || (!del && !squeeze && sets.length < 2)) return bad("tr: need two sets. Example: echo ana | tr a-z A-Z   (or tr -d '0-9', tr -s ' ')");
    var from = expandTrSet(sets[0]);
    function inFrom(ch) { var has = from.indexOf(ch) !== -1; return comp ? !has : has; }
    var text = stdin || "";
    var out = "";
    if (del) {
      for (var d = 0; d < text.length; d++) if (!inFrom(text.charAt(d))) out += text.charAt(d);
      text = out;
      if (!squeeze) return ok(out);
      from = expandTrSet(sets[1] || sets[0]);
      out = "";
    } else if (sets.length >= 2) {
      var to = expandTrSet(sets[1]);
      if (!to.length) return bad("tr: empty set");
      for (var k = 0; k < text.length; k++) {
        var ch = text.charAt(k);
        var at = from.indexOf(ch);
        if (comp) out += at === -1 ? to.charAt(to.length - 1) : ch;
        else out += at !== -1 ? to.charAt(Math.min(at, to.length - 1)) : ch;
      }
      if (!squeeze) return ok(out);
      text = out;
      from = to;
      comp = false;
      out = "";
    }
    for (var s = 0; s < text.length; s++) {
      var c = text.charAt(s);
      if (out.length && out.charAt(out.length - 1) === c && inFrom(c)) continue;
      out += c;
    }
    return ok(out);
  }
  function cmdRead(state, argv, stdin) {
    if (!stdin) return bad("read: this lab does not wait for the keyboard. Example: read line < notes.txt");
    var i = 0;
    if (argv[0] === "-r") i = 1;
    var name = argv[i] || "REPLY";
    state.env[name] = String(stdin).split("\n")[0];
    return ok("");
  }
  function cmdSource(state, argv) {
    if (!argv[0]) return bad("source: name a file");
    var path = resolve(state, argv[0]);
    var got = readPath(state, path);
    if (got.code) return bad("source: " + argv[0] + ": No such file or directory");
    return execLines(state, preprocess(got.stdout));
  }
  function cmdLess(state, argv) {
    if (!argv[0]) return bad("less: name a file. Example: less app.log");
    var got = readPath(state, resolve(state, argv[0]));
    if (got.code) return got;
    return ok(got.stdout + "less: end. On a real host, press q to leave, space for the next page, b for the previous page.\n");
  }
  function cmdShopt(state, argv) {
    var flag = argv[0];
    var name = argv[1];
    if ((flag === "-s" || flag === "-u") && (name === "nullglob" || name === "dotglob")) {
      state[name] = flag === "-s";
      return ok("");
    }
    if (flag === "login_shell" || name === "login_shell") return ok("login_shell    " + (state.loginShell === false ? "off" : "on") + "\n");
    return ok("nullglob " + (state.nullglob ? "on" : "off") + "\ndotglob " + (state.dotglob ? "on" : "off") + "\nlogin_shell " + (state.loginShell === false ? "off" : "on") + "\n");
  }
  function cmdUlimit(argv) {
    if (!argv.length || argv[0] === "-u") return ok("256\n");
    return bad("ulimit: this lab shows -u, the maximum number of processes for one user");
  }

  function assign(state, line) {
    var eq = line.indexOf("=");
    var name = line.slice(0, eq);
    var rhs = line.slice(eq + 1);
    if (rhs.charAt(0) === "(" && rhs.charAt(rhs.length - 1) === ")") {
      var inner = rhs.slice(1, -1).trim();
      var parts = inner ? lex(inner).filter(function (t) { return t.word != null; }) : [];
      var values = [];
      for (var i = 0; i < parts.length; i++) values = values.concat(prepare(state, parts[i]));
      state.arrays[name] = values;
      state.env[name] = values.join(" ");
      return ok("");
    }
    var mode = "none";
    if (rhs.charAt(0) === "'" && rhs.charAt(rhs.length - 1) === "'") { mode = "single"; rhs = rhs.slice(1, -1); }
    else if (rhs.charAt(0) === "\"" && rhs.charAt(rhs.length - 1) === "\"") { mode = "double"; rhs = rhs.slice(1, -1); }
    state.env[name] = mode === "single" ? rhs : expandVars(state, rhs);
    return ok("");
  }

  function scriptPath(state, cmd) {
    if (!cmd) return null;
    if (cmd.indexOf("/") !== -1) {
      if (/^\/(usr\/)?s?bin\/[\w.-]+$/.test(cmd)) return null;
      return resolve(state, cmd);
    }
    var dirs = String(state.env.PATH || "").split(":");
    for (var i = 0; i < dirs.length; i++) {
      if (!dirs[i] || dirs[i] === "/usr/bin" || dirs[i] === "/bin") continue;
      var full = (dirs[i].replace(/\/$/, "") + "/" + cmd).replace(/^~/, state.env.HOME);
      if (state.files[full] && state.files[full].kind === "file") return full;
    }
    return null;
  }
  function runFile(state, cmd, p, argv) {
    var node = state.files[p];
    if (!node) return bad("bash: " + cmd + ": No such file or directory", 127);
    if (node.kind !== "file") return bad("bash: " + cmd + ": Is a directory", 126);
    if (!allows(node, state, 1) || !allows(node, state, 4)) return bad("bash: " + cmd + ": Permission denied", 126);
    return inChild(state, function () {
      var prev = state.pos;
      state.pos = argv;
      var res = runScript(state, node.text);
      state.pos = prev;
      return res;
    });
  }
  function inChild(state, fn) {
    var exported = state.exported || {};
    var saved = state.env;
    var env = {};
    Object.keys(saved).forEach(function (k) { if (exported[k]) env[k] = saved[k]; });
    state.env = env;
    var savedCwd = state.cwd;
    try { return fn(); } finally { state.env = saved; state.cwd = savedCwd; }
  }

  function runSimple(state, tokens, stdin) {
    var redirects = { out: null, append: false, err: null, errAppend: false, input: null, dup: null };
    var words = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.op === "2>&1") {
        redirects.dup = redirects.out != null ? "file" : "stdout";
        continue;
      }
      if (t.op) {
        var next = tokens[++i];
        if (!next || next.word == null) return bad("bash: syntax error near redirection");
        var target = prepare(state, next)[0];
        if (t.op === "&>" || t.op === "&>>") { redirects.out = target; redirects.append = t.op === "&>>"; redirects.dup = "file"; }
        else if (t.op === ">" || t.op === ">>") {
          redirects.out = target;
          redirects.append = t.op === ">>";
          if (redirects.dup === "stdout") redirects.dup = "terminal";
        }
        else if (t.op === "2>" || t.op === "2>>") { redirects.err = target; redirects.errAppend = t.op === "2>>"; }
        else if (t.op === "<") redirects.input = target;
        continue;
      }
      words = words.concat(prepare(state, t));
    }
    if (!words.length) return ok("");
    if (redirects.input) {
      var fed = readPath(state, resolve(state, redirects.input));
      if (fed.code) return fed;
      stdin = fed.stdout;
    }
    var cmd = words[0];
    var argv = words.slice(1);
    if (state.aliases[cmd]) {
      var replaced = lex(state.aliases[cmd]).filter(function (tok) { return tok.word != null; });
      var expanded = [];
      replaced.forEach(function (tok) { expanded = expanded.concat(prepare(state, tok)); });
      cmd = expanded[0];
      argv = expanded.slice(1).concat(argv);
    }
    var res;
    var onDisk = String(cmd).match(/^\/(?:usr\/)?s?bin\/([\w.-]+)$/);
    if (onDisk && COMMANDS[onDisk[1]]) cmd = onDisk[1];
    if (state.fns[cmd]) {
      var prev = state.pos;
      state.pos = argv;
      res = execLines(state, state.fns[cmd].slice());
      state.pos = prev;
    } else if (cmd === "[") res = testCmd(state, argv, "]");
    else if (cmd === "[[") res = testCmd(state, argv, "]]");
    else if (scriptPath(state, cmd)) res = runFile(state, cmd, scriptPath(state, cmd), argv);
    else if (!visible(state, cmd)) res = bad("bash: " + cmd + ": command not found");
    else if (COMMANDS[cmd]) res = COMMANDS[cmd](state, argv, stdin || "");
    else res = bad("bash: " + cmd + ": command not found");
    if (redirects.dup === "stdout" || redirects.dup === "file") {
      res = { stdout: (res.stdout || "") + (res.stderr || ""), stderr: "", code: res.code, clear: res.clear };
    }
    if (redirects.err && res.stderr) {
      writeFile(state, resolve(state, redirects.err), res.stderr, redirects.errAppend);
      res = { stdout: res.stdout, stderr: "", code: res.code, clear: res.clear };
    }
    if (redirects.out != null) {
      var written = writeFile(state, resolve(state, redirects.out), res.stdout || "", redirects.append);
      if (written.code) return written;
      res = { stdout: "", stderr: res.stderr, code: res.code, clear: res.clear };
    }
    return res;
  }

  function testCmd(state, argv, close) {
    var a = argv.slice();
    if (!(a.length && a[a.length - 1] === close)) return bad((close === "]" ? "[" : "[[") + ": missing " + close);
    a.pop();
    function code(yes) { return ok("", yes ? 0 : 1); }
    function nodeAt(p) {
      var path = resolve(state, p);
      var hit = follow(state, path, 0);
      return hit ? hit.node : state.files[path];
    }
    if (a.length === 2 && a[0] === "-t") return code(false);
    if (a.length === 2 && (a[0] === "-f" || a[0] === "-d" || a[0] === "-z" || a[0] === "-n")) {
      if (a[0] === "-z") return code(a[1] === "");
      if (a[0] === "-n") return code(a[1] !== "");
      var node = nodeAt(a[1]);
      if (a[0] === "-f") return code(!!node && node.kind === "file");
      return code(!!node && node.kind === "dir");
    }
    if (a.length === 3) {
      var l = a[0], op = a[1], r = a[2];
      if (op === "=" || op === "==") return code(l === r);
      if (op === "!=") return code(l !== r);
      if ("-eq -ne -lt -le -gt -ge".split(" ").indexOf(op) !== -1) {
        if (!/^-?[0-9]+$/.test(l) || !/^-?[0-9]+$/.test(r)) return bad("[: integer expected");
        var ln = Number(l), rn = Number(r);
        var map = { "-eq": ln === rn, "-ne": ln !== rn, "-lt": ln < rn, "-le": ln <= rn, "-gt": ln > rn, "-ge": ln >= rn };
        return code(map[op]);
      }
    }
    return bad("[: this lab supports = != -eq -ne -lt -le -gt -ge -f -d -z -n -t");
  }

  function splitTop(text, seps) {
    var parts = [];
    var buf = "";
    var q = null;
    var depth = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (q) {
        buf += c;
        if (c === "\\" && q === "\"") { buf += text.charAt(i + 1); i++; continue; }
        if (c === q) q = null;
        continue;
      }
      if (c === "\\") { buf += c + text.charAt(i + 1); i++; continue; }
      if (c === "'" || c === "\"") { q = c; buf += c; continue; }
      if (c === "(" ) { depth++; buf += c; continue; }
      if (c === ")") { depth--; buf += c; continue; }
      if (depth === 0) {
        var hit = null;
        for (var s = 0; s < seps.length; s++) {
          var sep = seps[s];
          if (text.substr(i, sep.length) !== sep) continue;
          if (sep === "|" && (text.charAt(i + 1) === "|" || text.charAt(i - 1) === "|")) continue;
          if (sep === "|" && text.charAt(i - 1) === ">") continue;
          if (sep === "&" && (text.charAt(i + 1) === "&" || text.charAt(i - 1) === "&" || text.charAt(i + 1) === ">" || text.charAt(i - 1) === ">")) continue;
          hit = sep;
          break;
        }
        if (hit) { parts.push({ text: buf, sep: hit }); buf = ""; i += hit.length - 1; continue; }
      }
      buf += c;
    }
    parts.push({ text: buf, sep: null });
    return parts;
  }
  function runList(state, text, stdin) {
    var parts = splitTop(text, ["&&", "||", ";"]);
    var out = "", err = "", code = 0, clear = false;
    var prevSep = null;
    for (var i = 0; i < parts.length; i++) {
      var piece = parts[i].text.trim();
      var skip = (prevSep === "&&" && code !== 0) || (prevSep === "||" && code === 0);
      prevSep = parts[i].sep || prevSep;
      if (!piece) { if (parts[i].sep && parts[i].sep !== ";") return bad("bash: syntax error near unexpected token `" + parts[i].sep + "'"); continue; }
      if (skip) { prevSep = parts[i].sep; continue; }
      prevSep = parts[i].sep;
      var res = i === 0 && stdin ? runPipeline(state, piece, stdin) : runLine(state, piece);
      out += res.stdout || "";
      err += res.stderr || "";
      code = res.code;
      if (res.clear) clear = true;
      if (state.errexit && code !== 0 && parts[i].sep !== "||" && parts[i].sep !== "&&") break;
    }
    return { stdout: out, stderr: err, code: code, clear: clear };
  }
  function runPipeline(state, line, stdin) {
    var pieces = splitTop(line, ["|"]);
    var stages = pieces.map(function (p) { return p.text.trim(); });
    var input = stdin || "";
    var stderr = "";
    var code = 0;
    var clear = false;
    var failed = 0;
    for (var s = 0; s < stages.length; s++) {
      if (!stages[s]) return bad("bash: syntax error near unexpected token `|'");
      var res;
      var group = stages[s].match(/^\(([\s\S]*)\)\s*((?:[0-9&]?>>?\s*\S+\s*)*)$/);
      var brace = stages[s].match(/^\{([\s\S]*);\s*\}\s*((?:[0-9&]?>>?\s*\S+\s*)*)$/);
      if (group || brace) {
        var inner = (group || brace)[1];
        var redir = (group || brace)[2].trim();
        var saved = group ? { cwd: state.cwd, env: Object.assign({}, state.env) } : null;
        res = runList(state, inner, input);
        if (saved) { state.cwd = saved.cwd; state.env = saved.env; }
        if (redir) {
          var rt = lex("true " + redir);
          var outTok = null, app = false;
          for (var r = 0; r < rt.length; r++) if (rt[r].op === ">" || rt[r].op === ">>") { outTok = rt[r + 1]; app = rt[r].op === ">>"; }
          if (outTok) { var w = writeFile(state, resolve(state, outTok.word), res.stdout || "", app); if (w.code) return w; res = { stdout: "", stderr: res.stderr, code: res.code, clear: false }; }
        }
      } else res = runSimple(state, lex(stages[s]), input);
      if (res.stderr) stderr += res.stderr;
      input = res.stdout || "";
      code = res.code;
      if (res.clear) clear = true;
      if (res.code !== 0) failed = res.code;
    }
    if (state.pipefail && failed) code = failed;
    return { stdout: input, stderr: stderr, code: code, clear: clear };
  }

  function runLine(state, line) {
    var text = String(line || "");
    var background = false;
    if (/[^&]&\s*$/.test(text) && !/[0-9]>&\s*$/.test(text)) {
      text = text.replace(/\s*&\s*$/, "");
      background = true;
    }
    var trimmed = text.trim();
    if (!trimmed) return finish(state, ok(""));
    if (background) {
      var num = state.jobs.length + 1;
      var pid = 4100 + num * 7;
      state.jobs.push({ num: num, pid: pid, cmd: trimmed, state: "Running" });
      var bg = runLine(state, trimmed);
      return finish(state, { stdout: "[" + num + "] " + pid + "\n" + (bg.stdout || ""), stderr: bg.stderr, code: 0, clear: false });
    }
    var prefix = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=([^\s'"(]*)\s+(\S.*)$/);
    if (prefix && !/^[A-Za-z_][A-Za-z0-9_]*=/.test(prefix[3]) && splitTop(trimmed, ["&&", "||", ";", "|"]).length === 1) {
      var had = Object.prototype.hasOwnProperty.call(state.env, prefix[1]);
      var old = state.env[prefix[1]];
      state.exported = state.exported || {};
      var wasExp = state.exported[prefix[1]];
      state.env[prefix[1]] = prefix[2];
      state.exported[prefix[1]] = true;
      var inner = runLine(state, prefix[3]);
      if (had) state.env[prefix[1]] = old;
      else delete state.env[prefix[1]];
      if (!wasExp) delete state.exported[prefix[1]];
      return inner;
    }
    var timed = false;
    if (trimmed.indexOf("time ") === 0) {
      timed = true;
      trimmed = trimmed.slice(5).trim();
    }
    try {
      var res;
      var list = splitTop(trimmed, ["&&", "||", ";"]);
      if (/^(if|for|while|until)\s/.test(trimmed) || /^[A-Za-z_]\w*\(\)\s*\{/.test(trimmed)) res = runScript(state, trimmed);
      else if (list.length > 1) res = runList(state, trimmed, "");
      else if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(trimmed)) res = assign(state, trimmed);
      else if (/^!\s/.test(trimmed)) { res = runPipeline(state, trimmed.slice(2), ""); res = { stdout: res.stdout, stderr: res.stderr, code: res.code ? 0 : 1, clear: res.clear }; }
      else res = runPipeline(state, trimmed, "");
      if (timed) res.stderr = (res.stderr || "") + "real 0m0.012s\nuser 0m0.004s\nsys 0m0.000s\n";
      return finish(state, res);
    } catch (e) {
      return finish(state, nounsetResult(e));
    }
  }

  function preprocess(src) {
    var out = "";
    var q = null;
    for (var i = 0; i < src.length; i++) {
      var c = src.charAt(i);
      if (q) {
        out += c;
        if (c === q) q = null;
        continue;
      }
      if (c === "'" || c === "\"") { q = c; out += c; continue; }
      if (c === "\\" && src.charAt(i + 1) && src.charAt(i + 1) !== "\n") { out += c + src.charAt(i + 1); i++; continue; }
      if (c === "#" && (i === 0 || /\s/.test(src.charAt(i - 1)))) {
        while (i + 1 < src.length && src.charAt(i + 1) !== "\n") i++;
        continue;
      }
      if (c === ";") { out += "\n"; continue; }
      out += c;
    }
    var rows = [];
    out.split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s.length; }).forEach(function (s) {
      var kw = s.match(/^(do|then|else)\s+(.+)$/);
      if (kw) rows.push(kw[1], kw[2]);
      else rows.push(s);
    });
    return rows;
  }

  function readUntil(lines, i, stop) {
    var body = [];
    var j = i;
    while (j < lines.length && stop.indexOf(lines[j]) === -1) body.push(lines[j++]);
    return { body: body, end: j };
  }
  function execLines(state, lines) {
    var stdout = "";
    var stderr = "";
    var code = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line === "do" || line === "then" || line === "{") continue;
      if (line === "return" || line.indexOf("return ") === 0) {
        var raw = line === "return" ? "0" : line.slice(7).trim();
        var rc = /^-?\d+$/.test(raw) ? Number(raw) : 0;
        return { stdout: stdout, stderr: stderr, code: rc, clear: false };
      }
      var fn = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{?$/);
      if (fn) {
        var start = i + 1;
        if (lines[start] === "{") start++;
        var block = readUntil(lines, start, ["}"]);
        state.fns[fn[1]] = block.body;
        i = block.end;
        continue;
      }
      if (line.indexOf("if ") === 0) {
        var cond = line.slice(3).trim();
        var j = i + 1;
        if (lines[j] === "then") j++;
        var thenBody = [];
        var elseBody = [];
        var inElse = false;
        while (j < lines.length && lines[j] !== "fi") {
          if (lines[j] === "else") { inElse = true; j++; continue; }
          (inElse ? elseBody : thenBody).push(lines[j]);
          j++;
        }
        var condRes = runLine(state, cond);
        stderr += condRes.stderr;
        var branch = condRes.code === 0 ? thenBody : elseBody;
        var sub = execLines(state, branch);
        stdout += sub.stdout;
        stderr += sub.stderr;
        code = sub.code;
        if (state.errexit && sub.code !== 0) return { stdout: stdout, stderr: stderr, code: code, clear: false };
        i = j;
        continue;
      }
      if (line.indexOf("for ") === 0) {
        var fm = line.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+)$/);
        if (!fm) return bad("bash: bad for loop");
        var fj = i + 1;
        if (lines[fj] === "do") fj++;
        var fbody = readUntil(lines, fj, ["done"]);
        var items = [];
        lex(fm[2]).filter(function (t) { return t.word != null; }).forEach(function (tok) {
          items = items.concat(prepare(state, tok));
        });
        var turns = 0;
        items.forEach(function (item) {
          if (turns++ > 40) return;
          state.env[fm[1]] = item;
          var bodyRes = execLines(state, fbody.body);
          stdout += bodyRes.stdout;
          stderr += bodyRes.stderr;
          code = bodyRes.code;
        });
        if (turns > 40) stderr += "bash: stopped the loop after 40 turns\n";
        i = fbody.end;
        continue;
      }
      if (line.indexOf("while ") === 0) {
        var wcond = line.slice(6).trim();
        var wj = i + 1;
        if (lines[wj] === "do") wj++;
        var wbody = readUntil(lines, wj, ["done"]);
        var guard = 0;
        code = 0;
        while (guard++ < 40) {
          var wc = runLine(state, wcond);
          stderr += wc.stderr;
          if (wc.code !== 0) break;
          var wr = execLines(state, wbody.body);
          stdout += wr.stdout;
          stderr += wr.stderr;
          code = wr.code;
          if (state.errexit && wr.code !== 0) return { stdout: stdout, stderr: stderr, code: code, clear: false };
        }
        if (guard > 40) stderr += "bash: stopped the loop after 40 turns\n";
        i = wbody.end;
        continue;
      }
      var res = runLine(state, line);
      stdout += res.stdout;
      stderr += res.stderr;
      code = res.code;
      if (line === "exit" || line.indexOf("exit ") === 0) return { stdout: stdout, stderr: stderr, code: code, clear: false };
      if (state.errexit && res.code !== 0) return { stdout: stdout, stderr: stderr, code: code, clear: false };
    }
    return { stdout: stdout, stderr: stderr, code: code, clear: false };
  }

  function runScript(state, src) {
    try {
      var lines = preprocess(String(src || ""));
      return execLines(state, lines);
    } catch (e) {
      return nounsetResult(e);
    }
  }

  function expandHistory(state, line) {
    if (line.indexOf("!") === -1) return { line: line };
    var h = state.history;
    var lastWords = h.length ? h[h.length - 1].trim().split(/\s+/) : [];
    var failed = null;
    var pieces = line.split(/('[^']*')/);
    var out = pieces.map(function (piece) {
      if (piece.charAt(0) === "'") return piece;
      return piece.replace(/!!|!\$|!-?\d+|!([A-Za-z][\w-]*)/g, swap);
    }).join("");
    function swap(m, prefix) {
      if (m === "!!") { if (!h.length) failed = m; return h[h.length - 1] || ""; }
      if (m === "!$") { if (!h.length) failed = m; return lastWords[lastWords.length - 1] || ""; }
      if (prefix) {
        for (var i = h.length - 1; i >= 0; i--) if (h[i].indexOf(prefix) === 0) return h[i];
        failed = m;
        return "";
      }
      var n = Number(m.slice(1));
      var pick = n < 0 ? h[h.length + n] : h[n - 1];
      if (pick == null) failed = m;
      return pick || "";
    }
    if (failed) return { error: "bash: " + failed + ": event not found\n" };
    return { line: out, changed: out !== line };
  }
  function runTyped(state, line) {
    var text = String(line || "");
    var ex = expandHistory(state, text);
    if (ex.error) return finish(state, { stdout: "", stderr: ex.error, code: 1, clear: false, shown: text });
    var ctl = String(state.env.HISTCONTROL || "");
    var skipSpace = /ignorespace|ignoreboth/.test(ctl) && /^\s/.test(ex.line);
    var skipDup = /ignoredups|ignoreboth/.test(ctl) && state.history[state.history.length - 1] === ex.line;
    if (ex.line.trim() && !skipSpace && !skipDup) state.history.push(ex.line);
    var res = runLine(state, ex.line);
    var copy = { stdout: res.stdout, stderr: res.stderr, code: res.code, clear: res.clear, shown: ex.line };
    if (ex.changed) copy.stdout = ex.line + "\n" + (copy.stdout || "");
    return copy;
  }

  function runLines(state, list) {
    var stdout = "";
    var stderr = "";
    var code = 0;
    list.forEach(function (line) {
      var res = runLine(state, line);
      stdout += res.stdout;
      stderr += res.stderr;
      code = res.code;
    });
    return { stdout: stdout, stderr: stderr, code: code };
  }

  function mount(el) {
    if (!el || el.getAttribute("data-ready") === "yes") return;
    el.setAttribute("data-ready", "yes");
    var state = createState();
    var screen = el.querySelector(".lab-screen");
    var input = el.querySelector(".lab-input");
    var form = el.querySelector(".lab-form");
    var promptEl = el.querySelector(".lab-prompt");
    var area = el.querySelector(".lab-script");
    var local = [];
    var hi = 0;
    function paintPrompt() { if (promptEl) promptEl.textContent = prompt(state); }
    function add(text, cls) {
      if (!text) return;
      var row = document.createElement("div");
      row.className = "lab-line" + (cls ? " " + cls : "");
      row.textContent = text.replace(/\n$/, "");
      screen.appendChild(row);
      screen.scrollTop = screen.scrollHeight;
    }
    function play(line) {
      local.push(line);
      hi = local.length;
      add(prompt(state) + " " + line, "cmd");
      var res = runTyped(state, line);
      if (res.clear) screen.textContent = "";
      add(res.stdout, "out");
      add(res.stderr, "err");
      paintPrompt();
    }
    add("Practice computer on lab. This is not your PC.", "muted");
    add("Type a command and press Enter. Reset lab puts the practice files back.", "muted");
    paintPrompt();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      play(input.value);
      input.value = "";
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && !e.shiftKey) {
        var got = complete(state, input.value.slice(0, input.selectionStart));
        var rest = input.value.slice(input.selectionStart);
        input.value = got.text + rest;
        input.setSelectionRange(got.text.length, got.text.length);
        if (got.options.length) add(got.options.join("   "), "muted");
        e.preventDefault();
      } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        screen.textContent = "";
        e.preventDefault();
      } else if (e.ctrlKey && (e.key === "c" || e.key === "C") && input.selectionStart === input.selectionEnd) {
        add(prompt(state) + " " + input.value + "^C", "cmd");
        input.value = "";
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        if (hi > 0) { hi--; input.value = local[hi]; }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (hi < local.length) hi++;
        input.value = local[hi] || "";
        e.preventDefault();
      } else if (e.ctrlKey && (e.key === "a" || e.key === "A")) {
        input.setSelectionRange(0, 0);
        e.preventDefault();
      } else if (e.ctrlKey && (e.key === "e" || e.key === "E")) {
        var end = input.value.length;
        input.setSelectionRange(end, end);
        e.preventDefault();
      } else if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        input.value = input.value.slice(input.selectionStart);
        input.setSelectionRange(0, 0);
        e.preventDefault();
      } else if (e.ctrlKey && (e.key === "w" || e.key === "W")) {
        var at = input.selectionStart;
        var left = input.value.slice(0, at).replace(/\s*\S+\s*$/, "");
        input.value = left + input.value.slice(at);
        input.setSelectionRange(left.length, left.length);
        e.preventDefault();
      }
    });
    var tryBtn = el.querySelector(".lab-try");
    if (tryBtn) tryBtn.addEventListener("click", function () {
      String(el.getAttribute("data-example") || "").split("\n").filter(function (line) { return line.trim() !== ""; }).forEach(play);
    });
    var runBtn = el.querySelector(".lab-run-script");
    if (runBtn && area) runBtn.addEventListener("click", function () {
      add(prompt(state) + "  script", "cmd");
      var res = runScript(state, area.value);
      add(res.stdout, "out");
      add(res.stderr, "err");
      paintPrompt();
    });
    var resetBtn = el.querySelector(".lab-reset");
    if (resetBtn) resetBtn.addEventListener("click", function () {
      reset(state);
      local = [];
      hi = 0;
      screen.textContent = "";
      add("Practice computer reset. The practice files are back.", "muted");
      paintPrompt();
    });
  }

  function complete(state, text) {
    var m = text.match(/^(.*?)(\S*)$/);
    var head = m[1];
    var word = m[2];
    var first = !head.trim();
    var options = [];
    if (first && word.indexOf("/") === -1) {
      options = Object.keys(COMMANDS).concat(Object.keys(state.fns), Object.keys(state.aliases))
        .filter(function (c) { return c.indexOf(word) === 0 && /^[a-z]/.test(c); })
        .filter(function (c, i, all) { return all.indexOf(c) === i; }).sort();
    } else {
      var slash = word.lastIndexOf("/");
      var dirPart = slash === -1 ? "" : word.slice(0, slash + 1);
      var stem = slash === -1 ? word : word.slice(slash + 1);
      var abs = resolve(state, dirPart.replace(/^~/, state.home) || ".");
      options = children(state, abs)
        .filter(function (ch) { return ch.name.indexOf(stem) === 0 && (stem.charAt(0) === "." || ch.name.charAt(0) !== "."); })
        .map(function (ch) { return dirPart + ch.name + (ch.node.kind === "dir" ? "/" : ""); }).sort();
    }
    if (!options.length) return { text: text, options: [] };
    if (options.length === 1) {
      var done = options[0];
      return { text: head + done + (/\/$/.test(done) ? "" : " "), options: [] };
    }
    var common = options[0];
    options.forEach(function (o) { while (o.indexOf(common) !== 0) common = common.slice(0, -1); });
    return { text: head + common, options: options };
  }

  function mountAll() {
    document.querySelectorAll(".lab").forEach(mount);
  }

  register();
  return { createState: createState, reset: reset, prompt: prompt, runLine: runLine, runScript: runScript, runLines: runLines, runTyped: runTyped, complete: complete, mount: mount, mountAll: mountAll };
});

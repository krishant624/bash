/* Practice computer for the Bash course. It is not a real shell and it never touches the reader's files. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.BashLab = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BUILTIN = { cd: 1, alias: 1, export: 1, set: 1, unset: 1, history: 1, help: 1, pwd: 1, echo: 1, "[": 1, "[[": 1, exit: 1, type: 1, crontab: 1 };

  function file(text, mode) {
    return { kind: "file", mode: mode == null ? 420 : mode, owner: "ana", group: "ana", text: text };
  }
  function newDir(owner, mode) {
    return { kind: "dir", mode: mode == null ? 493 : mode, owner: owner || "ana", group: owner === "root" ? "root" : "ana", text: "" };
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
    return {
      user: "ana",
      group: "ana",
      groups: ["ana", "staff"],
      host: "lab",
      home: "/home/ana",
      cwd: "/home/ana/work",
      prev: "/home/ana/work",
      env: { HOME: "/home/ana", USER: "ana", PATH: "/usr/bin", SHELL: "/bin/bash" },
      arrays: {},
      fns: {},
      aliases: {},
      pos: [],
      files: {
        "/": newDir("root", 493),
        "/home": newDir("root", 493),
        "/home/ana": newDir("ana", 493),
        "/home/ana/.bashrc": file("# Saved aliases for ana\nalias ll='ls -alF'\n"),
        "/home/ana/work": newDir("ana", 493),
        "/home/ana/work/notes.txt": file(notes),
        "/home/ana/work/app.log": file(log),
        "/home/ana/work/names.txt": file("ken\nana\nana\nmina\n"),
        "/home/ana/work/sizes.txt": file("10\n2\n1\n"),
        "/home/ana/work/reports": newDir("ana", 493),
        "/home/ana/work/reports/monday.txt": file("disk 80 percent\n")
      },
      remote: {},
      history: [],
      lastCode: 0,
      errexit: false,
      nounset: false,
      pipefail: false,
      depth: 0
    };
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
    return state.user + "@" + state.host + ":" + cwd + "$";
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
    var bits = ["r", "w", "x"];
    var s = kind;
    [6, 3, 0].forEach(function (shift) {
      var v = (node.mode >> shift) & 7;
      s += (v & 4 ? "r" : "-") + (v & 2 ? "w" : "-") + (v & 1 ? "x" : "-");
    });
    return s;
  }
  function human(n) {
    if (n < 1024) return n + "B";
    return (n / 1024).toFixed(1) + "K";
  }
  function bytesOf(state, path) {
    var node = state.files[path];
    if (!node) return 0;
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
    var showHidden = baseName.charAt(0) === ".";
    var re = globToReg(baseName);
    var hits = children(state, abs).map(function (ch) { return ch.name; }).filter(function (name) {
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
        if (line.substr(i, 2) === "2>" || line.substr(i, 3) === "2>>") break;
        buf += c;
        i++;
      }
      tokens.push({ word: buf, mode: mode });
    }
    return tokens;
  }

  function prepare(state, tok) {
    var text = tok.word;
    if (tok.mode !== "single" && (text === "~" || text.indexOf("~/") === 0)) text = state.home + text.slice(1);
    if (tok.mode === "single") return [text];
    var expanded = expandVars(state, text);
    if (tok.mode === "none" && /[*?]/.test(expanded)) return globMany(state, expanded);
    return [expanded];
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
    var got = walk(state, path, 4);
    if (got.missing) return bad("cat: " + path + ": No such file or directory");
    if (got.denied) return bad("cat: " + path + ": Permission denied");
    var hit = follow(state, path, 0);
    if (!hit) return bad("cat: " + path + ": Too many links");
    if (hit.node.kind === "dir") return bad("cat: " + path + ": Is a directory");
    if (hit.node.kind === "archive") return bad("cat: " + path + ": this is an archive. Use tar -tzf or unzip -l");
    if (!allows(hit.node, state, 4)) return bad("cat: " + path + ": Permission denied");
    return ok(hit.node.text.charAt(hit.node.text.length - 1) === "\n" || hit.node.text === "" ? hit.node.text : hit.node.text + "\n");
  }

  function writeFile(state, path, text, append) {
    var dir = parent(path);
    var folder = state.files[dir];
    if (!folder || folder.kind !== "dir") return bad("bash: " + path + ": No such file or directory");
    if (!allows(folder, state, 2) || !allows(folder, state, 1)) return bad("bash: " + path + ": Permission denied");
    var existing = state.files[path];
    if (existing && existing.kind === "dir") return bad("bash: " + path + ": Is a directory");
    if (existing && existing.kind !== "link" && !allows(existing, state, 2) && existing.owner !== state.user) {
      return bad("bash: " + path + ": Permission denied");
    }
    var prev = existing && existing.kind === "file" ? existing.text : "";
    state.files[path] = file(append ? prev + text : text, existing ? existing.mode : 420);
    if (existing && existing.owner) {
      state.files[path].owner = existing.owner;
      state.files[path].group = existing.group;
    }
    return ok("");
  }

  function ensureDir(state, path) {
    if (state.files[path] && state.files[path].kind === "dir") return ok("");
    var dir = parent(path);
    if (!state.files[dir] || state.files[dir].kind !== "dir") return bad("mkdir: cannot create directory '" + path + "': No such file or directory");
    if (!allows(state.files[dir], state, 2)) return bad("mkdir: cannot create directory '" + path + "': Permission denied");
    state.files[path] = newDir(state.user, 493);
    return ok("");
  }

  function removePath(state, path, recursive, force) {
    var normal = normalize(path);
    if (normal === "/" || normal === "/home" || normal === "/home/ana" || normal === state.home) {
      return bad("rm: refusing to remove '" + normal + "'. The lab will not delete the home directory. On a real host this can wipe files.");
    }
    if (!state.files[normal]) return force ? ok("") : bad("rm: cannot remove '" + normal + "': No such file or directory");
    var node = state.files[normal];
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
    var long = false, all = false, flagF = false;
    var paths = [];
    argv.forEach(function (a) {
      if (a.charAt(0) === "-" && a.length > 1) {
        if (a.indexOf("l") !== -1) long = true;
        if (a.indexOf("a") !== -1) all = true;
        if (a.indexOf("F") !== -1) flagF = true;
      } else paths.push(a);
    });
    if (!paths.length) paths = ["."];
    var blocks = [];
    for (var p = 0; p < paths.length; p++) {
      var path = resolve(state, paths[p]);
      var node = state.files[path];
      if (!node) return bad("ls: cannot access '" + paths[p] + "': No such file or directory");
      var rows = [];
      if (node.kind === "dir") {
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
        if (!long) return name;
        var shown = n.kind === "link" ? name + " -> " + n.target : name;
        var size = n.kind === "dir" ? 4096 : (n.kind === "link" ? n.target.length : (n.text || "").length);
        return modeStr(n) + " 1 " + n.owner + " " + n.group + " " + String(size).padStart(5, " ") + " Nov  2 09:00 " + shown;
      }).join("\n");
      blocks.push(text);
    }
    return ok(blocks.filter(Boolean).join("\n\n") + (blocks.join("").length ? "\n" : ""));
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
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text);
    function hit(line) {
      var hay = flags.i ? line.toLowerCase() : line;
      var needle = flags.i ? pattern.toLowerCase() : pattern;
      var yes;
      if (flags.E) {
        try { yes = new RegExp(pattern, flags.i ? "i" : "").test(line); }
        catch (e) { return null; }
      } else if (flags.w) {
        yes = new RegExp("\\b" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(hay);
      } else yes = hay.indexOf(needle) !== -1;
      return flags.v ? !yes : yes;
    }
    var matched = [];
    for (var r = 0; r < rows.length; r++) {
      var answer = hit(rows[r]);
      if (answer === null) return bad("grep: invalid pattern");
      if (answer) matched.push(flags.n ? (r + 1) + ":" + rows[r] : rows[r]);
    }
    if (flags.c) return ok(String(matched.length) + "\n", matched.length ? 0 : 1);
    if (flags.q) return ok("", matched.length ? 0 : 1);
    return ok(asText(matched), matched.length ? 0 : 1);
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
    var numeric = false, reverse = false, key = 0, unique = false;
    var files = [];
    for (var i = 0; i < argv.length; i++) {
      var a = argv[i];
      if (a === "-n") numeric = true;
      else if (a === "-r") reverse = true;
      else if (a === "-u") unique = true;
      else if (a === "-k") key = Number(argv[++i]);
      else if (/^-k[0-9]+$/.test(a)) key = Number(a.slice(2));
      else if (a.charAt(0) === "-") return bad("sort: unknown option " + a);
      else files.push(a);
    }
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text);
    function field(line) {
      if (!key) return line;
      return line.split(/\s+/)[key - 1] || "";
    }
    rows.sort(function (a, b) {
      var x = field(a), y = field(b);
      var cmp = numeric ? (Number(x) - Number(y)) : (x < y ? -1 : x > y ? 1 : 0);
      return reverse ? -cmp : cmp;
    });
    if (unique) {
      var seen = {};
      rows = rows.filter(function (row) { if (seen[row]) return false; seen[row] = true; return true; });
    }
    return ok(asText(rows));
  }
  function cmdUniq(state, argv, stdin) {
    var got = collectText(state, argv.filter(function (a) { return a.charAt(0) !== "-"; }), stdin);
    if (got.code) return bad(got.stderr.trim());
    var prev = null;
    var rows = [];
    linesOf(got.text).forEach(function (line) {
      if (line !== prev) rows.push(line);
      prev = line;
    });
    return ok(asText(rows));
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
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var text = got.text;
    var lines = text === "" ? 0 : linesOf(text).length;
    if (text !== "" && text.charAt(text.length - 1) !== "\n") lines = linesOf(text).length;
    var words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    var chars = text.length;
    var parts = [];
    if (countL) parts.push(String(lines));
    if (countW) parts.push(String(words));
    if (countC) parts.push(String(chars));
    var name = files.length === 1 ? " " + files[0] : "";
    return ok(parts.join(" ") + name + "\n");
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
    for (var i = 0; i < argv.length; i++) {
      if (argv[i] === "-F") fs = argv[++i];
      else if (argv[i].indexOf("-F") === 0 && argv[i].length > 2) fs = argv[i].slice(2);
      else if (!prog) prog = argv[i];
      else files.push(argv[i]);
    }
    if (!prog) return bad("awk: missing program");
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var filter = null;
    var body = prog.trim();
    var wrapped = body.match(/^\/([^/]+)\/\s*\{([\s\S]*)\}$/);
    var only = body.match(/^\/([^/]+)\/$/);
    if (wrapped) { filter = wrapped[1]; body = wrapped[2].trim(); }
    else if (only) { filter = only[1]; body = "print $0"; }
    else {
      if (body.charAt(0) === "{" && body.charAt(body.length - 1) === "}") body = body.slice(1, -1).trim();
    }
    if (body.indexOf("print") !== 0) return bad("awk: this lab prints fields and can filter with /text/. Example: awk '{print $2}' app.log");
    var splitter = fs == null ? /\s+/ : new RegExp(fs.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    var out = [];
    var re = null;
    if (filter) {
      try { re = new RegExp(filter); }
      catch (e) { return bad("awk: bad pattern"); }
    }
    linesOf(got.text).forEach(function (line) {
      if (re && !re.test(line)) return;
      var cols = fs == null ? line.trim().split(splitter) : line.split(splitter);
      if (fs == null && cols[0] === "") cols = [];
      var printed = body.replace(/print\s+/, "");
      var pieces = printed.split(",").map(function (piece) {
        piece = piece.trim();
        if (piece === "$0") return line;
        var m = piece.match(/^\$([0-9]+)$/);
        if (m) return cols[Number(m[1]) - 1] || "";
        if (piece.charAt(0) === "\"" && piece.charAt(piece.length - 1) === "\"") return piece.slice(1, -1);
        return piece;
      });
      out.push(pieces.join(" "));
    });
    return ok(asText(out));
  }
  function cmdSed(state, argv, stdin) {
    var quiet = false;
    var script = "";
    var files = [];
    argv.forEach(function (a) {
      if (a === "-n") quiet = true;
      else if (!script && a.charAt(0) !== "-") script = a;
      else if (a.charAt(0) !== "-") files.push(a);
    });
    var got = collectText(state, files, stdin);
    if (got.code) return bad(got.stderr.trim());
    var rows = linesOf(got.text);
    var sub = script.match(/^s\/([^/]+)\/([^/]*)\/(g?)$/);
    var range = script.match(/^([0-9]+),([0-9]+)p$/);
    var filt = script.match(/^\/(.+)\/p$/);
    if (sub) {
      var re = new RegExp(sub[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), sub[3] === "g" ? "g" : "");
      return ok(asText(rows.map(function (line) { return line.replace(re, sub[2]); })));
    }
    if (range && quiet) {
      var a = Number(range[1]), b = Number(range[2]);
      return ok(asText(rows.filter(function (_, i) { return i + 1 >= a && i + 1 <= b; })));
    }
    if (filt && quiet) {
      var fr = new RegExp(filt[1]);
      return ok(asText(rows.filter(function (line) { return fr.test(line); })));
    }
    return bad("sed: this lab knows s/old/new/ and sed -n '1,2p' or sed -n '/ERROR/p'. A real sed can do more.");
  }
  function cmdFind(state, argv) {
    var start = ".";
    var name = null;
    var type = null;
    var args = argv.slice();
    if (args[0] && args[0].charAt(0) !== "-") start = args.shift();
    for (var i = 0; i < args.length; i++) {
      if (args[i] === "-name") name = args[++i];
      else if (args[i] === "-type") type = args[++i];
      else return bad("find: this lab supports find . -name '*.txt' and -type f or -type d");
    }
    var root = resolve(state, start);
    if (!state.files[root]) return bad("find: '" + start + "': No such file or directory");
    var hits = [];
    function visit(path) {
      var node = state.files[path];
      if (!node) return;
      var label = path === root && start === "." ? "." : path.indexOf(state.cwd + "/") === 0 && start === "." ? path.slice(state.cwd.length + 1) : path;
      var kindOk = !type || (type === "d" && node.kind === "dir") || (type === "f" && node.kind === "file");
      var nameOk = !name || globToReg(name).test(base(path === root ? start : path));
      if (path !== root && kindOk && nameOk) hits.push(label);
      if (path === root && start !== "." && kindOk && nameOk && node.kind !== "dir") hits.push(label);
      if (node.kind === "dir") children(state, path).forEach(function (ch) { visit(ch.path); });
    }
    visit(root);
    if (name && state.files[root] && state.files[root].kind === "dir") {
      /* root itself is not a match for -name unless the name fits, already handled when path !== root */
    }
    hits.sort();
    return ok(asText(hits));
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
      }
    }
    return ok("");
  }
  function cmdLn(state, argv) {
    var symbolic = argv[0] === "-s";
    var args = symbolic ? argv.slice(1) : argv;
    if (!symbolic) return bad("ln: this lab makes symbolic links. Use ln -s target newname");
    if (args.length < 2) return bad("ln: missing target or new name");
    var target = args[0];
    var dest = resolve(state, args[1]);
    if (state.files[dest] && state.files[dest].kind === "dir") dest = join(dest, base(target));
    var folder = state.files[parent(dest)];
    if (!folder || folder.kind !== "dir") return bad("ln: cannot create link: No such file or directory");
    state.files[dest] = { kind: "link", mode: 511, owner: state.user, group: state.group, target: target, text: "" };
    return ok("");
  }
  function applyChmod(mode, spec) {
    if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
    var m = mode;
    var parts = spec.split(",");
    for (var i = 0; i < parts.length; i++) {
      var match = parts[i].match(/^([ugoa]*)([+-=])([rwx]+)$/);
      if (!match) return null;
      var who = match[1] || "a";
      var op = match[2];
      var perm = match[3];
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
      if (next == null) return bad("chmod: this lab accepts 644, 755, 600, and symbols such as u+x");
      node.mode = next;
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
    if (state.groups.indexOf(group) === -1) return bad("chgrp: changing group of '" + argv[1] + "': Operation not permitted");
    for (var i = 1; i < argv.length; i++) {
      var node = state.files[resolve(state, argv[i])];
      if (!node) return bad("chgrp: cannot access '" + argv[i] + "': No such file or directory");
      if (node.owner !== state.user) return bad("chgrp: changing group of '" + argv[i] + "': Operation not permitted");
      node.group = group;
    }
    return ok("");
  }
  function cmdPs() {
    return ok([
      "USER PID %CPU %MEM COMMAND",
      "root   1  0.0  0.1 systemd",
      "ana  412  0.0  0.2 sshd",
      "ana  880  2.0  1.1 app",
      "ana  901  0.0  0.4 bash"
    ].join("\n") + "\n");
  }
  function cmdTop() {
    return ok("This lab prints one frame. A real top redraws until you press q.\n\nPID USER  CPU   MEM  COMMAND\n880 ana   2.0   1.1  app\n901 ana   0.1   0.4  bash\n412 ana   0.0   0.2  sshd\n");
  }
  function cmdDf() {
    return ok("Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        20G  8.2G   11G  42% /\n");
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
  function cmdKill(argv) {
    var sig = "TERM";
    var pids = [];
    argv.forEach(function (a) {
      if (a === "-9" || a === "-KILL") sig = "KILL";
      else if (a === "-15" || a === "-TERM") sig = "TERM";
      else if (/^[0-9]+$/.test(a)) pids.push(a);
      else if (a.charAt(0) === "-") sig = a.slice(1);
    });
    if (!pids.length) return bad("kill: missing process id");
    if (pids.indexOf("1") !== -1) return bad("kill: refusing to signal pid 1 (systemd). On a real host that can take the machine down.");
    var known = { "412": "sshd", "880": "app", "901": "bash" };
    var lines = pids.map(function (pid) {
      var name = known[pid] || "a process";
      return "sent " + sig + " to pid " + pid + " (" + name + "). The lab's ps list is a fixed picture, so the row stays.";
    });
    return ok(lines.join("\n") + "\n");
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
  function cmdTar(state, argv) {
    if (!argv.length || argv[0].charAt(0) !== "-") return bad("usage: tar -czf name.tar.gz files");
    var letters = argv[0].slice(1);
    var i = 1;
    var archive = null;
    if (letters.indexOf("f") !== -1) archive = argv[i++];
    var files = argv.slice(i);
    if (!archive) return bad("tar: the f flag needs an archive name");
    var path = resolve(state, archive);
    if (letters.indexOf("c") !== -1) {
      var members = [];
      files.forEach(function (name) {
        var item = resolve(state, name);
        var node = state.files[item];
        if (!node) return;
        if (node.kind === "dir") {
          children(state, item).forEach(function (ch) {
            if (ch.node.kind === "file") members.push({ name: name.replace(/\/$/, "") + "/" + ch.name, text: ch.node.text });
          });
        } else if (node.kind === "file") members.push({ name: name, text: node.text });
      });
      state.files[path] = { kind: "archive", format: "tar", mode: 420, owner: state.user, group: state.group, members: members, text: "" };
      return ok("");
    }
    var node = state.files[path];
    if (!node || node.kind !== "archive") return bad("tar: " + archive + ": Cannot open: No such file or directory");
    if (letters.indexOf("t") !== -1) return ok(asText(node.members.map(function (m) { return m.name; })));
    if (letters.indexOf("x") !== -1) {
      node.members.forEach(function (m) {
        var dest = resolve(state, m.name);
        if (!state.files[parent(dest)]) ensureDir(state, parent(dest));
        writeFile(state, dest, m.text, false);
      });
      return ok("");
    }
    return bad("tar: use c to create, t to list, or x to extract");
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
    if (!argv.length) {
      var rows = Object.keys(state.env).sort().map(function (k) { return "declare -x " + k + "=" + state.env[k]; });
      return ok(asText(rows));
    }
    argv.forEach(function (spec) {
      var eq = spec.indexOf("=");
      if (eq === -1) return;
      state.env[spec.slice(0, eq)] = spec.slice(eq + 1);
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
    return ok("Practice commands: pwd cd ls echo cat head tail grep cut sort uniq wc awk sed find mkdir touch cp mv rm ln chmod chown chgrp ps top df du free uptime kill ping curl wget ssh scp rsync zip unzip tar alias man bash\nBuiltins that ignore PATH: cd echo pwd alias export set unset help history type [\n");
  }
  function cmdType(state, argv) {
    if (!argv[0]) return bad("type: missing name");
    if (BUILTIN[argv[0]]) return ok(argv[0] + " is a shell builtin\n");
    if (state.fns[argv[0]]) return ok(argv[0] + " is a function\n");
    if (visible(state, argv[0])) return ok(argv[0] + " is /usr/bin/" + argv[0] + "\n");
    return bad("bash: type: " + argv[0] + ": not found");
  }
  function cmdCrontab() {
    return ok("# m h dom mon dow command\n*/5 * * * * du -sh /home/ana/work\n");
  }
  function cmdBash(state, argv) {
    if (argv[0] === "-c") return runScript(state, argv.slice(1).join(" "));
    if (!argv[0]) return bad("bash: this lab has no second interactive shell. Pass a script file, or use the script box.");
    var path = resolve(state, argv[0]);
    var got = readPath(state, path);
    if (got.code) return got;
    var node = state.files[path];
    if (node && node.kind === "file" && ((node.mode & 64) === 0) && argv[0].charAt(0) !== "-") {
      /* bash file still runs a readable script even without +x. ./file would not. */
    }
    return runScript(state, got.stdout);
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
    COMMANDS.ps = function () { return cmdPs(); };
    COMMANDS.top = function () { return cmdTop(); };
    COMMANDS.df = function () { return cmdDf(); };
    COMMANDS.du = function (s, a) { return cmdDu(s, a); };
    COMMANDS.free = function () { return cmdFree(); };
    COMMANDS.uptime = function () { return cmdUptime(); };
    COMMANDS.kill = function (s, a) { return cmdKill(a); };
    COMMANDS.ping = function (s, a) { return cmdPing(a); };
    COMMANDS.curl = function (s, a) { return cmdCurl(a); };
    COMMANDS.wget = function (s, a) { return cmdWget(s, a); };
    COMMANDS.ssh = function (s, a) { return cmdSsh(a); };
    COMMANDS.scp = function (s, a) { return cmdScp(s, a); };
    COMMANDS.rsync = function (s, a) { return cmdRsync(s, a); };
    COMMANDS.zip = function (s, a) { return cmdZip(s, a); };
    COMMANDS.unzip = function (s, a) { return cmdUnzip(s, a); };
    COMMANDS.tar = function (s, a) { return cmdTar(s, a); };
    COMMANDS.alias = function (s, a) { return cmdAlias(s, a); };
    COMMANDS.export = function (s, a) { return cmdExport(s, a); };
    COMMANDS.set = function (s, a) { return cmdSet(s, a); };
    COMMANDS.unset = function (s, a) { return cmdUnset(s, a); };
    COMMANDS.man = function (s, a) { return cmdMan(a); };
    COMMANDS.help = function () { return cmdHelp(); };
    COMMANDS.history = function (s) {
      return ok(s.history.map(function (line, i) { return String(i + 1) + "  " + line; }).join("\n") + (s.history.length ? "\n" : ""));
    };
    COMMANDS.type = function (s, a) { return cmdType(s, a); };
    COMMANDS.crontab = function () { return cmdCrontab(); };
    COMMANDS.bash = function (s, a) { return cmdBash(s, a); };
    COMMANDS.whoami = function (s) { return ok(s.user + "\n"); };
    COMMANDS.id = function (s) { return ok("uid=1000(ana) gid=1000(ana) groups=1000(ana),1001(staff)\n"); };
    COMMANDS.hostname = function (s) { return ok(s.host + "\n"); };
    COMMANDS.date = function () { return ok("Mon Nov  2 09:04:01 UTC 2026\n"); };
    COMMANDS.clear = function () { return { stdout: "", stderr: "", code: 0, clear: true }; };
    COMMANDS.sudo = function () { return bad("sudo: this lab stays the user ana. It will not switch to root. On a real host, sudo runs one command as root, and only if you are allowed."); };
    COMMANDS.nano = function () { return bad("nano: this lab has no full-screen editor. Use the script box, or cat."); };
    COMMANDS.vim = function () { return bad("vim: this lab has no full-screen editor. Press Esc :q! on a real host if you are stuck in vim. Here, use the script box."); };
    COMMANDS.less = function () { return bad("less: not in this lab. Use cat, head, or tail."); };
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

  function runSimple(state, tokens, stdin) {
    var redirects = { out: null, append: false, err: null, errAppend: false, input: null };
    var words = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.op) {
        var next = tokens[++i];
        if (!next || next.word == null) return bad("bash: syntax error near redirection");
        var target = prepare(state, next)[0];
        if (t.op === ">" || t.op === ">>") { redirects.out = target; redirects.append = t.op === ">>"; }
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
    if (state.fns[cmd]) {
      var prev = state.pos;
      state.pos = argv;
      res = execLines(state, state.fns[cmd].slice());
      state.pos = prev;
    } else if (cmd === "[") res = testCmd(state, argv, "]");
    else if (cmd === "[[") res = testCmd(state, argv, "]]");
    else if (!visible(state, cmd)) res = bad("bash: " + cmd + ": command not found");
    else if (COMMANDS[cmd]) res = COMMANDS[cmd](state, argv, stdin || "");
    else res = bad("bash: " + cmd + ": command not found");
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
    return bad("[: this lab supports = != -eq -ne -lt -le -gt -ge -f -d -z -n");
  }

  function runPipeline(state, line, stdin) {
    var tokens = lex(line);
    var stages = [[]];
    tokens.forEach(function (tok) {
      if (tok.op === "|") stages.push([]);
      else stages[stages.length - 1].push(tok);
    });
    var input = stdin || "";
    var stderr = "";
    var code = 0;
    var clear = false;
    var failed = 0;
    for (var s = 0; s < stages.length; s++) {
      if (!stages[s].length) return bad("bash: syntax error near |");
      var res = runSimple(state, stages[s], input);
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
    if (text.replace(/\s+$/, "").charAt(text.replace(/\s+$/, "").length - 1) === "&") {
      text = text.replace(/\s*&\s*$/, "");
    }
    var trimmed = text.trim();
    if (!trimmed) return finish(state, ok(""));
    try {
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(trimmed)) {
        return finish(state, assign(state, trimmed));
      }
      var res = runPipeline(state, trimmed, "");
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
      if (c === "#" && (i === 0 || /\s/.test(src.charAt(i - 1)))) {
        while (i + 1 < src.length && src.charAt(i + 1) !== "\n") i++;
        continue;
      }
      if (c === ";") { out += "\n"; continue; }
      out += c;
    }
    return out.split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s.length; });
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
      state.history.push(line);
      local.push(line);
      hi = local.length;
      add(prompt(state) + " " + line, "cmd");
      var res = runLine(state, line);
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
      if (e.key === "ArrowUp") {
        if (hi > 0) { hi--; input.value = local[hi]; }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (hi < local.length) hi++;
        input.value = local[hi] || "";
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

  function mountAll() {
    document.querySelectorAll(".lab").forEach(mount);
  }

  register();
  return { createState: createState, reset: reset, prompt: prompt, runLine: runLine, runScript: runScript, runLines: runLines, mount: mount, mountAll: mountAll };
});

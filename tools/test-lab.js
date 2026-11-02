var lab = require("../assets/lab.js");

var failed = 0;
function check(name, fn) {
  try {
    fn();
    process.stdout.write("ok  " + name + "\n");
  } catch (e) {
    failed++;
    process.stdout.write("FAIL " + name + "\n  " + e.message + "\n");
  }
}
function eq(actual, expected) {
  if (actual !== expected) throw new Error("\nACTUAL:\n" + JSON.stringify(actual) + "\nEXPECTED:\n" + JSON.stringify(expected));
}
function fresh() { return lab.createState(); }
function out(state, line) {
  var res = lab.runLine(state, line);
  if (res.code !== 0 && res.stderr) throw new Error(line + " -> " + res.stderr);
  return res.stdout;
}

check("pwd", function () {
  eq(out(fresh(), "pwd"), "/home/ana/work\n");
});
check("ls", function () {
  eq(out(fresh(), "ls"), "app.log\nnames.txt\nnotes.txt\nreports\nsizes.txt\n");
});
check("echo quotes", function () {
  var s = fresh();
  eq(out(s, "echo \"$HOME\""), "/home/ana\n");
  eq(out(s, "echo '$HOME'"), "$HOME\n");
});
check("grep", function () {
  var text = out(fresh(), "grep -n ERROR app.log");
  if (text.indexOf("ERROR read config failed") === -1) throw new Error(text);
});
check("pipe", function () {
  eq(out(fresh(), "grep ERROR app.log | wc -l"), "1\n");
});
check("redirect", function () {
  var s = fresh();
  out(s, "echo hello > greet.txt");
  eq(out(s, "cat greet.txt"), "hello\n");
});
check("head tail", function () {
  var s = fresh();
  var head = out(s, "head -n 2 app.log");
  if (head.split("\n").filter(Boolean).length !== 2) throw new Error(head);
  if (out(s, "tail -n 1 app.log").indexOf("retry ok") === -1) throw new Error("tail");
});
check("cut awk sed sort", function () {
  var s = fresh();
  if (out(s, "awk '{print $2}' app.log").indexOf("ERROR") === -1) throw new Error("awk");
  if (out(s, "sed 's/ERROR/FAIL/' app.log").indexOf("FAIL") === -1) throw new Error("sed");
  eq(out(s, "sort -n sizes.txt"), "1\n2\n10\n");
  eq(out(s, "sort sizes.txt"), "1\n10\n2\n");
  eq(out(s, "sort names.txt | uniq"), "ana\nken\nmina\n");
});
check("files", function () {
  var s = fresh();
  out(s, "cp notes.txt notes.bak");
  out(s, "mv notes.bak backup.txt");
  out(s, "mkdir -p extra/deep");
  out(s, "touch extra/deep/a.txt");
  out(s, "ln -s notes.txt notes-link");
  if (out(s, "ls -l notes-link").indexOf("notes-link -> notes.txt") === -1) throw new Error("link");
  out(s, "rm backup.txt");
  if (out(s, "ls").indexOf("backup.txt") !== -1) throw new Error("rm");
});
check("rm refuses home", function () {
  var res = lab.runLine(fresh(), "rm -rf /");
  if (res.code === 0) throw new Error("removed root");
});
check("chmod", function () {
  var s = fresh();
  out(s, "chmod 600 notes.txt");
  if (out(s, "ls -l notes.txt").indexOf("-rw-------") === -1) throw new Error(out(s, "ls -l notes.txt"));
});
check("chown denied", function () {
  var res = lab.runLine(fresh(), "chown root notes.txt");
  if (res.code === 0) throw new Error("chown should fail");
});
check("chgrp", function () {
  var s = fresh();
  out(s, "chgrp staff notes.txt");
  if (out(s, "ls -l notes.txt").indexOf(" ana staff ") === -1 && out(s, "ls -l notes.txt").indexOf("staff") === -1) throw new Error(out(s, "ls -l notes.txt"));
});
check("find glob", function () {
  var s = fresh();
  var quoted = out(s, "find . -name '*.txt'");
  if (quoted.indexOf("reports/monday.txt") === -1) throw new Error(quoted);
});
check("path", function () {
  var s = fresh();
  out(s, "export PATH=/nope");
  var res = lab.runLine(s, "ls");
  if (res.code === 0) throw new Error("ls should be missing");
  eq(out(s, "echo still"), "still\n");
});
check("script if for while function array", function () {
  var s = fresh();
  var script = [
    "if grep -q ERROR app.log; then",
    "echo config-failed",
    "else",
    "echo quiet",
    "fi",
    "for f in notes.txt app.log; do",
    "echo file-$f",
    "done",
    "n=0",
    "while [ \"$n\" -lt 3 ]; do",
    "echo n-$n",
    "n=$((n + 1))",
    "done",
    "greet() {",
    "echo Hello, $1",
    "}",
    "greet ana",
    "ports=(8080 8443)",
    "echo ${ports[0]}",
    "echo ${#ports[@]}"
  ].join("\n");
  var res = lab.runScript(s, script);
  if (res.code !== 0) throw new Error(res.stderr + res.stdout);
  ["config-failed", "file-notes.txt", "file-app.log", "n-0", "n-1", "n-2", "Hello, ana", "8080", "2"].forEach(function (bit) {
    if (res.stdout.indexOf(bit) === -1) throw new Error("missing " + bit + " in\n" + res.stdout);
  });
});
check("math", function () {
  eq(out(fresh(), "echo $((2 + 3 * 4))"), "14\n");
});
check("tar zip", function () {
  var s = fresh();
  out(s, "tar -czf learn.tar.gz notes.txt");
  if (out(s, "tar -tzf learn.tar.gz").indexOf("notes.txt") === -1) throw new Error("tar list");
  out(s, "zip pack.zip notes.txt");
  if (out(s, "unzip -l pack.zip").indexOf("notes.txt") === -1) throw new Error("zip");
});
check("net and host", function () {
  var s = fresh();
  if (out(s, "df -h").indexOf("20G") === -1) throw new Error("df");
  if (out(s, "ping -c 1 lab").indexOf("0% packet loss") === -1) throw new Error("ping");
  if (out(s, "ssh ana@other").indexOf("does not open") === -1) throw new Error("ssh");
  out(s, "scp notes.txt ana@other:work/");
  if (out(s, "rsync -av app.log ana@other:work/").indexOf("app.log") === -1) throw new Error("rsync");
});
check("alias", function () {
  var s = fresh();
  out(s, "alias ll='ls -alF'");
  if (out(s, "ll").indexOf("notes.txt") === -1) throw new Error("alias");
});
check("exit status", function () {
  var s = fresh();
  lab.runLine(s, "grep -q ERROR app.log");
  eq(out(s, "echo $?"), "0\n");
  lab.runLine(s, "grep -q NOPE app.log");
  eq(out(s, "echo $?"), "1\n");
});

if (failed) {
  process.stderr.write(failed + " failed\n");
  process.exit(1);
}
process.stdout.write("all passed\n");

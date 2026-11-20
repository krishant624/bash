var lab = require("../assets/lab.js");
var course = require("./course.js");
var fs = require("fs");
var only = process.argv[2] ? process.argv[2].split(",") : null;
var out = [];
var flagged = 0;
course.topics.forEach(function (topic, ti) {
  out.push("## " + (ti + 1) + " " + topic.title + " (" + topic.lessons.length + ")");
  topic.lessons.forEach(function (lesson) {
    if (only && only.indexOf(lesson.file) === -1 && only.indexOf(topic.id) === -1) return;
    var state = lab.createState();
    out.push("### " + lesson.file);
    (lesson.run || []).forEach(function (cmd) {
      var res = lab.runTyped(state, cmd);
      out.push("$ " + cmd);
      if (res.stdout) out.push(res.stdout.replace(/\n$/, ""));
      if (res.stderr) { out.push("!! " + res.stderr.replace(/\n$/, "")); flagged++; }
    });
  });
});
fs.writeFileSync(__dirname + "/check-out.txt", out.join("\n") + "\n");
console.log("topics " + course.topics.length + ", lessons " + course.topics.reduce(function (n, t) { return n + t.lessons.length; }, 0) + ", stderr lines " + flagged);

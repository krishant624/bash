module.exports = function (h) {
  var svg = h.svg, esc = h.esc, flow = h.flow, fields = h.fields, bars = h.bars, command = h.command;

  function stack(rows, label) {
    var w = 680, rowH = 52, gap = 30, pad = 16, body = "";
    rows.forEach(function (row, ri) {
      var y = pad + ri * (rowH + gap);
      var cellW = (w - pad * 2 - (row.length - 1) * 12) / row.length;
      row.forEach(function (cell, ci) {
        var x = pad + ci * (cellW + 12);
        body += '<rect class="dbox ' + (cell.cls || "") + '" x="' + x + '" y="' + y + '" width="' + cellW + '" height="' + rowH + '" rx="8"/>';
        if (cell.fill) body += '<rect class="' + cell.fill + '" x="' + x + '" y="' + y + '" width="' + cellW + '" height="' + rowH + '" rx="8"/>';
        body += '<text class="dtitle" x="' + (x + cellW / 2) + '" y="' + (y + (cell.sub ? 22 : 31)) + '" text-anchor="middle">' + esc(cell.text) + "</text>";
        if (cell.sub) body += '<text class="dsub" x="' + (x + cellW / 2) + '" y="' + (y + 40) + '" text-anchor="middle">' + esc(cell.sub) + "</text>";
      });
      if (ri < rows.length - 1) {
        var ay = y + rowH + 4, by = y + rowH + gap - 6;
        body += '<line class="darrow" x1="' + (w / 2) + '" y1="' + ay + '" x2="' + (w / 2) + '" y2="' + by + '"/>';
        body += '<polygon class="dhead" points="' + (w / 2) + "," + (by + 6) + " " + (w / 2 - 5) + "," + by + " " + (w / 2 + 5) + "," + by + '"/>';
      }
    });
    var hgt = pad * 2 + rows.length * rowH + (rows.length - 1) * gap;
    return { title: label, svg: svg(w, hgt, label, body), caption: label };
  }

  function tree(lines, label) {
    var body = "";
    lines.forEach(function (ln, i) {
      var parts = ln.split("  # ");
      body += '<text class="dcode" x="20" y="' + (30 + i * 22) + '">' + esc(parts[0]) + "</text>";
      if (parts[1]) body += '<text class="dsub" x="300" y="' + (30 + i * 22) + '">' + esc(parts[1]) + "</text>";
    });
    return { title: label, svg: svg(680, 30 + lines.length * 22, label, body), caption: label };
  }

  function disks(cols, label, note) {
    var colW = 110, gap = 22, cellH = 30, pad = 18, body = "";
    var rowsN = Math.max.apply(null, cols.map(function (c) { return c.cells.length; }));
    var w = pad * 2 + cols.length * colW + (cols.length - 1) * gap;
    cols.forEach(function (c, i) {
      var x = pad + i * (colW + gap);
      body += '<text class="dtitle" x="' + (x + colW / 2) + '" y="' + (pad + 12) + '" text-anchor="middle">' + esc(c.name) + "</text>";
      body += '<rect class="dbox" x="' + x + '" y="' + (pad + 22) + '" width="' + colW + '" height="' + (rowsN * (cellH + 6) + 10) + '" rx="10"/>';
      c.cells.forEach(function (cell, ri) {
        var y = pad + 30 + ri * (cellH + 6);
        var cls = { d: "fillaccent", m: "fillgood", p: "fillwarn", x: "fillbad", f: "dbox" }[cell.charAt(0)] || "fillaccent";
        body += '<rect class="' + cls + '" x="' + (x + 8) + '" y="' + y + '" width="' + (colW - 16) + '" height="' + cellH + '" rx="5"/>';
        body += '<text class="dsub" x="' + (x + colW / 2) + '" y="' + (y + 20) + '" text-anchor="middle">' + esc(cell.slice(2)) + "</text>";
      });
    });
    var hgt = pad + 40 + rowsN * (cellH + 6) + 20;
    if (note) {
      body += '<text class="dsub" x="' + pad + '" y="' + (hgt + 4) + '">' + esc(note) + "</text>";
      hgt += 18;
    }
    return { title: label, svg: svg(Math.max(w, 420), hgt, label, body), caption: label };
  }

  function panes(layout, label) {
    var body = '<rect class="dbox" x="16" y="16" width="648" height="230" rx="10"/>';
    layout.forEach(function (p) {
      body += '<rect class="dbox ' + (p.cls || "") + '" x="' + (24 + p.x * 632) + '" y="' + (24 + p.y * 190) + '" width="' + (p.w * 632 - 8) + '" height="' + (p.h * 190 - 8) + '" rx="6"/>';
      body += '<text class="dtitle" x="' + (24 + (p.x + p.w / 2) * 632) + '" y="' + (24 + (p.y + p.h / 2) * 190) + '" text-anchor="middle">' + esc(p.text) + "</text>";
      if (p.sub) body += '<text class="dsub" x="' + (24 + (p.x + p.w / 2) * 632) + '" y="' + (42 + (p.y + p.h / 2) * 190) + '" text-anchor="middle">' + esc(p.sub) + "</text>";
    });
    body += '<rect class="fillgood" x="24" y="222" width="632" height="18" rx="3"/>';
    body += '<text class="dsub" x="32" y="236">[work] 0:editor  1:logs*  2:shell        "lab" 09:04</text>';
    return { title: label, svg: svg(680, 262, label, body), caption: label };
  }

  return {
    terminal: flow(["keyboard", "terminal\nwindow, font, colors", "bash\nprompt, aliases", "programs"], "The terminal draws text. Bash reads and runs your lines."),
    lookup: flow(["alias", "function", "builtin", "PATH\n/usr/bin ..."], "Bash tries these in order. type -a shows every match."),
    fds: stack([[{ text: "command", sub: "ls notes.txt nope" }], [{ text: "0 stdin", sub: "< file", fill: "fillaccent" }, { text: "1 stdout", sub: "> out.txt", fill: "fillgood" }, { text: "2 stderr", sub: "2> err.txt", fill: "fillbad" }]], "Three numbered streams, each can be redirected on its own"),
    times: fields([{ text: "Access", note: "last read" }, { text: "Modify", note: "contents changed", cls: "good" }, { text: "Change", note: "contents or metadata", cls: "warn" }, { text: "Birth", note: "created" }], "stat shows four times for one file"),
    nano: fields([{ text: "^O", note: "write out" }, { text: "^X", note: "exit" }, { text: "^W", note: "search" }, { text: "^K", note: "cut line" }, { text: "^U", note: "paste" }, { text: "M-U", note: "undo" }], "nano's bottom bar: ^ means Ctrl, M- means Alt"),
    inode: stack([[{ text: "notes.txt", sub: "name" }, { text: "again.txt", sub: "hard link" }, { text: "soft.txt", sub: "symlink: stores a path", cls: "warn" }], [{ text: "inode 131071", sub: "owner, mode, times, link count 2", fill: "fillaccent" }], [{ text: "data blocks", sub: "the bytes" }]], "Names point at an inode. A symlink points at a name."),
    findmore: flow(["start folder", "tests\n-type -size -mtime", "action\n-print -exec -delete"], "find walks the tree, tests each name, then acts"),
    regexmore: fields([{ text: "^", note: "line start" }, { text: "[[:digit:]]", note: "a digit" }, { text: "{4}", note: "four times (-E)" }, { text: "a|b", note: "either (-E)" }, { text: "$", note: "line end" }], "Anchors, classes, and repeats"),
    wc: fields([{ text: "4", note: "lines -l" }, { text: "11", note: "words -w" }, { text: "53", note: "bytes -c" }, { text: "notes.txt", note: "name" }], "wc prints lines, words, bytes, then the name"),
    uniq: flow(["awk field", "sort", "uniq -c", "sort -rn"], "The classic frequency table"),
    awkmore: flow(["BEGIN { }", "pattern { action }\nevery line", "END { }"], "An awk program runs BEGIN once, the body per line, END once"),
    sedmore: command("sed -n '2,4p' app.log", [{ start: 0, end: 3, label: "sed" }, { start: 4, end: 6, label: "quiet" }, { start: 8, end: 11, label: "address", row: 1 }, { start: 11, end: 12, label: "command" }, { start: 14, end: 21, label: "file", row: 1 }], "An address picks lines. The command acts on them."),
    xargs: flow(["names on stdin", "xargs", "cmd name1 name2 ..."], "xargs turns lines into arguments"),
    gzip: flow(["app.log", "gzip", "app.log.gz", "zcat reads it"], "One file in, one smaller file out"),
    tarmore: flow(["tar -c\ncreate", "tar -t\nlist", "tar -x -C dir\nextract"], "Create, list before you trust, extract where you choose"),
    compress: bars([{ name: "original", value: 199, max: 199, cls: "fillaccent", note: "199 B" }, { name: "gzip", value: 129, max: 199, cls: "fillgood", note: "fast" }, { name: "bzip2", value: 120, max: 199, cls: "fillwarn", note: "slower" }, { name: "xz", value: 110, max: 199, cls: "fillbad", note: "slowest, smallest" }], "Smaller output costs more time to pack"),
    sevenzip: flow(["7z a", "pack.7z", "7z l", "7z x"], "Add, list, extract with paths"),
    rsyncbackup: flow(["reports/", "rsync -av", "backup/\nonly changes sent", "--delete\nmirror"], "rsync sends the difference, not the whole tree"),
    root: flow(["ana  $", "sudo cmd", "root  #\nuid 0", "back to ana"], "Borrow root for one command, then give it back"),
    passwdfields: command("ana:x:1000:1000:Ana Lee:/home/ana:/bin/bash", [{ start: 0, end: 3, label: "name" }, { start: 4, end: 5, label: "x", row: 1 }, { start: 6, end: 10, label: "uid" }, { start: 11, end: 15, label: "gid", row: 1 }, { start: 16, end: 23, label: "comment" }, { start: 24, end: 33, label: "home", row: 1 }, { start: 34, end: 43, label: "shell" }], "Seven fields separated by colons"),
    useradd: flow(["useradd -m", "/etc/passwd\n/etc/shadow", "/etc/group", "/home/bob\nfrom /etc/skel"], "One command writes four places"),
    skel: flow(["/etc/skel\n.bashrc", "adduser carol", "/home/carol\n.bashrc copied"], "New homes start as a copy of /etc/skel"),
    usermod: fields([{ text: "-aG staff", note: "add a group", cls: "good" }, { text: "-G ken", note: "replace all groups", cls: "bad" }, { text: "-s", note: "shell" }, { text: "-l", note: "rename" }, { text: "-d -m", note: "move home" }], "usermod options, and the one that bites"),
    chage: fields([{ text: "-M 90", note: "max days" }, { text: "-W 14", note: "warn days" }, { text: "-E date", note: "account expires" }, { text: "-d 0", note: "change at login", cls: "warn" }], "chage sets the dates kept in /etc/shadow"),
    userdel: flow(["passwd -l\nlock password", "nologin\nno shell", "chage -E 0\nexpire", "userdel -r\nremove"], "Disable in steps. Delete last."),
    sudo: flow(["ken", "group sudo\nor sudoers.d rule", "visudo -c", "sudo cmd"], "Root privileges come from sudoers, checked with visudo"),
    groupacc: stack([[{ text: "ana" }], [{ text: "primary: ana", sub: "new files get this group", fill: "fillaccent" }, { text: "sudo", sub: "may use sudo" }, { text: "staff", sub: "shared with mina" }]], "One primary group, any number of supplementary groups"),
    groupshare: flow(["groupadd devs", "gpasswd -a", "chgrp devs shared", "chmod 2775\nnew files: devs"], "Make a group, add people, give it a folder"),
    setuid: fields([{ text: "-rws", note: "owner, s = setuid", cls: "warn" }, { text: "r-x", note: "group" }, { text: "r-x", note: "other" }, { text: "root", note: "runs as this user" }], "s in the owner execute spot means run as the owner"),
    specialbits: fields([{ text: "4", note: "setuid" }, { text: "2", note: "setgid" }, { text: "1", note: "sticky" }, { text: "777", note: "rwx for all" }, { text: "1777", note: "drwxrwxrwt like /tmp", cls: "good" }], "The fourth octal digit holds the special bits"),
    acl: stack([[{ text: "-rw-rw-r--+", sub: "the + means an ACL exists" }], [{ text: "user::rw-", sub: "owner" }, { text: "user:ken:rw-", sub: "named user", fill: "fillgood" }, { text: "mask::rw-", sub: "ceiling", fill: "fillwarn" }, { text: "other::r--" }]], "Extra entries, capped by the mask"),
    acldefault: flow(["team/\ndefault:user:ken:rwx", "touch team/new.txt", "new.txt\nuser:ken:rw-"], "Default entries are copied into new files, without x"),
    attrs: fields([{ text: "+i", note: "immutable: no change, no delete", cls: "bad" }, { text: "+a", note: "append only", cls: "warn" }, { text: "lsattr", note: "show" }, { text: "root only", note: "to set or clear" }], "Attributes override permissions, even for root"),
    topmore: tree(["top - 09:04:01 up 3 days, load average: 0.15  # load vs CPU count", "Tasks: 4 total, 1 running                    # what is running", "%Cpu(s): 2.1 us 0.4 sy 97.3 id 0.2 wa      # wa = waiting on disk", "MiB Mem : 3891 total 2150 free              # cache counts as usable", "MiB Swap: 2048 total 2048 free              # swap in use = pressure"], "Read top's header from the top down"),
    nice: bars([{ name: "-20", value: 100, max: 100, cls: "fillbad", note: "most CPU, root only" }, { name: "0", value: 60, max: 100, cls: "fillaccent", note: "default" }, { name: "10", value: 30, max: 100, cls: "fillgood", note: "nice -n 10" }, { name: "19", value: 8, max: 100, cls: "fillgood", note: "yields to everyone" }], "Higher niceness, smaller share of the CPU"),
    jobs: flow(["cmd &\nbackground", "jobs", "fg %1\nforeground", "Ctrl+Z, bg\nback again"], "Jobs move between foreground and background"),
    screen: flow(["screen -S work", "Ctrl+A d\ndetach", "log out\nSSH drops", "screen -r work\nstill running"], "A session outlives your connection"),
    tmux: stack([[{ text: "session: work" }], [{ text: "window 0", sub: "editor" }, { text: "window 1", sub: "logs" }, { text: "window 2", sub: "shell" }], [{ text: "pane", fill: "fillaccent" }, { text: "pane", fill: "fillaccent" }]], "Sessions hold windows. Windows hold panes."),
    tmuxwin: fields([{ text: "0:editor" }, { text: "1:logs*", cls: "good" }, { text: "2:shell" }, { text: "Ctrl+B c", note: "new" }, { text: "Ctrl+B ,", note: "rename" }], "The status bar lists windows. * marks the current one."),
    tmuxpanes: panes([{ x: 0, y: 0, w: 0.6, h: 1, text: "editor", sub: "Ctrl+B %" }, { x: 0.6, y: 0, w: 0.4, h: 0.5, text: "logs", sub: "tail -f", cls: "good" }, { x: 0.6, y: 0.5, w: 0.4, h: 0.5, text: "shell", sub: "Ctrl+B \"" }], "One window split into three panes"),
    tmuxconf: flow(["~/.tmux.conf", "tmux starts\nor source-file", "prefix, mouse,\nkeys applied"], "The config file is read at start, or on reload"),
    tmuxshare: flow(["ana: tmux -S /tmp/pair new", "chgrp + chmod g+rw\nthe socket", "mina: tmux -S /tmp/pair attach", "same screen"], "Two users, one socket, one session"),
    env: stack([[{ text: "your shell", sub: "greeting=hi (shell only), PATH, HOME (exported)" }], [{ text: "child: bash -c", sub: "sees exported only", fill: "fillgood" }, { text: "child: script", sub: "sees exported only", fill: "fillgood" }]], "export copies a variable into every child"),
    loginshell: flow(["ssh / console\nlogin shell", "/etc/profile", "~/.profile", "~/.bashrc\nvia .profile"], "A login shell reads profile files, which usually load .bashrc"),
    pathsetup: flow(["~/bin/hello", "chmod +x", "PATH=~/bin:$PATH", "hello\nruns by name"], "Executable, then on PATH, then found by name"),
    history: fields([{ text: "!!", note: "last command" }, { text: "!$", note: "last word" }, { text: "!42", note: "entry 42" }, { text: "!cat", note: "last cat ..." }, { text: "Ctrl+R", note: "search" }], "History expansion shortcuts"),
    timezones: bars([{ name: "UTC", value: 9, max: 24, cls: "fillaccent", note: "09:04 kernel time" }, { name: "New York", value: 4, max: 24, cls: "fillgood", note: "04:04 EST" }, { name: "Kathmandu", value: 14.8, max: 24, cls: "fillgood", note: "14:49 +0545" }, { name: "Tokyo", value: 18, max: 24, cls: "fillgood", note: "18:04 JST" }], "One moment, shown in four zones"),
    datemath: flow(["date -d '3 days ago'", "parsed time", "+%F", "2026-10-30"], "Describe a time in words, print it in any format"),
    cronmore: command("30 2 * * 1-5 /home/ana/backup.sh >> backup.log 2>&1", [{ start: 0, end: 2, label: "minute" }, { start: 3, end: 4, label: "hour", row: 1 }, { start: 5, end: 6, label: "day" }, { start: 7, end: 8, label: "month", row: 1 }, { start: 9, end: 12, label: "Mon-Fri" }, { start: 13, end: 33, label: "command, full path", row: 1 }, { start: 34, end: 53, label: "keep the output" }], "Five fields, a command, and a log"),
    anacron: flow(["boot", "wait delay\n5 min", "last run\nover 1 day ago?", "run cron.daily"], "anacron runs late jobs after the machine wakes"),
    at: flow(["echo cmd | at 23:30", "atq\njob 2", "23:30\nruns once", "gone"], "One job, one time, then it is done"),
    timers: stack([[{ text: "backup.timer", sub: "OnCalendar=*-*-* 02:30:00" }], [{ text: "backup.service", sub: "ExecStart=/usr/local/bin/backup.sh", fill: "fillaccent" }], [{ text: "journal", sub: "journalctl -u backup.service" }]], "The timer says when. The service says what."),
    timerunit: flow(["write .service\n+ .timer", "daemon-reload", "enable --now", "list-timers"], "Four steps to a working timer"),
    fhs: tree(["/", "├── etc        # configuration", "├── home/ana   # your files", "├── root       # root's home", "├── var/log    # logs", "├── usr/bin    # programs", "├── tmp        # scratch, sticky", "├── dev/sda    # devices", "├── mnt, media # attach other disks here", "└── boot       # kernel"], "One tree from /. Other disks attach to folders in it."),
    blockstack: stack([[{ text: "/srv/data", sub: "mount point" }], [{ text: "ext4", sub: "filesystem", fill: "fillaccent" }], [{ text: "sdc1", sub: "partition" }, { text: "sdc2", sub: "partition" }], [{ text: "sdc", sub: "disk, 10G" }]], "Disk, partition, filesystem, mount point"),
    mountusb: flow(["plug in", "lsblk\nfind sdb1", "sudo mount\n/dev/sdb1 /mnt/usb", "sudo umount\nbefore unplugging"], "Find it, mount it, unmount it"),
    fstab: command("UUID=4E21-9F0A /mnt/usb vfat defaults,nofail 0 0", [{ start: 0, end: 14, label: "device by UUID" }, { start: 15, end: 23, label: "mount point", row: 1 }, { start: 24, end: 28, label: "type" }, { start: 29, end: 45, label: "options", row: 1 }, { start: 46, end: 47, label: "dump" }, { start: 48, end: 49, label: "fsck", row: 1 }], "Six fields per line"),
    parted: disks([{ name: "sdc before", cells: ["f empty", "f empty", "f empty"] }, { name: "mklabel gpt", cells: ["d GPT table", "f free", "f free"] }, { name: "mkpart x2", cells: ["d GPT table", "m data 50%", "m logs 50%"] }], "A table first, then partitions inside it"),
    mkfs: flow(["sdc1\nempty bytes", "mkfs.ext4 -L data", "ext4\nUUID, label", "mount\n/srv/data"], "mkfs turns a partition into a filesystem"),
    labels: stack([[{ text: "LABEL=ARCHIVE", sub: "inside ext4, set by e2label", fill: "fillgood" }], [{ text: "PARTLABEL=archive", sub: "in the GPT table, set by parted name", fill: "fillaccent" }], [{ text: "sdc1", sub: "the partition" }]], "Two different labels at two different layers"),
    fdisk: fields([{ text: "p", note: "print" }, { text: "g", note: "new GPT" }, { text: "n", note: "new partition" }, { text: "t", note: "type" }, { text: "w", note: "write", cls: "warn" }, { text: "q", note: "quit, no save", cls: "good" }], "fdisk's one-letter menu. Nothing is written until w."),
    dd: command("dd if=/dev/zero of=blank.img bs=1M count=10", [{ start: 3, end: 15, label: "input" }, { start: 16, end: 28, label: "output, overwritten", row: 1 }, { start: 29, end: 34, label: "block size" }, { start: 35, end: 43, label: "how many blocks", row: 1 }], "Read the of= value twice"),
    ddmore: flow(["lsblk\nwhich is the stick?", "umount\nits partitions", "dd of=/dev/sdb\nwhole device", "sync, lsblk\ncheck"], "Imaging a drive safely"),
    smart: bars([{ name: "sdc", value: 2, max: 200, cls: "fillgood", note: "0 reallocated" }, { name: "sdd", value: 2, max: 200, cls: "fillgood", note: "0 reallocated" }, { name: "sde", value: 2, max: 200, cls: "fillgood", note: "0 reallocated" }, { name: "sdf", value: 184, max: 200, cls: "fillbad", note: "184 reallocated, 16 pending" }], "Read the raw counts, not just PASSED"),
    lvmstack: stack([[{ text: "LV docs", sub: "/dev/data/docs, 12G", fill: "fillgood" }, { text: "free", sub: "room to grow" }], [{ text: "VG data", sub: "the pool, 20G in 4 MiB extents", fill: "fillaccent" }], [{ text: "PV /dev/sdc", sub: "10G" }, { text: "PV /dev/sdd", sub: "10G" }]], "Disks pool into a group. Volumes are cut from the pool."),
    lvmcreate: flow(["pvcreate\nsdc sdd", "vgcreate data", "lvcreate -n docs\n-L 5G", "pvs vgs lvs\ncheck"], "Three commands, three checks"),
    lvmremove: flow(["umount", "lvremove", "vgremove", "pvremove"], "Take LVM apart in reverse order"),
    lvminspect: fields([{ text: "pvs / pvdisplay", note: "disks" }, { text: "vgs / vgdisplay", note: "pool" }, { text: "lvs / lvdisplay -m", note: "volumes and where they live" }], "Short form for daily use, display form for detail"),
    lvmextend: flow(["vgextend\nadd a disk", "lvextend -L +4G", "resize2fs\nor -r", "df shows\nnew size"], "Grow the pool, the volume, then the filesystem"),
    raid1: disks([{ name: "sdc", cells: ["d A", "d B", "d C"] }, { name: "sdd", cells: ["m A copy", "m B copy", "m C copy"] }], "RAID 1: every block on both disks", "Usable: one disk. Survives: one disk."),
    raid0: disks([{ name: "sdc", cells: ["d A1", "d B1", "d C1"] }, { name: "sdd", cells: ["d A2", "d B2", "d C2"] }], "RAID 0: each block split across both disks", "Usable: both disks. Survives: nothing."),
    linearraid: disks([{ name: "sdc", cells: ["d plain", "d stripe 1", "f free"] }, { name: "sdd", cells: ["d mirror", "d stripe 2", "f free"] }, { name: "sde", cells: ["m mirror copy", "d stripe 3", "f free"] }], "Three layouts in one volume group"),
    raid5: disks([{ name: "sdc", cells: ["d A1", "d B1", "p C parity"] }, { name: "sdd", cells: ["d A2", "p B parity", "d C1"] }, { name: "sde", cells: ["p A parity", "d B2", "d C2"] }], "RAID 5: parity rotates across the disks", "Usable: all but one disk. Survives: one disk."),
    ubuntulvm: bars([{ name: "ubuntu-lv", value: 5, max: 10, cls: "fillaccent", note: "5G after install" }, { name: "after lvextend", value: 10, max: 10, cls: "fillgood", note: "-l +100%FREE -r" }], "The installer leaves free space in ubuntu-vg"),
    snapshot: stack([[{ text: "docs", sub: "live, version 2" }, { text: "snapshot: before", sub: "frozen, version 1", fill: "fillgood" }], [{ text: "changed blocks", sub: "old copies stored in the snapshot's 1G", fill: "fillwarn" }]], "A snapshot keeps the old version of each changed block"),
    restore: flow(["lvconvert --merge", "umount", "lvchange -an\nthen -ay", "back to\nthe snapshot"], "Merge, then reactivate to roll back"),
    zfsmirror: stack([[{ text: "tank", sub: "mounted at /tank, ready", fill: "fillgood" }], [{ text: "mirror-0", fill: "fillaccent" }], [{ text: "sdc" }, { text: "sdd" }]], "One command makes the pool and its filesystem"),
    byid: flow(["/dev/disk/by-id/\nata-...SN1001", "link to ../../sdc", "zpool status\nshows the serial"], "Serial-based names survive reboots"),
    raidz: disks([{ name: "sdc", cells: ["d data", "d data", "p parity"] }, { name: "sdd", cells: ["d data", "p parity", "d data"] }, { name: "sde", cells: ["p parity", "d data", "d data"] }], "raidz: one disk of parity spread across all", "Usable about 2 of 3 disks. raidz2 keeps two parity blocks."),
    datasets: tree(["tank           # the pool, /tank", "├── home       # dataset, /tank/home", "│   └── ana    # dataset, /tank/home/ana", "└── backups    # dataset, /tank/backups"], "Datasets nest like folders, but each is a filesystem"),
    zfsprops: stack([[{ text: "tank", sub: "compression=lz4 (local)", fill: "fillaccent" }], [{ text: "tank/logs", sub: "lz4 inherited, quota=2G local" }, { text: "tank/home", sub: "lz4 inherited" }]], "Children inherit properties unless they set their own"),
    zfssnap: flow(["tank/docs\nv1", "snapshot\n@monday", "change to v2", "rollback\nback to v1"], "Snapshots are instant. Rollback discards later changes."),
    clone: flow(["tank/docs@monday", "zfs clone", "tank/test\nwritable", "destroy when done"], "A clone starts as a snapshot and grows only with changes"),
    scrub: flow(["read every block", "check checksum", "bad? read the\nmirror copy", "repair"], "A scrub finds and fixes silent damage"),
    lukstack: stack([[{ text: "/mnt/secret", sub: "files, readable while open" }], [{ text: "ext4 on /dev/mapper/secret", sub: "decrypted view", fill: "fillgood" }], [{ text: "LUKS header", sub: "key slots", fill: "fillwarn" }, { text: "encrypted data", sub: "random bytes without the key", fill: "fillaccent" }], [{ text: "/dev/sde" }]], "LUKS sits between the disk and the filesystem"),
    lukscli: flow(["luksFormat\n/dev/sde", "open\nas secret", "mkfs + mount\n/dev/mapper/secret", "umount, close"], "Format once, then open, use, close"),
    lukskeys: fields([{ text: "slot 0", note: "first passphrase" }, { text: "slot 1", note: "luksAddKey", cls: "good" }, { text: "slots 2-31", note: "empty" }, { text: "master key", note: "same in every slot" }], "Each key slot unlocks the same master key"),
    bootprotect: flow(["GRUB menu", "e to edit\nneeds password", "recovery shell\nblocked", "LUKS root\nstill locked"], "Layered protection for console access")
  };
};

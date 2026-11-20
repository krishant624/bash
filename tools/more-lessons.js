function L(file, title, point, idea, more, diagram, run, kind, call, script, table, sample) {
  return { file: file, title: title, point: point, idea: idea, more: more, diagram: diagram, run: run, kind: kind, call: call, script: script || "", table: table || null, sample: sample || "" };
}
function W(lesson, widget) {
  lesson.widget = widget;
  return lesson;
}

var afterShell = [
  L("terminal.html", "The terminal and how to customize it",
    "The terminal is the window. Bash is the program inside it. Changing one does not change the other.",
    [
      "A terminal emulator, such as GNOME Terminal, Windows Terminal, or iTerm2, draws text and sends your keys. It starts a shell, usually Bash, and shows what the shell prints. TERM tells programs what the window can draw, such as xterm-256color.",
      "Font, colors, size, and tabs are terminal settings, found in its Preferences or Profiles menu. The prompt text, aliases, and history size are Bash settings, kept in ~/.bashrc. The Shell setup topic covers the Bash side."
    ],
    "When colors look wrong over SSH, check TERM on both ends. A remote host that does not know your terminal type falls back to plain text.",
    "terminal",
    ["echo $SHELL", "echo $TERM", "ps -o pid,comm"],
    "analogy",
    "The terminal is the TV. Bash is the channel. A bigger screen or a new color scheme does not change what the channel broadcasts."),
];

var afterMan = [
  L("command.html", "Which program actually runs",
    "Before Bash runs a word, it checks aliases, then functions, then builtins, then each folder on PATH. type shows which one wins.",
    [
      "type ls tells you if ls is an alias or a file. which ls searches PATH only, so it cannot see aliases or builtins. type -a lists every match in the order Bash would try them.",
      "The command builtin skips aliases and functions. command ls runs the real ls even when an alias exists. command -v ls prints what would run, which makes it the portable test inside scripts: if command -v jq > /dev/null; then ... fi."
    ],
    "A leading backslash, \\ls, also skips an alias for one run. command is clearer in a script.",
    "lookup",
    ["type ls", "alias ls='ls -F'", "type ls", "command ls", "type -a echo", "which cd", "type cd", "command -v ls"],
    "insight",
    "When a command behaves strangely on one host only, run type -a on it first. A stray alias in ~/.bashrc is the usual answer."),
];

var afterCat = [
  L("redirect.html", "Redirect output and errors",
    "Every command has three streams: 0 is input, 1 is normal output, 2 is errors. Redirection sends each one to a file of your choice.",
    [
      "> file sends stream 1 to a file and replaces it. >> appends. 2> sends errors elsewhere. &> sends both. 2>&1 means make stream 2 go wherever stream 1 is going right now.",
      "/dev/null is a file that throws away whatever is written to it. cmd 2>/dev/null hides errors. cmd > /dev/null 2>&1 hides everything, and only the exit status remains."
    ],
    "Order matters. cmd > out.txt 2>&1 puts both streams in the file. cmd 2>&1 > out.txt sends errors to the screen, because stream 1 still pointed at the screen when 2>&1 was read.",
    "fds",
    ["ls notes.txt nope", "ls notes.txt nope > out.txt", "cat out.txt", "ls notes.txt nope > out.txt 2> err.txt", "cat err.txt", "ls notes.txt nope > all.txt 2>&1", "cat all.txt", "ls nope 2> /dev/null; echo $?"],
    "mistake",
    "Writing 2>&1 before > file and wondering why errors still scroll past. Read redirections left to right, like assignments.",
    "",
    { headers: ["Form", "Meaning"], rows: [["> f", "stdout to f, replace"], [">> f", "stdout to f, append"], ["2> f", "stderr to f"], ["&> f", "stdout and stderr to f"], ["> f 2>&1", "the same, portable form"], ["< f", "stdin from f"], ["2> /dev/null", "throw errors away"]] }),
];

var afterTouch = [
  L("stat.html", "Times and details with stat",
    "stat prints everything the filesystem stores about a name: size, inode, links, owner, mode, and three times.",
    [
      "Modify (mtime) changes when the contents change. Change (ctime) changes when the contents or the metadata change, for example after chmod. Access (atime) is when it was last read. Many hosts mount with relatime, so atime is updated only now and then.",
      "touch sets mtime to now, which is how make and backup tools are fooled or refreshed. stat -c picks fields: %a is the octal mode, %U the owner, %s the size, %y the modify time, %n the name."
    ],
    "ls -l shows mtime. ls -lc shows ctime. ls -lu shows atime. stat shows all three at once.",
    "times",
    ["stat notes.txt", "chmod 600 notes.txt", "stat -c '%a %U %s %n' notes.txt", "echo more >> notes.txt", "stat -c '%y  %n' notes.txt"],
    "insight",
    "If someone asks who changed a file's permissions, ctime tells you when. It cannot tell you who. That needs an audit log."),
];

var afterMkdir = [
  L("nano.html", "Edit a file with nano",
    "nano is the simple terminal editor. The keys you need are printed at the bottom of its screen.",
    [
      "nano notes.txt opens the file. Type to insert text. Ctrl+O writes the file, and Enter confirms the name. Ctrl+X exits and asks to save if there are changes. The ^ in the help bar means Ctrl.",
      "Ctrl+W searches. Ctrl+K cuts a line and Ctrl+U pastes it. Alt+U undoes. nano -l shows line numbers, which helps when an error message names a line."
    ],
    "This lab has no full-screen editor. It prints nano's key guide instead. Use echo, printf, or the script box to change practice files here.",
    "nano",
    ["nano notes.txt"],
    "analogy",
    "nano is a notepad with the shortcuts written on the edge. vim, next, is a power tool that is worth the learning time if you edit files on servers every day.",
    "",
    { headers: ["Key", "Action"], rows: [["Ctrl+O", "Write out (save)"], ["Ctrl+X", "Exit"], ["Ctrl+W", "Search"], ["Ctrl+K / Ctrl+U", "Cut line / paste"], ["Alt+U", "Undo"], ["Ctrl+_", "Go to a line number"]] }),
];

var afterLinks = [
  L("hardlink.html", "Hard links and inodes",
    "A file's data lives in an inode. A name is a pointer to an inode. A hard link is a second name for the same inode.",
    [
      "ln notes.txt again.txt makes a second name. ls -li shows the same inode number for both, and the link count is 2. Write through either name and both see the change, because there is only one file.",
      "rm removes one name. The data is freed only when the link count drops to zero. A symbolic link, ln -s, is different: it stores a path, so it breaks when the target name goes away."
    ],
    "Hard links cannot cross filesystems and cannot point at folders. Symbolic links can do both, which is why they are the everyday kind.",
    "inode",
    ["ln notes.txt again.txt", "ls -li notes.txt again.txt", "echo extra >> again.txt", "tail -n 1 notes.txt", "rm notes.txt", "cat again.txt", "ln -s again.txt soft.txt", "rm again.txt", "cat soft.txt"],
    "insight",
    "The link count is the second column of ls -l. A file with 2 there has another name somewhere. find / -samefile tells you where."),
];

var afterFind = [
  L("find-more.html", "find by size, owner, and time, then act",
    "find can test more than names: type, size, age, owner, and permission. -exec runs a command on each match.",
    [
      "-size +100k means larger than 100 KiB. -mtime -7 means modified in the last seven days. -user ana and -perm -4000 filter by owner and by a setuid bit. -maxdepth 1 stops find from walking into subfolders.",
      "-exec cmd {} \\; runs once per file. -exec cmd {} + runs once with many files, which is much faster. -delete removes what matched, so run the same find without -delete first and read the list."
    ],
    "Put -maxdepth before the other tests. Quote patterns such as '*.log' so the shell does not expand them before find sees them.",
    "findmore",
    ["find . -maxdepth 1 -type f", "find . -type f -size +100c", "touch notes.txt", "find . -newer names.txt", "find /usr/bin -perm -4000", "find . -name '*.txt' -exec wc -l {} +", "find . -name '*.log' -exec grep -c ERROR {} \\;", "mkdir empty", "find . -type d -empty"],
    "caution",
    "find ... -delete with a typo in the start folder can remove far more than you meant. Print first, delete second."),
];

var afterRegex = [
  L("regex-classes.html", "Basic and extended regex, classes and repeats",
    "grep uses basic regex by default. grep -E uses extended regex, where + ? | { } and ( ) work without backslashes.",
    [
      "In basic regex, ERROR\\|WARN means either word. In extended regex you write ERROR|WARN. Repeats work the same way: [0-9]\\{4\\} in basic, [0-9]{4} in extended.",
      "Named classes go inside brackets: [[:digit:]], [[:upper:]], [[:space:]], [[:alpha:]]. They are safer than a-z on hosts with unusual locales. -o prints only the matched part, and -w matches whole words."
    ],
    "sed and awk follow the same split. sed is basic unless you pass -E. awk always uses extended regex.",
    "regexmore",
    ["grep 'ERROR\\|WARN' app.log", "grep -E 'ERROR|WARN' app.log", "grep -E '[0-9]{4}$' app.log", "grep -o '[[:digit:]]\\+ percent' app.log", "grep -oE '[[:upper:]]{4,5}' app.log", "grep -w 'ok' app.log"],
    "mistake",
    "Writing ERROR|WARN without -E. Basic grep searches for the literal text ERROR|WARN and finds nothing.",
    "",
    { headers: ["Idea", "Basic (grep, sed)", "Extended (grep -E, sed -E, awk)"], rows: [["either", "a\\|b", "a|b"], ["one or more", "a\\+", "a+"], ["zero or one", "a\\?", "a?"], ["exactly n", "a\\{3\\}", "a{3}"], ["group", "\\(ab\\)", "(ab)"]] }),
];

var afterSort = [
  L("wc.html", "Count lines, words, and bytes",
    "wc counts. -l lines, -w words, -c bytes. With several files it adds a total line.",
    [
      "wc notes.txt prints lines, words, bytes, and the name. wc -l app.log is the usual question: how many log lines. Piped input has no name, so the output is just the number.",
      "grep -c ERROR app.log counts matching lines in one step. grep ERROR app.log | wc -l does the same with two programs. Both are fine. wc is the one that also works after awk, sort, or uniq."
    ],
    "wc -l counts newline characters. A last line without a newline is not counted. Files made by echo and printf with \\n always end correctly.",
    "wc",
    ["wc notes.txt", "wc -l app.log", "wc -w notes.txt", "wc -l *.txt", "grep ERROR app.log | wc -l"],
    "insight",
    "Put wc -l at the end of a pipeline to check each step. If a filter removed nothing, the count tells you before you read a single line."),
  L("uniq.html", "Collapse repeats with uniq",
    "uniq removes repeated lines that sit next to each other. Sort first, so equal lines are neighbors.",
    [
      "uniq names.txt keeps the duplicate ana because it is adjacent. sort names.txt | uniq collapses it. -c puts a count before each line. -d prints only lines that repeat. -u prints only lines that appear once.",
      "sort | uniq -c | sort -rn is the classic frequency table: count each value, then put the biggest count first. awk picks the field, and the rest of the pipe counts it."
    ],
    "sort -u removes duplicates in one step, but it cannot count them. uniq -c is the one that answers how many.",
    "uniq",
    ["uniq names.txt", "sort names.txt | uniq", "sort names.txt | uniq -c", "sort names.txt | uniq -d", "awk '{print $2}' app.log | sort | uniq -c | sort -rn"],
    "mistake",
    "Running uniq on unsorted input and trusting the result. uniq only looks at the line above."),
];

var afterAwk = [
  L("awk-more.html", "awk programs: patterns, sums, and END",
    "An awk program is pattern { action }. The pattern picks lines. The action runs on each picked line. END runs once after the last line.",
    [
      "NR is the line number and NF the number of fields. $NF is the last field. awk 'NR==2' prints line two. awk '$2 != \"INFO\"' prints lines whose second field is not INFO. -F: splits on colons, which is how /etc/passwd is read.",
      "Variables start at zero, so {s += $1} END {print s} sums a column. Arrays count by key: {n[$2]++} END {for (k in n) print k, n[k]}. printf formats columns, the same way the shell's printf does."
    ],
    "awk is a full language, but keep one-liners to one idea. When a program grows past a line, put it in a file and run awk -f file.awk.",
    "awkmore",
    ["awk 'NR==2' app.log", "awk '$2 != \"INFO\"' app.log", "awk '{print NF, $NF}' app.log", "awk '{s += $1} END {print \"total\", s}' sizes.txt", "awk '{n[$2]++} END {for (k in n) print k, n[k]}' app.log", "awk -F: '$3 >= 1000 {printf \"%-6s %s\\n\", $1, $7}' /etc/passwd"],
    "insight",
    "Single-quote every awk program. Inside double quotes, the shell would expand $1 and $2 before awk ever sees them.",
    "awk -F: '\n  $7 ~ /bash/ { users++; print $1 }\n  END { print users, \"accounts use bash\" }\n' /etc/passwd"),
];

var afterSed = [
  L("sed-more.html", "sed addresses, delete, and in-place edits",
    "A sed command can start with an address: a line number, a range, or /regex/. The command runs only on those lines.",
    [
      "sed -n '2p' prints line 2 only, because -n turns off the default printing. sed '1d' deletes the first line. sed '/INFO/d' deletes matching lines. $ is the last line, and 2,4 is a range.",
      "Groups capture text. With -E, \\(...\\) becomes (...), and \\1 puts the first group back. sed -i edits the file in place. On a real host, -i.bak keeps a backup copy, which is the safe habit."
    ],
    "Test the expression without -i first. When the output looks right, add -i and run it again.",
    "sedmore",
    ["sed -n '2p' app.log", "sed '1d' app.log", "sed '/INFO/d' app.log", "sed -n '$p' app.log", "sed -E 's/^([0-9-]+)T([0-9:]+)/\\2 on \\1/' app.log", "cp names.txt names.bak", "sed -i 's/ana/ANA/g' names.bak", "cat names.bak"],
    "caution",
    "sed -i on the wrong glob rewrites every matching file at once. Run with -n and p first to see what would change."),
  L("xargs.html", "Turn lines into arguments with xargs",
    "xargs reads words from input and appends them to a command line. It joins tools that print names with tools that take names.",
    [
      "ls *.txt | xargs echo runs echo once with every name. -n 1 runs once per name. -I{} puts each item where {} is, so you can place it in the middle of a command.",
      "find ... | xargs wc -l is the classic pair. Names with spaces break plain xargs. find -print0 | xargs -0 separates names with a zero byte, which no file name can contain."
    ],
    "find -exec ... + does the same job without a pipe. Use xargs when the names come from something other than find, such as grep -l or a list in a file.",
    "xargs",
    ["ls *.txt | xargs echo", "ls *.txt | xargs -n 1 echo file:", "find . -name '*.txt' | xargs wc -l", "grep -l ana *.txt | xargs -I{} echo found in {}", "printf 'a\\nb\\n' | xargs -I{} echo item-{}"],
    "insight",
    "Add -t while you build an xargs line. It prints each command before running it, so you can see exactly what will happen."),
];

var archiveFront = [
  L("gzip.html", "Compress one file with gzip",
    "gzip compresses one file and replaces it with file.gz. gunzip reverses it. It does not bundle folders. tar does that.",
    [
      "gzip app.log leaves app.log.gz and removes app.log. -k keeps the original. -l shows the compressed and uncompressed sizes. -d or gunzip restores the file.",
      "zcat prints a .gz file without unpacking it, so zcat app.log.gz | grep ERROR searches a rotated log in place. zgrep does the same in one word on a real host."
    ],
    "Rotated logs in /var/log are often .gz. Reach for zcat or zgrep before you unpack them all.",
    "gzip",
    ["gzip -k app.log", "ls -l app.log*", "gzip -l app.log.gz", "zcat app.log.gz | head -n 2", "rm app.log", "gunzip app.log.gz", "ls app.log*"],
    "insight",
    "A tiny file can get bigger when compressed, because gzip adds a header. Compression pays off on large text such as logs."),
];

var afterTar = [
  L("tar-more.html", "tar: list, pick one file, extract elsewhere",
    "tar t lists an archive. tar x extracts. -C picks the folder to extract into. A member name after the archive extracts only that file.",
    [
      "c creates, t lists, x extracts. z, j, and J choose gzip, bzip2, or xz. v lists names as they pass. f names the archive file and must come last in the group, because the next word is its argument.",
      "tar -xzf work.tar.gz -C restore reports/monday.txt pulls one file out without touching anything else. --exclude='*.log' leaves matching names out when you create."
    ],
    "Always list before you extract an archive from someone else. A member called ../../etc/passwd is the kind of surprise tar t shows you first.",
    "tarmore",
    ["tar -czvf work.tar.gz reports notes.txt app.log", "tar -tvf work.tar.gz", "mkdir restore", "tar -xzf work.tar.gz -C restore reports/monday.txt", "find restore", "tar -czf small.tar.gz --exclude='*.log' reports notes.txt app.log", "tar -tf small.tar.gz"],
    "caution",
    "tar x overwrites files with the same names in the target folder. Extract into a new folder with -C when in doubt."),
  L("compress.html", "bzip2 and xz",
    "bzip2 and xz work like gzip but squeeze harder and run slower. tar picks them with j and J.",
    [
      "gzip is fast and everywhere. bzip2 is smaller and slower. xz is usually the smallest and the slowest to compress, but quick to decompress, which is why software releases use .tar.xz.",
      "The options match: -k keeps the original, -d decompresses, -c writes to standard output. bzcat and xzcat print without unpacking, like zcat."
    ],
    "Choose by who has to wait. Logs you compress every night: gzip. A file you publish once and many people download: xz.",
    "compress",
    ["cp app.log a.log", "cp app.log b.log", "cp app.log c.log", "gzip a.log", "bzip2 b.log", "xz c.log", "ls -l a.log.gz b.log.bz2 c.log.xz", "xzcat c.log.xz | tail -n 1", "tar -cJf reports.tar.xz reports"],
    "analogy",
    "The three tools are three suitcase packers. gzip packs fast. xz takes its time and fits more in the same case.",
    "",
    { headers: ["Tool", "Extension", "tar letter", "Speed", "Size"], rows: [["gzip", ".gz", "z", "fast", "good"], ["bzip2", ".bz2", "j", "slow", "better"], ["xz", ".xz", "J", "slowest to pack", "best"]] }),
];

var afterUnzip = [
  L("sevenzip.html", "7-Zip archives",
    "7z handles .7z files and most other formats. It is common when files travel to and from Windows.",
    [
      "7z a pack.7z reports adds files to an archive. 7z l lists it. 7z x extracts with the folder paths. 7z e extracts every file into one folder and drops the paths.",
      "On Debian and Ubuntu the package is p7zip-full or 7zip. A .7z file is often smaller than the same zip. -p asks for a password, and on a real host -mhe=on also hides the file names."
    ],
    "zip is the format everyone can open. 7z is the one to use when size matters and the other side has 7-Zip.",
    "sevenzip",
    ["7z a pack.7z reports notes.txt", "7z l pack.7z", "mkdir out", "cd out", "7z x ../pack.7z", "find ."],
    "insight",
    "x keeps folders. e flattens them. Pick x unless you really want every file in one place."),
  L("rsync-backup.html", "Back up a folder with rsync",
    "rsync copies only what changed. Run it again and it sends nothing new. That makes it the everyday backup tool.",
    [
      "rsync -av src/ dest/ copies the contents of src into dest. -a keeps times, modes, and links. -v names each file. Without the trailing slash, rsync -av src dest/ makes dest/src.",
      "--delete removes files from dest that are gone from src, so dest becomes a true mirror. -n is a dry run. Always try -n with --delete first."
    ],
    "A mirror is not a history. If a file is deleted by mistake and you sync with --delete, the backup loses it too. Keep dated copies or use snapshots for history.",
    "rsyncbackup",
    ["rsync -av reports/ backup/", "rsync -av reports/ backup/", "echo tuesday > reports/tuesday.txt", "rm reports/monday.txt", "rsync -avn --delete reports/ backup/", "rsync -av --delete reports/ backup/", "ls backup", "rsync -av reports backup2/", "find backup2"],
    "caution",
    "The trailing slash changes the result. src/ means the contents. src means the folder itself."),
];

var usersTopic = {
  id: "users",
  title: "Users",
  lessons: [
    L("root.html", "The root user",
      "root is user id 0. The kernel lets uid 0 read, change, or delete anything. Daily work happens as a normal user, with sudo for single commands.",
      [
        "Your prompt ends in $ as ana and # as root. id prints your uid and groups. /etc/shadow is readable only by root and the shadow group, so cat as ana is denied and sudo cat works.",
        "sudo runs one command as root and records it in the log. Logging in as root, or living in a root shell, removes that record and that pause to think. Many distributions lock the root password for this reason."
      ],
      "A typo as root has no safety net. rm -rf / tmp, with a stray space, is a different command when you are uid 0.",
      "root",
      ["whoami", "id", "id root", "cat /etc/shadow", "sudo cat /etc/shadow", "sudo whoami"],
      "caution",
      "Use sudo per command. Leave a root shell as soon as the task is done."),
    L("account-files.html", "Where accounts live",
      "Accounts are lines of text. /etc/passwd lists users, /etc/shadow holds password hashes, and /etc/group lists groups.",
      [
        "A passwd line has seven fields separated by colons: name, x, uid, gid, comment, home, shell. The x means the password is in /etc/shadow. uid 1000 and up are people. Lower uids are system accounts.",
        "A group line is name:x:gid:members. A user's primary group is the gid in passwd. Supplementary groups list the user's name in /etc/group. getent reads the same data, including from LDAP when a host uses it."
      ],
      "Read these files. Change them with useradd, usermod, and groupadd, not with an editor. The tools lock the files and keep passwd, shadow, and group consistent.",
      "passwdfields",
      ["grep ana /etc/passwd", "getent passwd ken", "awk -F: '{print $1, $3, $7}' /etc/passwd", "grep staff /etc/group", "ls -l /etc/passwd /etc/shadow /etc/group"],
      "insight",
      "A shell of /usr/sbin/nologin means the account exists for a service and nobody can log in as it.",
      "",
      { headers: ["Field", "Example", "Meaning"], rows: [["1", "ana", "login name"], ["2", "x", "password is in /etc/shadow"], ["3", "1000", "user id"], ["4", "1000", "primary group id"], ["5", "Ana Lee", "comment, often the full name"], ["6", "/home/ana", "home folder"], ["7", "/bin/bash", "login shell"]] }),
    L("useradd.html", "Add a user",
      "useradd creates an account. -m makes the home folder, -s picks the shell, and -c sets the full name. passwd sets the password.",
      [
        "Only root may add users, so useradd without sudo is denied. sudo useradd -m -s /bin/bash -c 'Bob Brown' bob writes a passwd line, a shadow line, a group, and /home/bob copied from /etc/skel.",
        "A new account has no password and cannot log in yet. sudo passwd bob sets one. The shadow line then holds a hash, not the password itself."
      ],
      "useradd without -m creates no home folder on many distributions. Pass -m every time unless you mean it.",
      "useradd",
      ["useradd bob", "sudo useradd -m -s /bin/bash -c 'Bob Brown' bob", "getent passwd bob", "ls -la /home/bob", "sudo passwd bob", "sudo grep bob /etc/shadow", "id bob"],
      "mistake",
      "Forgetting -s /bin/bash on a host where the default is /bin/sh, then wondering why tab completion and history are missing."),
    L("adduser.html", "adduser and the skeleton folder",
      "adduser is the friendly Debian and Ubuntu wrapper. It asks questions, makes the home folder, and sets the password in one go.",
      [
        "sudo adduser carol creates the user and group, copies /etc/skel into /home/carol, and prompts for a password and full name. On Red Hat family hosts, adduser is simply another name for useradd.",
        "/etc/skel is the template. Every file in it, such as .bashrc, is copied into each new home folder. Put a team's default aliases there, and new accounts start with them."
      ],
      "Changing /etc/skel affects new accounts only. Existing users keep the files they already have.",
      "skel",
      ["ls -la /etc/skel", "sudo adduser carol", "ls -la /home/carol", "id carol"],
      "insight",
      "Use adduser at an interactive prompt on Debian or Ubuntu. Use useradd in scripts, because it never stops to ask."),
    L("usermod.html", "Edit a user",
      "usermod changes an existing account: comment, shell, groups, home, name, or lock state.",
      [
        "-c changes the comment and -s the shell. -aG staff adds a supplementary group and keeps the others. -G alone replaces the whole list, which can remove someone from sudo by accident.",
        "Group changes apply at the next login. A user who is already logged in keeps the old list until they log out, or run newgrp, or start a new SSH session."
      ],
      "Always write -aG together. If you see usermod -G in a runbook, check whether replacing the list is what the author wanted.",
      "usermod",
      ["sudo usermod -c 'Ken Ito, ops' ken", "getent passwd ken", "sudo usermod -s /bin/sh ken", "sudo usermod -aG staff ken", "groups ken", "sudo usermod -G ken ken", "groups ken"],
      "mistake",
      "usermod -G docker ana, without -a, removes ana from every other group, including sudo."),
    L("usermod-more.html", "Rename a user and move the home folder",
      "usermod -l renames the login. -d with -m moves the home folder and its files.",
      [
        "sudo usermod -l david dave changes the name in passwd and shadow. The uid stays the same, so file ownership does not change. The home folder keeps its old path until you move it.",
        "sudo usermod -d /home/david -m david updates the home field and moves the contents. groupmod -n renames the user's own group if you want that to match too."
      ],
      "Rename only when the user is logged out. A running process keeps the old name in its environment and can write to the old path.",
      "usermod",
      ["sudo useradd -m dave", "sudo usermod -l david dave", "getent passwd david", "sudo usermod -d /home/david -m david", "getent passwd david", "ls /home"],
      "insight",
      "Ownership follows the number, not the name. A renamed user still owns every file they owned before."),
    L("chage.html", "Password ageing with chage",
      "chage reads and sets password ageing: when a password expires, how early to warn, and when the whole account expires.",
      [
        "chage -l ana prints the dates. -M 90 forces a new password every 90 days. -W 14 warns 14 days before. -E 2027-01-31 expires the account on that date, which suits a contractor.",
        "chage -d 0 marks the password as expired now, so the user must choose a new one at the next login. That is the usual step after you set a temporary password."
      ],
      "These numbers live in /etc/shadow, fields 3 to 8. chage is the readable way to see and change them.",
      "chage",
      ["chage -l ana", "sudo chage -M 90 -W 14 ken", "sudo chage -E 2027-01-31 ken", "sudo chage -d 0 ken", "sudo chage -l ken"],
      "insight",
      "Set temporary password, then chage -d 0. The user changes it on first login and you never know their real password."),
    L("userdel.html", "Disable or remove a user",
      "Lock first, delete later. A locked account keeps its files and can be unlocked. userdel -r deletes the account and its home folder.",
      [
        "passwd -l mina locks the password by putting ! in front of the hash. usermod -s /usr/sbin/nologin mina blocks shells. chage -E 0 mina expires the account entirely, which also stops SSH key logins.",
        "userdel mina removes the account and keeps /home/mina. userdel -r also removes the home folder and mail spool. Files elsewhere stay, owned by a bare uid number."
      ],
      "Before deleting, find what the user owns: sudo find / -user mina. Hand those files to someone, or archive them, then delete.",
      "userdel",
      ["sudo passwd -l mina", "sudo passwd -S mina", "sudo usermod -s /usr/sbin/nologin mina", "sudo chage -E 0 mina", "sudo chage -l mina", "sudo userdel -r mina", "getent passwd mina; echo $?"],
      "caution",
      "Locking a password does not stop SSH keys. Expire the account with chage -E 0, or remove the keys, when someone leaves."),
    L("sudo.html", "Give a user root privileges",
      "A user gets root privileges through sudo. Adding them to the sudo group (wheel on Red Hat) is the usual way. A file in /etc/sudoers.d can give narrower rights.",
      [
        "sudo usermod -aG sudo ken makes ken an administrator at his next login. sudo -l lists what the current user may run. sudo -u ken cmd runs a command as ken instead of root.",
        "For one command only, write a rule such as ken ALL=(ALL:ALL) /usr/bin/systemctl into /etc/sudoers.d/ken. visudo -c checks the syntax. A broken sudoers file can lock everyone out of sudo."
      ],
      "Edit sudoers with visudo or visudo -f /etc/sudoers.d/name. It refuses to save a file that does not parse.",
      "sudo",
      ["groups ken", "sudo -u ken whoami", "sudo usermod -aG sudo ken", "groups ken", "echo 'ken ALL=(ALL:ALL) /usr/bin/systemctl' | sudo tee /etc/sudoers.d/ken", "sudo visudo -c", "sudo -l"],
      "caution",
      "Never edit /etc/sudoers with a plain editor over SSH. One typo and nobody can sudo to fix it.")
  ]
};

var afterOwnership = [
  L("group-accounts.html", "Groups",
    "A group lets several users share files. Every user has one primary group and any number of supplementary groups.",
    [
      "id prints your uid, your primary gid, and every group you belong to. groups prints just the names. New files get your primary group, which is why notes.txt belongs to group ana.",
      "/etc/group holds the member lists. ana is in sudo, so ana can use sudo. ana and mina are in staff, so a file with group staff and mode 664 is writable by both."
    ],
    "The group column in ls -l is the second name. The middle three permission letters apply to members of that group.",
    "groupacc",
    ["id", "groups", "groups ken", "grep -E '^(staff|sudo):' /etc/group", "ls -l notes.txt"],
    "insight",
    "Before you chmod 777 to let a colleague in, ask whether you share a group. 664 or 775 with the right group is the tidy answer."),
];

var afterChgrp = [
  L("group-manage.html", "Create a group and share a folder",
    "groupadd makes a group. gpasswd -a adds members. A folder with that group, mode 2775, becomes a shared space.",
    [
      "sudo groupadd devs creates the group. sudo gpasswd -a ken devs adds ken. Members see the new group after they log in again, so ana's current shell still has the old list.",
      "chgrp devs shared and chmod 2775 shared give the group write access. The 2 is setgid on a folder: new files inside get group devs instead of the creator's own group, so everyone in devs can edit them."
    ],
    "groupdel removes a group. It refuses if the group is any user's primary group.",
    "groupshare",
    ["sudo groupadd devs", "sudo gpasswd -a ana devs", "sudo gpasswd -a ken devs", "grep devs /etc/group", "mkdir shared", "sudo chgrp devs shared", "chmod 2775 shared", "ls -ld shared", "touch shared/plan.txt", "ls -l shared"],
    "insight",
    "Without setgid on the folder, each new file gets its creator's group and the others cannot edit it. The 2 in 2775 is the fix."),
  W(L("setuid.html", "setuid: run as the file's owner",
    "A program with the setuid bit runs with its owner's privileges, not the caller's. passwd is setuid root so it can write /etc/shadow.",
    [
      "ls -l /usr/bin/passwd shows rws in the owner part. The s replaces x. chmod u+s or chmod 4755 sets it. A capital S means setuid is set but execute is not, which does nothing useful.",
      "find / -perm -4000 lists every setuid file. On a server that list should be short and well known. A new setuid file in a home folder is a red flag."
    ],
    "Linux ignores setuid on shell scripts. It only works on compiled programs, because a script can be raced between the check and the run.",
    "setuid",
    ["ls -l /usr/bin/passwd", "find /usr/bin -perm -4000", "cp app.log tool", "chmod 4755 tool", "ls -l tool", "chmod 4644 tool", "ls -l tool", "stat -c '%a %A %n' tool"],
    "caution",
    "Never make a writable file setuid. Anyone who can change it can run code as its owner."), "perm"),
  W(L("setgid-sticky.html", "setgid and the sticky bit",
    "setgid on a folder passes its group to new files. The sticky bit on a folder lets only a file's owner delete it, even when everyone can write the folder.",
    [
      "/tmp is drwxrwxrwt. Everyone may create files there, and the t means you cannot delete someone else's. rm /tmp/ken-notes.txt as ana is refused, even though the file itself is mode 666.",
      "chmod g+s folder or the leading 2 in 2775 sets setgid. chmod +t or the leading 1 in 1777 sets sticky. The octal digits add up: 4 setuid, 2 setgid, 1 sticky."
    ],
    "On a file, setgid runs the program with the file's group. On a folder, it controls the group of new files. The meaning depends on the target.",
    "specialbits",
    ["ls -ld /tmp", "ls -l /tmp/ken-notes.txt", "rm /tmp/ken-notes.txt", "mkdir drop", "chmod 1777 drop", "ls -ld drop", "chmod g+s drop", "ls -ld drop", "stat -c '%a %A %n' drop"],
    "insight",
    "A shared upload folder usually wants 3777 or 3775: setgid so the group is right, and sticky so nobody deletes another person's file.",
    "",
    { headers: ["Bit", "Octal", "On a file", "On a folder", "ls shows"], rows: [["setuid", "4000", "run as the owner", "ignored", "s in owner x"], ["setgid", "2000", "run as the group", "new files get the folder's group", "s in group x"], ["sticky", "1000", "ignored", "only owners delete", "t in other x"]] }), "perm"),
  L("acl.html", "Access control lists",
    "An ACL adds extra permission entries to a file: ken may read and write, the staff group may read. The normal rwx bits stay underneath.",
    [
      "setfacl -m u:ken:rw notes.txt adds an entry for ken. ls -l then shows a + after the mode. getfacl prints every entry, including a mask, which is the ceiling for named users and groups.",
      "setfacl -x u:ken removes one entry. setfacl -b removes them all. The filesystem must support ACLs. ext4 and xfs do by default."
    ],
    "chmod g-w on a file with an ACL changes the mask, not the owning group's entry. That can silently take write access away from named users.",
    "acl",
    ["getfacl notes.txt", "setfacl -m u:ken:rw notes.txt", "ls -l notes.txt", "getfacl notes.txt", "setfacl -m g:staff:r notes.txt", "setfacl -x u:ken notes.txt", "getfacl notes.txt", "setfacl -b notes.txt", "ls -l notes.txt"],
    "insight",
    "Use an ACL when one extra person needs access and making a group would be overkill."),
  L("acl-default.html", "Default ACLs on a folder",
    "A default ACL on a folder is copied to every new file and folder made inside it.",
    [
      "setfacl -d -m u:ken:rwx team sets a default entry. getfacl team shows it under default:. A new file in team starts with user:ken in its own ACL.",
      "New files never get execute from a default entry. The mask is calculated from the new file's mode, so a plain file gets rw for ken, not rwx."
    ],
    "Defaults affect new names only. For files that already exist, run setfacl -R -m as well.",
    "acldefault",
    ["mkdir team", "setfacl -d -m u:ken:rwx team", "getfacl team", "touch team/new.txt", "getfacl team/new.txt", "ls -l team"],
    "insight",
    "Set both: setfacl -R -m for what is there now, and setfacl -d -m for what comes later."),
  L("attributes.html", "File attributes: immutable and append-only",
    "chattr sets filesystem attributes that even root has to remove before it can change the file. lsattr shows them.",
    [
      "chattr +i makes a file immutable: nobody may write, rename, or delete it, root included, until chattr -i. Only root can set or clear it, so ana is refused.",
      "chattr +a makes a file append-only. >> works and > fails. That suits a log file that must never be rewritten. Attributes live in ext4 and xfs, not in the permission bits."
    ],
    "If root cannot delete a file and the error says Operation not permitted, run lsattr on it before anything else.",
    "attrs",
    ["lsattr notes.txt", "chattr +i notes.txt", "sudo chattr +i notes.txt", "lsattr notes.txt", "echo more >> notes.txt", "sudo rm notes.txt", "sudo chattr -i notes.txt", "sudo chattr +a app.log", "echo new >> app.log", "echo replace > app.log", "sudo chattr -a app.log"],
    "caution",
    "An immutable /etc/resolv.conf is a common reason why network changes do not stick. lsattr explains it in one line."),
];

var afterTop = [
  L("top-more.html", "Read top's header",
    "The first five lines of top summarize the host: load, task counts, CPU split, and memory.",
    [
      "Load average is the number of tasks running or waiting, over 1, 5, and 15 minutes. Compare it with the CPU count. %Cpu shows us (user code), sy (kernel), id (idle), and wa (waiting for disk).",
      "Inside a real top, P sorts by CPU, M by memory, k kills a pid, 1 shows each CPU, and q quits. top -b -n 1 prints one frame as text, which is how you save it to a file."
    ],
    "High wa with low us means the CPU is waiting for storage. The disk is the problem, not the code.",
    "topmore",
    ["top -b -n 1", "uptime", "free -h"],
    "insight",
    "Read the header before the rows. It tells you whether to look at CPU, memory, or disk.",
    "",
    { headers: ["Field", "Meaning", "Worry when"], rows: [["us", "user programs", "one process stays near 100"], ["sy", "kernel work", "high with many small I/O calls"], ["wa", "waiting for disk", "above about 10 percent for long"], ["id", "idle", "near 0 with long queues"], ["st", "stolen by the hypervisor", "above a few percent on a VM"]] }),
];

var afterKill = [
  L("nice.html", "Priority with nice and renice",
    "Every process has a niceness from -20 to 19. Higher is nicer, which means lower priority. Only root can make a process less nice.",
    [
      "nice -n 10 cmd starts a command at niceness 10, so it yields the CPU to other work. That suits a long compression or a backup. renice -n 5 -p 880 changes a running process.",
      "A normal user may only raise niceness. renice back to 0 is refused. sudo renice can go below zero, which takes CPU away from everyone else."
    ],
    "Niceness affects CPU only. For disk-heavy work, ionice -c3 on a real host asks for idle disk time.",
    "nice",
    ["nice", "nice -n 10 echo low-priority", "nice -n -5 echo high", "renice -n 5 -p 880", "ps -o pid,ni,comm", "renice -n 0 -p 880", "sudo renice -n -5 -p 880"],
    "insight",
    "Start big batch jobs with nice -n 19. Users of the same host will not notice them."),
  L("jobs.html", "Foreground and background jobs",
    "A trailing & runs a command in the background. jobs lists them. fg brings one back, and bg resumes a stopped one in the background.",
    [
      "sleep 300 & prints a job number in brackets and a pid. jobs lists the shell's jobs. kill %1 signals job 1. fg %2 makes job 2 the foreground command again.",
      "On a real terminal, Ctrl+Z stops the foreground command and returns the prompt. bg lets it keep running in the background. Jobs belong to this shell and die when it closes, unless you use nohup, disown, screen, or tmux."
    ],
    "A background job still writes to your terminal. Redirect its output to a file, or it will print in the middle of what you are typing.",
    "jobs",
    ["sleep 300 &", "sleep 600 &", "jobs", "kill %1", "jobs -l", "fg %2", "jobs"],
    "insight",
    "Ctrl+Z then bg is the rescue when you started something long without &."),
  L("screen.html", "Keep a session with screen",
    "screen runs a shell that survives when you disconnect. You detach, log out, come back later, and reattach.",
    [
      "screen -S work starts a named session. Ctrl+A then d detaches. screen -ls lists sessions. screen -r work reattaches. Exit the shell inside, or use screen -X -S work quit, to end it.",
      "screen -dmS build starts a session already detached, which is handy in a script. If the SSH connection drops, the session keeps running and screen -r finds it again."
    ],
    "This lab lists and names sessions but has no full-screen view, so attaching prints what would happen.",
    "screen",
    ["screen -ls", "screen -S work", "screen -ls", "screen -dmS build", "screen -ls", "screen -r work", "screen -X -S build quit", "screen -ls"],
    "analogy",
    "screen is a room you can leave with the lights on. SSH is only the hallway.",
    "",
    { headers: ["Keys", "Action"], rows: [["Ctrl+A d", "detach"], ["Ctrl+A c", "new window"], ["Ctrl+A n / p", "next or previous window"], ["Ctrl+A \"", "list windows"], ["Ctrl+A S then Tab", "split and move between regions"], ["Ctrl+A H", "start or stop a log file"]] }),
  L("tmux.html", "tmux sessions",
    "tmux does what screen does, with windows and panes built in. The prefix key is Ctrl+B.",
    [
      "tmux new -s work starts a session. Ctrl+B then d detaches. tmux ls lists sessions. tmux attach -t work reattaches. tmux kill-session -t work ends one.",
      "tmux new -d -s logs starts detached. A session holds windows, like browser tabs. A window holds panes, which split the screen."
    ],
    "Start long jobs inside tmux by habit. A dropped VPN then costs you a reconnect, not a restart.",
    "tmux",
    ["tmux ls", "tmux new -s work", "tmux new -d -s logs", "tmux ls", "tmux attach -t work", "tmux kill-session -t logs", "tmux ls"],
    "insight",
    "Name every session after its job. tmux attach -t backup is easier to remember than session 3."),
  L("tmux-windows.html", "tmux windows",
    "A window is a full screen inside a session. Each window has its own shell and its own number in the status bar.",
    [
      "Ctrl+B c creates a window. Ctrl+B n and p move to the next and previous. Ctrl+B 0 to 9 jumps by number. Ctrl+B w shows a list to pick from.",
      "Ctrl+B , renames the current window, so the status bar says logs or build instead of bash. Ctrl+B & closes a window after asking."
    ],
    "Use one session per project and one window per task in it: editor, logs, and a spare shell.",
    "tmuxwin",
    ["tmux new -d -s work", "tmux new-window -t work", "tmux new-window -t work", "tmux ls"],
    "insight",
    "If the status bar shows 0:bash 1:bash 2:bash, rename them. You will thank yourself at 3 a.m.",
    "",
    { headers: ["Keys", "Action"], rows: [["Ctrl+B c", "new window"], ["Ctrl+B n / p", "next or previous"], ["Ctrl+B 0..9", "go to window number"], ["Ctrl+B w", "choose from a list"], ["Ctrl+B ,", "rename window"], ["Ctrl+B &", "close window"]] }),
  L("tmux-panes.html", "tmux panes",
    "Panes split one window. You can watch a log in one pane while you work in another.",
    [
      "Ctrl+B % splits left and right. Ctrl+B \" splits top and bottom. Ctrl+B and an arrow key moves between panes. Ctrl+B z zooms one pane to full size and back.",
      "Ctrl+B x closes a pane. Holding Ctrl+B and pressing an arrow repeatedly resizes. Ctrl+B space cycles through preset layouts."
    ],
    "Panes in one window share a size. When a pane is too small to read, zoom it with Ctrl+B z instead of closing the others.",
    "tmuxpanes",
    ["tmux new -d -s work", "tmux split-window -h -t work", "tmux split-window -v -t work", "tmux ls"],
    "insight",
    "A common layout: a big pane for the editor, and a thin bottom pane running tail -f on the log.",
    "",
    { headers: ["Keys", "Action"], rows: [["Ctrl+B %", "split left and right"], ["Ctrl+B \"", "split top and bottom"], ["Ctrl+B arrow", "move to a pane"], ["Ctrl+B z", "zoom or unzoom"], ["Ctrl+B x", "close pane"], ["Ctrl+B space", "next layout"]] }),
  L("tmux-conf.html", "Customize tmux with .tmux.conf",
    "tmux reads ~/.tmux.conf when the server starts. tmux source-file reloads it in a running session.",
    [
      "Common changes: a prefix of Ctrl+A instead of Ctrl+B, mouse support, window numbers that start at 1, and a longer scrollback history.",
      "After you edit the file, run tmux source-file ~/.tmux.conf, or bind a key to do it. A setting with -g is global and applies to every session."
    ],
    "Keep the file short and commented. Copying a 300-line config from the internet is how you lose track of which key does what.",
    "tmuxconf",
    ["printf 'set -g mouse on\\nset -g base-index 1\\nset -g history-limit 10000\\n' > ~/.tmux.conf", "cat ~/.tmux.conf", "tmux new -d -s work", "tmux source-file ~/.tmux.conf"],
    "insight",
    "Add the reload binding first. Every later change is then one key press away from being tested.",
    "",
    null,
    "# ~/.tmux.conf\nunbind C-b\nset -g prefix C-a          # Ctrl+A, like screen\nbind C-a send-prefix\nset -g mouse on            # click panes, drag borders, scroll\nset -g base-index 1        # windows start at 1\nsetw -g pane-base-index 1\nset -g history-limit 10000\nbind | split-window -h     # easier split keys\nbind - split-window -v\nbind r source-file ~/.tmux.conf \\; display \"reloaded\""),
  L("tmux-share.html", "Share a tmux session",
    "Two people can attach to the same tmux session and see the same screen. That is pair debugging over SSH.",
    [
      "As the same user, a second login simply runs tmux attach -t pair. Both terminals show and type into the same shell. Add -r for a read-only viewer.",
      "For two different users, start tmux with a shared socket: tmux -S /tmp/pair new -s pair. Then chgrp the socket to a shared group and chmod g+rw. The other user runs tmux -S /tmp/pair attach."
    ],
    "Whoever attaches can type as you, with your permissions. Share only with people you would hand your keyboard to.",
    "tmuxshare",
    ["tmux new -d -s pair", "tmux ls", "tmux attach -t pair"],
    "caution",
    "Delete the socket when the session ends. A leftover group-writable socket is an open door into your shell.",
    "",
    null,
    "# ana starts a shared session\ntmux -S /tmp/pair new -d -s pair\nchgrp staff /tmp/pair\nchmod g+rw /tmp/pair\n\n# mina, also in staff, joins\ntmux -S /tmp/pair attach -t pair\n\n# a read-only guest\ntmux -S /tmp/pair attach -t pair -r"),
];

var shellSetupFront = [
  L("env.html", "Environment variables",
    "A shell variable lives in this shell only. An exported variable, an environment variable, is copied into every program the shell starts.",
    [
      "greeting=hi sets a shell variable. A child, such as bash -c, does not see it. export greeting puts it in the environment, and the child prints hi. env and printenv list the environment.",
      "VAR=value cmd sets a variable for one command only. TZ=Asia/Tokyo date is the classic: one date in Tokyo time, and your shell is unchanged."
    ],
    "A child cannot change its parent's environment. A script that exports PATH changes the PATH of the script, not of the shell that ran it. source runs a file in this shell instead.",
    "env",
    ["printenv HOME", "greeting=hi", "bash -c 'echo [$greeting]'", "export greeting", "bash -c 'echo [$greeting]'", "env | grep -c =", "TZ=Asia/Tokyo date", "date"],
    "mistake",
    "Running ./setenv.sh and wondering why nothing changed. Use source setenv.sh, or . setenv.sh."),
  L("login-shell.html", "Login and non-login shells",
    "A login shell reads /etc/profile and then ~/.profile or ~/.bash_profile. An interactive non-login shell reads ~/.bashrc. Knowing which ran explains missing settings.",
    [
      "SSH and the text console start a login shell. A new terminal tab on a desktop usually starts a non-login shell. A script runs a non-interactive shell, which reads neither, unless BASH_ENV says otherwise.",
      "Most ~/.profile files source ~/.bashrc, so both kinds end up the same. shopt login_shell reports which kind you are in."
    ],
    "Put aliases, functions, and the prompt in ~/.bashrc. Put PATH and other exported variables in ~/.profile. Keep the line that loads .bashrc from .profile.",
    "loginshell",
    ["shopt login_shell", "ls -a ~", "cat ~/.profile", "cat /etc/profile"],
    "insight",
    "If an alias works in a desktop terminal but not over SSH, the login path is not reading ~/.bashrc. Check ~/.bash_profile, which wins over ~/.profile when both exist.",
    "",
    { headers: ["Shell", "Example", "Reads"], rows: [["login", "ssh host, console login, bash -l", "/etc/profile, then the first of ~/.bash_profile, ~/.bash_login, ~/.profile"], ["interactive non-login", "new terminal tab, typing bash", "/etc/bash.bashrc, ~/.bashrc"], ["non-interactive", "bash script.sh, cron", "only $BASH_ENV if set"]] }),
  L("path-setup.html", "Put your own folder on PATH",
    "To run your own scripts by name, put them in ~/bin, make them executable, and add ~/bin to PATH in your startup file.",
    [
      "A script runs by path, such as ~/bin/hello, once it has the execute bit. Without chmod +x the shell says Permission denied. By name alone, hello is found only when its folder is on PATH.",
      "export PATH=\"$HOME/bin:$PATH\" adds the folder in front, so your version wins over the system one. Append that line to ~/.bashrc or ~/.profile, then source the file to use it right away."
    ],
    "Put your folder first to override a system tool on purpose. Put it last if you only want to add new names.",
    "pathsetup",
    ["mkdir -p ~/bin", "printf '#!/bin/bash\\necho hello from my tool\\n' > ~/bin/hello", "hello", "~/bin/hello", "chmod +x ~/bin/hello", "~/bin/hello", "export PATH=\"$HOME/bin:$PATH\"", "hello", "echo 'export PATH=\"$HOME/bin:$PATH\"' >> ~/.bashrc", "tail -n 1 ~/.bashrc"],
    "mistake",
    "Writing PATH=~/bin without $PATH. Every other command disappears until you fix it or open a new shell."),
];

var afterReadline = [
  L("history.html", "Command history",
    "Bash remembers what you typed. history lists it, and ! expands earlier commands so you can run them again.",
    [
      "!! is the last command, so sudo !! reruns it with sudo. !$ is the last word of the last command. !42 runs entry 42. !cat runs the latest command that started with cat.",
      "Ctrl+R on a real terminal searches backwards as you type. Press it again for an older match, Enter to run, or an arrow key to edit first. The Up arrow walks back one entry at a time."
    ],
    "Bash prints the expanded line before running it, so you can see what !! became.",
    "history",
    ["echo one", "echo two", "history", "!!", "!1", "ls notes.txt", "wc -l !$", "!ec"],
    "insight",
    "sudo !! is the one to remember. It saves retyping a long command that failed with Permission denied."),
  L("history-more.html", "Tune and clean history",
    "A few variables control what history keeps: how many lines, which lines, and whether each line has a time.",
    [
      "HISTSIZE is how many lines the shell keeps in memory. HISTFILESIZE is how many stay in ~/.bash_history. HISTCONTROL=ignoreboth skips lines that start with a space and repeats of the previous line.",
      "HISTTIMEFORMAT='%F %T ' adds a date and time to each entry. history -d N deletes one entry, and history -c clears the list. history -w writes the list to ~/.bash_history now, instead of at exit."
    ],
    "With ignorespace on, start a line with a space to keep it out of history. Use that for a command that has a token or password in it, then rotate that secret anyway.",
    "history",
    ["HISTCONTROL=ignoreboth", "echo a", "echo a", " echo secret-token", "HISTTIMEFORMAT='%F %T '", "history", "history -d 1", "history 3"],
    "insight",
    "Put HISTSIZE=10000, HISTCONTROL=ignoreboth, and shopt -s histappend in ~/.bashrc. Then two terminals do not overwrite each other's history.",
    "",
    null,
    "# ~/.bashrc\nHISTSIZE=10000\nHISTFILESIZE=20000\nHISTCONTROL=ignoreboth\nHISTTIMEFORMAT='%F %T '\nshopt -s histappend"),
];

var glossary = [
  ["terminal emulator", "The window program that draws text and passes keys to the shell.", "terminal.html"],
  ["file descriptor", "A numbered stream. 0 is input, 1 is output, 2 is errors.", "redirect.html"],
  ["inode", "The record that holds a file's data location, owner, mode, and times. Names point at it.", "hardlink.html"],
  ["hard link", "A second name for the same inode. The data stays until the last name is removed.", "hardlink.html"],
  ["mtime and ctime", "mtime is when contents changed. ctime is when contents or metadata changed.", "stat.html"],
  ["uid 0", "The root user. The kernel skips permission checks for it.", "root.html"],
  ["sudoers", "The rules that say who may run what with sudo. Edit with visudo.", "sudo.html"],
  ["supplementary group", "An extra group a user belongs to, listed in /etc/group.", "group-accounts.html"],
  ["setuid", "A file bit that runs a program as its owner, shown as s in the owner part.", "setuid.html"],
  ["sticky bit", "A folder bit that lets only a file's owner delete it, shown as t.", "setgid-sticky.html"],
  ["ACL", "Extra permission entries for named users or groups, shown as + after the mode.", "acl.html"],
  ["immutable", "A chattr attribute. Nobody, not even root, can change the file until it is removed.", "attributes.html"],
  ["niceness", "A process priority from -20 to 19. Higher means it yields more.", "nice.html"],
  ["job", "A command this shell started, numbered %1, %2, and so on.", "jobs.html"],
  ["tmux", "A terminal multiplexer: sessions that survive disconnects, with windows and panes.", "tmux.html"],
  ["environment variable", "A variable copied into child programs, made with export.", "env.html"],
  ["login shell", "The shell started at login. It reads /etc/profile and ~/.profile.", "login-shell.html"]
];

module.exports = {
  afterShell: afterShell,
  afterMan: afterMan,
  afterCat: afterCat,
  afterTouch: afterTouch,
  afterMkdir: afterMkdir,
  afterLinks: afterLinks,
  afterFind: afterFind,
  afterRegex: afterRegex,
  afterSort: afterSort,
  afterAwk: afterAwk,
  afterSed: afterSed,
  archiveFront: archiveFront,
  afterTar: afterTar,
  afterUnzip: afterUnzip,
  usersTopic: usersTopic,
  afterOwnership: afterOwnership,
  afterChgrp: afterChgrp,
  afterTop: afterTop,
  afterKill: afterKill,
  shellSetupFront: shellSetupFront,
  afterReadline: afterReadline,
  glossary: glossary,
  L: L,
  W: W
};

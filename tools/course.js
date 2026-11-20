function L(file, title, point, idea, more, diagram, run, kind, call, script, table, sample) {
  return { file: file, title: title, point: point, idea: idea, more: more, diagram: diagram, run: run, kind: kind, call: call, script: script || "", table: table || null, sample: sample || "" };
}

var topics = [
  {
    id: "start", title: "Start",
    lessons: [
      L("index.html", "Home",
        "This course teaches the Bash you type on a Linux host, one idea at a time, with a picture and a practice terminal on every page.",
        [
          "You are ana on a host named lab. Your practice folder is ~/work. The same files come back on every page: notes.txt, app.log, names.txt, sizes.txt, and reports/monday.txt.",
          "A short command list shows one example and moves on. This course stays on the idea long enough to show the mistake that breaks a real host: a quote left off, a pipe that hides an error, a PATH that no longer contains your commands, or chown run when you are not root."
        ],
        "The practice terminal is a computer drawn in the page. It is not your PC. Reset lab puts the practice files back. Nothing you type here can change the machine you are reading on.",
        "path",
        ["pwd", "ls"],
        "insight",
        "Read the page, look at the picture, then type the example in the practice terminal. The next lesson is one click at the bottom."),
      L("what-the-shell-is.html", "What the shell is",
        "The shell is the program that reads the line you type and asks the kernel to run it.",
        [
          "Bash is a shell. You type a line. Bash splits that line into a command and its arguments, finds the program, and starts it. The kernel is the part of Linux that actually talks to the disk, the memory, and the network.",
          "The prompt ana@lab:~/work$ is Bash waiting. ana is the user, lab is the host, and ~/work is the folder you are standing in. The dollar sign means this shell is ready for a command."
        ],
        "A terminal window is only the screen. Bash is the program inside it. If you open a second window, you have a second Bash, with its own current folder.",
        "shell",
        ["whoami", "hostname", "echo $SHELL"],
        "analogy",
        "The shell is a clerk at a window. You hand over a slip of paper. The clerk does not do the heavy work. The clerk sends the request to the right desk."),
      L("open-a-shell.html", "Open a shell on a host",
        "On your own computer you open a terminal. On a host you already use, you arrive through SSH and land in a shell.",
        [
          "A host is a Linux machine you log into, often one you do not sit in front of. SSH is the command that opens an encrypted session there. After the login, you see a prompt, and that prompt is Bash on the host, not Bash on your laptop.",
          "This lab is already on lab, so ssh ana@other does not leave the page. On a real network that command would switch your prompt to the other machine. The files in ~/work would be the files on that machine."
        ],
        "Before you type a command that changes files, read the prompt. The host name tells you which machine will obey.",
        "places",
        ["hostname", "whoami", "ssh ana@other"],
        "mistake",
        "Running a cleanup command on the wrong host. The prompt is the label on the door. Read it."),
      L("command-line.html", "How a command line splits",
        "Bash splits your line into a command, then options, then arguments, and only then runs it.",
        [
          "The first word is the command. Words that start with a dash are options: they change how the command behaves. The remaining words are arguments, usually files or text.",
          "grep -n ERROR app.log has four words. grep is the command, -n is the option that adds line numbers, ERROR is the pattern, and app.log is the file."
        ],
        "Spaces split words. If a file name has a space, wrap it in quotes, or Bash thinks you named two files.",
        "split",
        ["grep -n ERROR app.log"],
        "insight",
        "When a command surprises you, point at each word and say what job it has. Most mistakes are a word in the wrong job."),
      L("pipes.html", "Pipes and redirection",
        "A pipe sends one command's output into the next command, and redirection sends that stream into a file.",
        [
          "Every command has three streams. Standard input is what it reads. Standard output is the normal result. Standard error is the complaint, kept separate so a success message and a failure do not get mixed.",
          "The vertical bar | connects output to the next input. grep ERROR app.log | wc -l searches the log, then counts the matching lines. The count is 1."
        ],
        "The symbol > writes output to a file and replaces what was there. >> adds to the end. 2> catches only the error stream. tee does both: it saves a copy and also passes the text along.",
        "pipes",
        ["grep ERROR app.log | wc -l", "grep WARN app.log | tee hits.txt", "cat hits.txt"],
        "mistake",
        "Using > when you meant >>. A single > erases the file first, then writes. On a log you wanted to keep, that is the whole file gone."),
      L("man.html", "Read a manual page",
        "man prints the built-in instructions for a command: what it does, and which options it accepts.",
        [
          "You will not remember every flag. man ls opens the page for ls. The synopsis line shows the shape of the command. The description says what each option means.",
          "This lab stores a short page for the commands it teaches. A real host stores the long page and you press q to leave it. --help is the shorter cousin when man is not installed."
        ],
        "Read the synopsis before you invent a flag. A flag that is not on the page is a different command's flag, or a typo.",
        "man",
        ["man grep"],
        "insight",
        "When you are stuck, man and the command's name are the first place to look, before searching the web for a one-line recipe.")
    ]
  },
  {
    id: "files", title: "Files",
    lessons: [
      L("pwd.html", "Print the working directory",
        "pwd prints the folder you are standing in, as a path that starts at the root.",
        [
          "Linux has one tree. The root is /. There are no drive letters. Your home folder is /home/ana, and the practice files live in /home/ana/work.",
          "pwd means print working directory. The working directory is the folder a relative name is judged from. notes.txt means the notes.txt in this folder, not some other notes.txt."
        ],
        "An absolute path starts with /. A relative path does not. ~/work is short for /home/ana/work because ~ means your home.",
        "pwd",
        ["pwd"],
        "analogy",
        "pwd is looking at your shoes and reading the street sign. It does not move you. It tells you where you already are."),
      L("cd.html", "Change directory",
        "cd moves you to another folder. After it, pwd prints the new place.",
        [
          "cd reports steps into the reports folder. cd .. steps up to the parent. cd with no argument goes home. cd - returns to the folder you just left.",
          "The prompt changes with you. ana@lab:~/work/reports$ means relative names now refer to files inside reports."
        ],
        "cd only changes this shell. A second terminal window is still standing where it was.",
        "cd",
        ["cd reports", "pwd", "cd -", "pwd"],
        "mistake",
        "Assuming a command in another window sees the cd you just typed. Each shell has its own current folder."),
      L("ls.html", "List names",
        "ls prints the names in a folder. ls -l adds the permission bits, the owner, and the size.",
        [
          "With no arguments, ls lists the current folder. Names that start with a dot are hidden until you add -a. .bashrc in your home is one of those hidden names.",
          "ls -l is a table in text. The first column is the type and the permissions. A dash means a file. A d means a directory. Then come the owner, the group, the size in bytes, the date, and the name."
        ],
        "ls -a shows . and .. as well. . is this folder. .. is the parent. They are not files you created.",
        "ls",
        ["ls", "ls -l notes.txt"],
        "insight",
        "When a script cannot read a file, ls -l is the first picture to ask for. The bits and the owner are on that row."),
      L("globs.html", "Match names with a glob",
        "A glob is a pattern the shell expands into file names before the command ever runs.",
        [
          "The star * means any text in a file name. echo *.txt becomes the names that end in .txt. The question mark ? means one character.",
          "This happens in the shell, before echo or find starts. That is why find . -name '*.txt' needs quotes. The quotes hand the star to find. Without quotes, Bash replaces the star first, and find receives a finished list of names."
        ],
        "A glob that matches nothing is left as the literal text. echo '*.txt' always prints the star, because single quotes block the expansion.",
        "globs",
        ["echo *.txt", "echo '*.txt'"],
        "mistake",
        "Leaving *.txt unquoted for a command that wanted the pattern itself. The shell eats the star and the command never sees it."),
      L("echo.html", "Print text",
        "echo writes its arguments to standard output, with a newline at the end.",
        [
          "echo is how a script talks. echo hello prints hello. The words after echo are joined by spaces.",
          "echo -n skips the newline. That matters when you are building one line out of several echoes, and when a test compares the exact bytes."
        ],
        "echo does not read a file. cat does that. echo only repeats what you typed, after the shell expands any $ variables.",
        "echo",
        ["echo hello from lab", "echo -n hi", "echo there"],
        "insight",
        "If you are not sure what the shell will expand, echo the same words first. You see the text the next command would have received."),
      L("cat.html", "Print a file",
        "cat reads a file and writes every byte to the screen.",
        [
          "cat notes.txt prints the lab notes. cat app.log prints the whole log. If you name two files, cat prints the first, then the second, as one stream.",
          "On a long file, cat floods the terminal. head and tail show an end of the file instead. less would let you scroll, and this lab does not include it, so use head or tail here."
        ],
        "cat with no file name waits for you to type, and this lab refuses that wait. Pass a file, or pipe text in.",
        "cat",
        ["cat notes.txt"],
        "mistake",
        "Using cat on a huge log and then hunting with your eyes. grep the pattern, or tail the last lines."),
      L("cp.html", "Copy a file",
        "cp copies bytes to a new name and leaves the original where it was.",
        [
          "cp notes.txt notes.bak creates notes.bak with the same text. notes.txt is still there. If the destination is a folder, the copy lands inside it, keeping its file name.",
          "cp -r copies a directory and what is inside it. Without -r, cp refuses a directory, because a directory is a list of names, not one blob of text."
        ],
        "A copy is a second file. Editing the copy does not edit the original. A symbolic link, on the links page, is the other idea: a second name for the same file.",
        "cp",
        ["cp notes.txt notes.bak", "ls"],
        "insight",
        "Copy first when you are about to edit a config on a host. The .bak name is the way back."),
      L("mv.html", "Move or rename",
        "mv changes a name, or moves a file into another folder. There is still one file.",
        [
          "mv notes.bak backup.txt renames the copy. The bytes do not get duplicated. The directory entry changes.",
          "mv backup.txt reports/ moves that file into reports. If the destination name already exists, mv replaces it."
        ],
        "mv across two disks really does copy and then delete. On one disk it is only a rename. Either way, the old path is gone.",
        "mv",
        ["cp notes.txt notes.bak", "mv notes.bak backup.txt", "ls"],
        "mistake",
        "Using mv when you wanted a copy. After mv, the old name is not there to fall back on."),
      L("rm.html", "Remove a name",
        "rm deletes a name. It does not move the file to a trash folder.",
        [
          "rm backup.txt removes that file from the practice folder. There is no undo in Bash. The lab will refuse to delete /, /home, or ana's home, and it will say so.",
          "rm on a directory fails until you add -r, because a directory holds other names. -f means do not ask. Together, rm -rf is how people wipe a tree they did not mean to name."
        ],
        "On a real host, rm -rf of the wrong path deletes real data. Type the path, read it once, then press Enter. The lab's refusal is a guard rail this page cannot put on your real shell.",
        "rm",
        ["cp notes.txt backup.txt", "rm backup.txt", "ls", "rm -rf /"],
        "caution",
        "There is no trash. If the name mattered, cp it somewhere else before rm."),
      L("touch.html", "Create an empty file",
        "touch creates a file if the name is missing, and otherwise updates its timestamp.",
        [
          "touch draft.txt creates an empty draft. Scripts use that to mark that a step has run: the file's existence is the mark.",
          "The parent folder must already exist. touch does not create reports/new/draft.txt if reports/new is missing. mkdir -p does that job."
        ],
        "touch is not an editor. The file is empty until something writes into it.",
        "touch",
        ["touch draft.txt", "ls -l draft.txt"],
        "insight",
        "An empty file is a valid file. cat prints nothing, and the size on ls -l is 0."),
      L("mkdir.html", "Make a directory",
        "mkdir creates a folder. -p creates any missing parents and does not complain if the folder is already there.",
        [
          "mkdir extra creates one folder in the current directory. mkdir -p extra/deep/logs creates the whole chain.",
          "Without -p, mkdir extra/deep fails when extra does not exist yet. Scripts that set up a folder use -p so running them twice is safe."
        ],
        "A folder you cannot write to will reject mkdir. ls -ld on the parent shows whether your user has write permission there.",
        "mkdir",
        ["mkdir -p extra/deep", "ls extra"],
        "insight",
        "Prefer mkdir -p in a script. The second run should not be an error."),
      L("links.html", "Names that point at a file",
        "A symbolic link is a name that stores another path. Opening the link opens that other file.",
        [
          "ln -s notes.txt notes-link creates notes-link. ls -l shows notes-link -> notes.txt. cat notes-link prints the notes, because the read follows the arrow.",
          "If you delete notes.txt, the link remains and the arrow points at nothing. cat then fails. The link did not keep a copy of the bytes. cp would have."
        ],
        "A hard link is a second directory entry for the same bytes, and only on the same disk. This lab makes symbolic links, which are the ones you meet in /usr/bin and in config folders.",
        "link",
        ["ln -s notes.txt notes-link", "ls -l notes-link", "cat notes-link"],
        "analogy",
        "A symbolic link is a forwarding address. The house is the original file. Mail sent to the forwarding address arrives at the house, until the house is gone."),
      L("find.html", "Find files by name",
        "find walks a folder and prints every path that matches a test you give it.",
        [
          "find . -name '*.txt' starts here and prints text files, including reports/monday.txt. The quotes are required so Bash does not expand the star before find sees it.",
          "-type f means a regular file. -type d means a directory. You can combine them: a name test and a type test both have to match."
        ],
        "find prints paths. It does not search inside the file. grep searches inside. A common pair is find to choose files, then grep to read them.",
        "find",
        ["find . -name '*.txt'"],
        "mistake",
        "Writing find . -name *.txt without quotes. The shell expands the star in the current folder, and find never receives the pattern."),
      L("alias.html", "Abbreviate a command",
        "An alias is a short name that expands into a longer command before Bash runs it.",
        [
          "alias ll='ls -alF' makes ll mean that longer ls. You type ll. Bash substitutes the right-hand side, then runs it.",
          "An alias lives in this shell until you reset the lab or close the terminal. On a real host you put the alias line in ~/.bashrc so a new shell loads it. This lab's home already has one saved alias in that file."
        ],
        "Aliases do not expand inside scripts the way you might hope. In a script, type the real command. Keep aliases for your own typing.",
        "alias",
        ["alias ll='ls -alF'", "ll", "cat ~/.bashrc"],
        "insight",
        "If a short name surprises you, run type ll. It tells you whether the name is an alias, a function, or a program on PATH.")
    ]
  },
  {
    id: "text", title: "Text",
    lessons: [
      L("head.html", "See the start of a file",
        "head prints the first lines of a file. The default is 10. -n chooses a different count.",
        [
          "head -n 2 app.log prints the two startup lines and stops. That is enough to see whether the app started, without the later warning and error.",
          "head reads from a pipe as well. grep INFO app.log | head -n 1 keeps only the first matching line."
        ],
        "head -n 2 does not change the file. It only chooses what to print.",
        "head",
        ["head -n 2 app.log"],
        "insight",
        "Use head when you want the beginning: a header, a startup line, or a peek before you spend time on the rest."),
      L("tail.html", "See the end of a file",
        "tail prints the last lines. Logs grow at the end, so the failure you care about is usually there.",
        [
          "tail -n 1 app.log prints the retry line, the newest event in this log. tail -n 3 would include the warning, the error, and the retry.",
          "On a real host, tail -f keeps printing new lines as a process writes them, until you press Ctrl+C. This lab prints one snapshot, because the log file is not growing while you read."
        ],
        "head and tail are the two ends of the same file. Neither one searches. If you know the word, use grep.",
        "tail",
        ["tail -n 3 app.log"],
        "analogy",
        "tail is reading the last page of a notebook. The newest sentence is at the bottom."),
      L("grep.html", "Search lines",
        "grep prints the lines that contain a pattern, and hides the rest.",
        [
          "grep ERROR app.log prints the one line where the config read failed. The pattern is plain text in this lab. A real grep can also use a regular expression; add -E when you mean that.",
          "-n adds the line number. -i ignores uppercase and lowercase. -c prints a count instead of the lines. -v prints the lines that do not match. -q prints nothing and only succeeds or fails, which a script can test."
        ],
        "Quote a pattern that contains spaces or stars. grep 'disk 80' app.log looks for those two words. Without quotes, Bash splits them.",
        "grep",
        ["grep -n ERROR app.log", "grep -c INFO app.log"],
        "mistake",
        "Forgetting -i and deciding the word is absent because the log wrote Error instead of ERROR."),
      L("cut.html", "Cut columns",
        "cut keeps chosen columns from each line and throws the other columns away.",
        [
          "A column is a field between separators. cut -d ' ' -f2 app.log uses a space as the separator and keeps field 2, the level word: INFO, WARN, or ERROR.",
          "Fields are numbered from 1. -f1,3 keeps the first and the third. -f2- keeps from the second field through the end of the line."
        ],
        "cut does not understand quotes or repeated spaces the way a spreadsheet does. If the columns wobble, awk is the clearer tool.",
        "cut",
        ["cut -d' ' -f2 app.log"],
        "insight",
        "Pick cut when the separator is one obvious character and you want one column. Pick awk when the line is more irregular."),
      L("sort.html", "Sort lines",
        "sort orders lines as text unless you ask for numbers. Those two orders are not the same.",
        [
          "sort names.txt orders ana, ana, ken, mina. sort sizes.txt orders the digits as text, so 1, then 10, then 2, because the character 1 comes before the character 2.",
          "sort -n sizes.txt orders them as numbers: 1, 2, 10. uniq removes repeated neighbors, so sort names.txt | uniq collapses the two ana lines."
        ],
        "uniq only collapses lines that are already next to each other. Sort first, or the second ana stays.",
        "sort",
        ["sort sizes.txt", "sort -n sizes.txt", "sort names.txt | uniq"],
        "mistake",
        "Sorting sizes with the default and believing 10 is between 1 and 2. Text order and number order diverge as soon as you have two digits."),
      L("awk.html", "Pick fields from a line",
        "awk splits each line into fields and lets you print the ones you name.",
        [
          "In awk, $1 is the first field, $2 the second, and $0 is the whole line. awk '{print $2}' app.log prints the level of every event.",
          "A pattern in slashes filters first. awk '/ERROR/ {print $1, $2}' app.log prints only the failing line's time and the word ERROR. -F sets the separator when it is not whitespace, for example -F: on /etc/passwd."
        ],
        "The dollar signs here belong to awk, not to Bash. Keep the program in single quotes so Bash does not try to expand $2 as a shell variable.",
        "awk",
        ["awk '{print $2}' app.log", "awk '/ERROR/ {print $1, $2}' app.log"],
        "mistake",
        "Writing the awk program in double quotes. Bash replaces $2 with nothing, and awk prints blank fields."),
      L("sed.html", "Edit a stream",
        "sed reads each line, applies an edit, and writes the line out. The file on disk stays as it was.",
        [
          "sed 's/ERROR/FAIL/' app.log replaces the first ERROR on each line with FAIL and prints the result. The s means substitute. A trailing g would replace every match on the line, not only the first.",
          "sed -n '4p' is a different job: print only line 4. sed -n '/ERROR/p' prints only matching lines, which is close to grep, with room to edit the line in the same pass."
        ],
        "This prints a new stream. It does not save it. To keep the edit, redirect: sed 's/ERROR/FAIL/' app.log > edited.log. Do not redirect onto the same file you are reading. The shell empties that file before sed starts.",
        "sed",
        ["sed 's/ERROR/FAIL/' app.log"],
        "caution",
        "sed 's/old/new/' file > file destroys the file. Write to a new name, then mv it into place if you must replace the original.")
    ]
  },
  {
    id: "host", title: "Host",
    lessons: [
      L("ps.html", "List processes",
        "ps prints the processes on the host: who owns them, their id, and the command.",
        [
          "A process is a running program. It has a numeric id, the pid. On this picture of lab, pid 1 is systemd, 412 is sshd, 880 is the app, and 901 is bash.",
          "ps aux is the wide listing. USER, PID, CPU, memory, and COMMAND are the columns you read first. The lab's list is a fixed picture so the later lessons can point at the same pids."
        ],
        "The pid is what kill needs. The command column is how you tell pid 880, the app, from pid 901, your shell.",
        "ps",
        ["ps"],
        "insight",
        "Find the command column first, then read across to the pid. Killing a pid you identified from the wrong row is how shells get closed."),
      L("top.html", "Watch CPU and memory",
        "top is a live table of processes sorted by who is busy. This lab prints a single frame so you can read it.",
        [
          "A real top redraws every few seconds until you press q. The frame shows pid, user, CPU percent, memory percent, and the command.",
          "On this frame the app is the busy row, at 2.0 percent CPU. bash and sshd are idle. A stuck host often shows one command near the top of that list for a long time."
        ],
        "top is for watching. ps is for a snapshot you can paste into a note. Use ps when you need a pid to keep. Use top when you want to see who is using the machine right now.",
        "top",
        ["top"],
        "analogy",
        "top is a departure board that refreshes. The lab freezes one refresh so the lesson can talk about a single row."),
      L("df.html", "See disk space",
        "df reports whole filesystems: how big the disk is, how much is used, and where it is mounted.",
        [
          "df -h prints sizes in human units. On lab, / is 20G, 8.2G used, 11G free, 42 percent. That is the disk. It is not the size of ~/work.",
          "The practice files are a few hundred bytes. They do not explain 8.2G. When a host says the disk is full, df tells you which filesystem. du, next, tells you which folders inside it are large."
        ],
        "df without -h uses 1K blocks and is harder to read. -h is the form to keep.",
        "df",
        ["df -h"],
        "mistake",
        "Reading df and then deleting files in your home at random. df names the filesystem. You still have to find the directory that filled it.",
        "",
        { headers: ["Filesystem", "Size", "Used", "Free", "Use", "Mount"], rows: [["/dev/vda1", "20G", "8.2G", "11G", "42%", "/"]] }),
      L("du.html", "See which folder is large",
        "du adds up the bytes in a folder. df told you the disk is 42 percent full. du tells you where those bytes sit.",
        [
          "du -sh ~/work prints one total for the practice folder. The lab counts the bytes in the files, not disk blocks, so the number is small and honest.",
          "du -sh ~/* prints one line per name in your home directory's children that the glob matches. The biggest line is where you look next. On a real full disk, that walk often ends in /var/log."
        ],
        "A file deleted by a process that still has it open still occupies space. du will not show the name, and df will still show the space. That case needs the process, not another du.",
        "du",
        ["du -sh ~/work", "du -sh ~/work/*"],
        "insight",
        "df answers which disk. du answers which directory. You need both, in that order."),
      L("free.html", "See memory",
        "free prints how much memory the host has, how much is in use, and how much is free.",
        [
          "free -h on lab shows 3.8Gi total, 1.2Gi used, 2.1Gi free. Swap is 2.0Gi and unused. Swap is disk space used as emergency memory, and a host that is deep into swap is slow.",
          "Used memory is not automatically a problem. Linux uses spare memory for cache and can give it back. The number that means trouble is when free memory and available memory are both near zero and the app is being killed."
        ],
        "This lab's numbers are a picture, like df. They do not change when you start a command here.",
        "free",
        ["free -h"],
        "mistake",
        "Treating any used memory as a leak. Ask whether the host is out of memory, not whether the used column is above zero."),
      L("kill.html", "Signal a process",
        "kill sends a signal to a pid. The polite signal asks the process to exit. The forceful one does not ask.",
        [
          "kill 880 sends TERM, signal 15, to the app. A well-written process closes its files and exits. kill -9 880 sends KILL, which the process cannot catch. The operating system removes it.",
          "The lab tells you which signal it would send and leaves the ps picture in place, so you can still see the row. It refuses pid 1. Signaling systemd on a real host can take the machine down."
        ],
        "Use the pid from ps, not a pid you remember from yesterday. Pid numbers are reused after a process exits.",
        "kill",
        ["kill 880", "kill -9 880"],
        "caution",
        "Try TERM first. KILL skips cleanup. A database or a writer can leave a half-written file."),
      L("uptime.html", "See how long the host has been up",
        "uptime prints the clock, how long since boot, how many users, and three load numbers.",
        [
          "The lab's line says lab has been up 3 days and 4 hours, with one user. The load averages are the last 1, 5, and 15 minutes. They count work waiting to run, not a percentage.",
          "A load of 0.15 on a quiet lab is ordinary. A load that climbs and stays above the number of CPUs means work is waiting. uptime does not say which process. top does."
        ],
        "A short uptime means the host rebooted recently. If you did not reboot it, that fact belongs in the incident note before you change anything else.",
        "uptime",
        ["uptime"],
        "insight",
        "Read uptime before you restart a service. A reboot five minutes ago is a different problem from a host that has been up for a year.")
    ]
  },
  {
    id: "network", title: "Network",
    lessons: [
      L("ping.html", "Check that a host answers",
        "ping sends a small packet and waits for a reply. A reply means the name resolved and the host answered.",
        [
          "ping -c 3 lab sends three packets and stops. -c is the count. Without it, a real ping continues until you press Ctrl+C. This lab stops after three either way, and it says so.",
          "Zero percent packet loss means every packet came back. One hundred percent means none did. That can be a bad name, a firewall, or a host that is down. ping does not tell you which."
        ],
        "ping 192.0.2.10 is a documentation address this lab treats as unreachable, so you can see the failure line without touching a real network.",
        "ping",
        ["ping -c 3 lab", "ping -c 2 192.0.2.10"],
        "insight",
        "ping answers one question: did a basic reply come back? It does not prove that SSH, or your app on port 8080, is working."),
      L("curl.html", "Fetch a URL",
        "curl speaks HTTP from the shell. -I asks for headers only, which is enough to see the status code.",
        [
          "curl -I http://lab:8080 prints HTTP/1.1 200 OK. 200 means the app answered. Without -I, curl also prints the body, which in this lab is the text app started.",
          "A name this lab does not know fails with could not resolve host. On a real machine that means DNS failed, or the name is wrong. The lab never opens a socket. The replies are a picture of those two outcomes."
        ],
        "curl -I is the check you run before you blame the application code. If the status is 200, the process is listening. If the name does not resolve, you are not looking at the app yet.",
        "curl",
        ["curl -I http://lab:8080"],
        "mistake",
        "Debugging application code while curl cannot resolve the host name. Fix the name first."),
      L("wget.html", "Save a URL to a file",
        "wget downloads a URL and writes it to a file. curl prints. wget saves.",
        [
          "wget -O health.txt http://lab:8080 saves the body as health.txt in the current folder. -O chooses the name. Without -O, wget invents a name from the URL.",
          "The lab writes the practice body app started and does not contact the network. On a real host the same command stores whatever the server sent."
        ],
        "Check the saved file with cat or head before you trust it. A download can be an error page with a 200, or a short failure, and the file will still exist.",
        "wget",
        ["wget -O health.txt http://lab:8080", "cat health.txt"],
        "insight",
        "Use curl when you want to see the answer. Use wget when you want a file left behind."),
      L("ssh.html", "Open a shell on another host",
        "ssh user@host starts a shell on that host. Your prompt changes. The files you see are that host's files.",
        [
          "ssh ana@other would log in as ana on other. Authentication is a key or a password, decided by the server. This lab does not open a connection. It prints what the real command is for, and you stay ana@lab.",
          "The first time you connect to a host, SSH asks you to confirm its fingerprint. That check is how you know you reached the machine you meant. Accepting every fingerprint without reading it defeats the check."
        ],
        "When the session ends, you are back on the machine where you typed ssh. Commands after that run locally again.",
        "ssh",
        ["ssh ana@other"],
        "caution",
        "The prompt is the only reliable sign of which host will run the next command. After ssh, read it again."),
      L("scp.html", "Copy a file over SSH",
        "scp copies one file to or from another host, using the same login ssh uses.",
        [
          "scp notes.txt ana@other:work/ copies notes.txt to the work folder on other. The colon separates the host from the path. A path with no user@host is a local path.",
          "The lab records the pretend remote copy and prints the destination. It does not open the network. scp of a directory needs -r, the same idea as cp."
        ],
        "scp copies. It does not skip a file that is already the same. If you are synchronizing a tree, rsync is the tool that compares.",
        "scp",
        ["scp notes.txt ana@other:work/"],
        "insight",
        "Read the colon. Everything before it is the login. Everything after it is the path on that host."),
      L("rsync.html", "Sync a tree",
        "rsync copies what is missing or different, and leaves the rest. scp copies the file you name, every time.",
        [
          "rsync -av app.log ana@other:work/ sends app.log and, because of -v, prints the name. -a means keep the usual file attributes. -v means say what you did.",
          "For a directory, a trailing slash matters. rsync -av reports/ dest/ copies the contents of reports into dest. Without the trailing slash, it copies the reports folder itself into dest."
        ],
        "Add --dry-run, or -n, on a real host the first time. rsync prints what it would change and changes nothing. This lab does not need a dry run to stay safe, because the remote side is pretend.",
        "rsync",
        ["rsync -av app.log ana@other:work/"],
        "mistake",
        "Dropping the trailing slash and nesting a directory inside itself. Read the destination twice.")
    ]
  },
  {
    id: "archives", title: "Archives",
    lessons: [
      L("zip.html", "Pack files into a zip",
        "zip stores named files in one archive. The originals stay in place.",
        [
          "zip pack.zip notes.txt creates pack.zip containing notes.txt. zip -r pack.zip reports adds the files inside reports.",
          "The archive is a file like any other. ls shows it. cat is the wrong reader. unzip -l lists the names inside."
        ],
        "Zip is the format you hand to someone on another operating system. tar is the format you see on Linux hosts for logs and releases.",
        "zip",
        ["zip pack.zip notes.txt", "ls -l pack.zip"],
        "insight",
        "After you zip, the original file is still there. Zip is a copy into a package, not a move."),
      L("unzip.html", "List or extract a zip",
        "unzip -l lists an archive. unzip without -l writes the files back out.",
        [
          "unzip -l pack.zip prints each member and its size. That is the safe look. unzip pack.zip extracts into the current folder.",
          "Extracting overwrites a file of the same name. List first when you are not sure what is inside."
        ],
        "The lab's unzip understands the archives you created here with zip. It is not a general repair tool for a damaged download.",
        "unzip",
        ["zip pack.zip notes.txt", "unzip -l pack.zip"],
        "caution",
        "unzip in a folder that already has those names replaces them. List, then extract into an empty folder if you are unsure."),
      L("tar.html", "Pack files with tar",
        "tar stores files in one archive. The letters on the flag say whether you are creating, listing, or extracting.",
        [
          "tar -czf learn.tar.gz notes.txt creates learn.tar.gz. c creates, z asks for gzip compression, and f means the next word is the archive name. The file names come after that.",
          "tar -tzf learn.tar.gz lists the names. tar -xzf learn.tar.gz extracts them. t is list, x is extract. The f still names the archive, and it must be the option that takes the file name."
        ],
        "People remember the letters as a word: czf to create, tzf to list, xzf to extract. The order czf matters less than remembering that f eats the next argument.",
        "tar",
        ["tar -czf learn.tar.gz notes.txt", "tar -tzf learn.tar.gz"],
        "mistake",
        "Putting the archive name before -f, or forgetting -f and letting tar treat a file you meant to store as the archive. List with -tzf before you extract.")
    ]
  },
  {
    id: "permissions", title: "Permissions",
    lessons: [
      L("ownership.html", "Owner and group",
        "Every file has an owner and a group. The permission bits are applied in that order: owner, then group, then everyone else.",
        [
          "ls -l notes.txt shows ana ana before the size. The first ana is the owner. The second is the group. You are ana, and you are also in the group staff.",
          "id prints your ids. whoami prints the name. If the owner matches you, the owner bits decide. If not, and you are in the file's group, the group bits decide. Otherwise the other bits decide."
        ],
        "Changing the group does not change the owner. chgrp is the next-to-last page. chown, which changes the owner, is something root does, and the lab will refuse it for that reason.",
        "own",
        ["id", "ls -l notes.txt"],
        "insight",
        "Read ls -l from the left: type, nine permission bits, owner, group, size, name. The owner and the bits together answer whether you may read the file."),
      L("chmod.html", "Change permission bits",
        "chmod changes the nine bits: read, write, and execute for the owner, the group, and everyone else.",
        [
          "Each class is a digit. Read is 4, write is 2, execute is 1. Add the digits you want. 6 is read and write. 4 is read only. 644 means the owner can read and write, and everyone else can read.",
          "chmod 600 notes.txt leaves the owner able to read and write, and gives the group and the world nothing. chmod u+x adds execute for the owner only, which is how you make a script runnable as ./script."
        ],
        "777 means everyone can read, write, and execute. It makes a problem go away and leaves the file open to every account on the host. Do not use it because a command failed once.",
        "chmod",
        ["chmod 600 notes.txt", "ls -l notes.txt"],
        "mistake",
        "chmod 777 because of permission denied. Find out which bit is missing. Add that bit. 777 is not a diagnosis.",
        "",
        { headers: ["Mode", "Owner", "Group", "Others", "Typical use"], rows: [["644", "rw-", "r--", "r--", "A normal file"], ["755", "rwx", "r-x", "r-x", "A script or a directory you share"], ["600", "rw-", "---", "---", "A private file"]] }),
      L("chown.html", "Change the owner",
        "chown gives a file to another user. On a real host, only root may do that.",
        [
          "chown root notes.txt fails in this lab with Operation not permitted. You are ana. Ana can chmod her own files. She cannot hand a file to root, or take a file from root, unless she can become root.",
          "sudo would run a command as root on a real host, if sudoers allows it. This lab will not become root. The picture of a successful chown is something you ask root for, not something the practice prompt can fake as a success."
        ],
        "If ls -l shows an owner you do not expect, that is a clue about who created the file. Fixing it is a root action, or a copy into your own folder, which you do own.",
        "chown",
        ["chown root notes.txt"],
        "caution",
        "A tutorial that shows chown user file as an ordinary command is skipping the permission check. On the host, that command fails for the same reason it fails here."),
      L("chgrp.html", "Change the group",
        "chgrp changes the group column, if you own the file and you belong to the new group.",
        [
          "chgrp staff notes.txt works. You own the file, and staff is one of your groups. ls -l then shows ana staff.",
          "The middle three permission bits are the group's bits. After the group is staff, those bits apply to people in staff. Your own access still uses the owner bits, because you are the owner."
        ],
        "chgrp to a group you are not in fails. That is the same kind of refusal as chown, on a smaller scale.",
        "chgrp",
        ["chgrp staff notes.txt", "ls -l notes.txt"],
        "insight",
        "Use the group when several people share a folder. Give the group read or write, and leave the world with nothing.")
    ]
  },
  {
    id: "bash", title: "Bash",
    lessons: [
      L("syntax.html", "What a script line is",
        "A script is a file of the same lines you would type. Bash reads them from the top.",
        [
          "A line can be a command, an assignment, or a keyword such as if, for, or while. A hash at the start of a word is a comment. Bash skips it.",
          "The first line of a script is often #!/usr/bin/env bash. That is the shebang. The kernel uses it to choose Bash when you run the file. Inside the lab's script box, Bash is already the reader, and the shebang is documentation."
        ],
        "Blank lines and comments are for the next person, including you next month. They do not slow the script in any way you will notice.",
        "syntax",
        [],
        "insight",
        "If a line works at the prompt, it will work in the script box, with the same quoting rules.",
        "#!/usr/bin/env bash\n# Say where we are\npwd\nls"),
      L("script.html", "Run a script",
        "A script is a text file you ask Bash to read. set -euo pipefail makes it stop at the first real failure.",
        [
          "bash script.sh runs the file even when it is not marked executable. ./script.sh runs it as a program, and that form needs chmod u+x. The lab's script box is the first form: Bash reads the text.",
          "set -e stops the script when a command fails. set -u treats a misspelled variable as an error instead of an empty string. set -o pipefail makes a pipeline fail if any stage fails, not only the last one. Together they are written set -euo pipefail."
        ],
        "Without -e, a failed command prints an error and the script keeps going, often on bad data. The flags are how you refuse to continue.",
        "script",
        [],
        "insight",
        "Put set -euo pipefail on line 2, under the shebang, before any real work.",
        "#!/usr/bin/env bash\nset -euo pipefail\necho Hello from lab\ngrep -q ERROR app.log\necho found-the-error"),
      L("variables.html", "Store a value",
        "A variable is a name that holds text. You assign with name=value and you read it with $name.",
        [
          "host=lab stores the four characters. There is no space around the equals sign. echo $host prints lab. echo \"Hello, $host\" prints Hello, lab because double quotes still expand the dollar.",
          "A name you never set expands to nothing, unless set -u is on, in which case Bash stops. ${name:-lab} means: use name, or the word lab if name is empty."
        ],
        "Export publishes a variable to programs you start. PATH, on the next page, is the exported variable that decides which programs those are.",
        "variables",
        ["host=lab", "echo Hello, $host"],
        "mistake",
        "Writing host = lab with spaces. Bash reads that as the command host, with = as an argument, and you do not get a variable."),
      L("path.html", "Where commands are found",
        "PATH is a list of directories. Bash looks in each one, in order, for the command you typed.",
        [
          "echo $PATH on the lab is /usr/bin. type ls says ls is /usr/bin/ls. Builtins such as cd, echo, and pwd do not use PATH. They are part of the shell.",
          "export PATH=/nope makes ls disappear: command not found. echo still works, because echo is a builtin. export PATH=/usr/bin puts the commands back. Reset lab also restores PATH."
        ],
        "command not found almost always means the program is not installed, or the directory that holds it is not on PATH. which and type are how you tell those two cases apart. This lab has no which. type is the builtin.",
        "path",
        ["type ls", "export PATH=/nope", "ls", "echo still-here", "export PATH=/usr/bin", "ls"],
        "mistake",
        "Reinstalling a tool that is already on disk, when the real problem is a PATH that no longer lists its directory."),
      L("quotes.html", "Quotes and expansion",
        "Single quotes copy text through unchanged. Double quotes allow $ variables. No quotes also expand globs and split on spaces.",
        [
          "echo '$HOME' prints the six characters dollar-H-O-M-E. echo \"$HOME\" prints /home/ana. The double quotes expand the variable and still keep the result as one word.",
          "The order on this lab is the order that matters for these pages. Bash finds the quoted spans, expands $ inside double quotes and unquoted words, expands unquoted stars into file names, and only then runs the command."
        ],
        "When you are unsure, use double quotes around every \"$variable\". You still get the value, and a value with a space stays one argument.",
        "quotes",
        ["echo $HOME", "echo \"$HOME\"", "echo '$HOME'"],
        "analogy",
        "Single quotes are a sealed envelope. Double quotes are a window envelope: the address shows through, and the letter stays one piece."),
      L("types.html", "Text, unless you do arithmetic",
        "Bash stores text. A variable that looks like a number is still text until you ask for arithmetic.",
        [
          "count=10 stores the characters 1 and 0. echo $count prints 10. That does not mean Bash added anything. It printed the characters.",
          "$((count + 1)) is an arithmetic expansion. Inside it, count is read as a number, and the result is the text 11. The spaces inside $(( )) are allowed. Spaces around an assignment's equals sign are not."
        ],
        "There are no strings and integers as separate types you declare. There is text, and there is $(( )) when you mean math. The next page is that math.",
        "types",
        ["count=10", "echo $count", "echo $((count + 1))"],
        "insight",
        "If you needed a number and got the digits stuck together, you printed text. Put the operation inside $(( ))."),
      L("operators.html", "Arithmetic",
        "Inside $(( )), Bash does real arithmetic, and multiplication happens before addition.",
        [
          "echo $((2 + 3 * 4)) prints 14, not 20. The 3 * 4 happens first. Parentheses force the other order: $(( (2 + 3) * 4 )) is 20.",
          "The operators are + - * / and %. / divides and drops the fraction, because this is integer arithmetic. % is the remainder."
        ],
        "A name inside $(( )) does not need a dollar sign. $((count + 1)) and $(($count + 1)) both work. The form without the inner dollar is the one to write.",
        "operators",
        ["echo $((2 + 3 * 4))", "echo $(((2 + 3) * 4))"],
        "mistake",
        "Expecting 2 + 3 * 4 to be 20 because you read left to right. Multiplication wins, the same way it does on paper."),
      L("exit-status.html", "Success and failure",
        "Every command ends with a code. Zero means success. Anything else means failure. $? is that code.",
        [
          "grep -q ERROR app.log succeeds, so echo $? prints 0. grep -q NOPE app.log finds nothing, so the next echo $? prints 1. -q keeps the match itself off the screen. Only the code remains.",
          "if uses this code. A command that returns 0 is the true branch. A pipeline's code is the last command's code, unless set -o pipefail is on, in which case any failed stage fails the pipeline."
        ],
        "Do not test $? with a string compare against the word success. Test the number, or put the command directly in the if.",
        "exit",
        ["grep -q ERROR app.log", "echo $?", "grep -q NOPE app.log", "echo $?"],
        "insight",
        "Zero is the odd one. In Bash, zero means it worked."),
      L("if.html", "Choose with if",
        "if runs a command and takes the then branch when that command returns zero.",
        [
          "The test command [ compares text and numbers. Spaces inside the brackets are required, because [ is a command and the brackets and the operator are separate arguments.",
          "A string compare uses = inside [. A number compare uses -lt, -eq, -gt, and the rest. The example below uses grep's exit code instead of a bracket, which is the clearer test when the question is whether a line exists."
        ],
        "Then, else, and fi are keywords on their own. fi closes the if. Forgetting fi is the usual syntax error.",
        "if",
        [],
        "mistake",
        "Writing if [ $level=ERROR ]. The equals must be a separate word, and the value belongs in quotes: if [ \"$level\" = ERROR ].",
        "level=ERROR\nif [ \"$level\" = ERROR ]; then\n  echo read-the-log\nelse\n  echo quiet\nfi\nif grep -q ERROR app.log; then\n  echo config-failed\nfi"),
      L("for-loop.html", "Loop over names",
        "for repeats a block once for each word in a list.",
        [
          "for f in notes.txt app.log takes the two names, sets f to each in turn, and runs the body. echo \"$f\" prints the name. The quotes keep a name with a space as one word, if you ever have one.",
          "The list can be a glob. for f in *.txt runs once per text file. The shell expands the glob before for starts, which is the glob lesson showing up inside a script."
        ],
        "do opens the body and done closes it. The variable keeps the last value after the loop ends.",
        "for",
        [],
        "insight",
        "Loop over names you already trust. A glob of the wrong folder is a loop over the wrong files, executed for real.",
        "for f in notes.txt app.log; do\n  echo file-$f\ndone"),
      L("while-loop.html", "Loop until a test fails",
        "while repeats as long as its test command returns zero.",
        [
          "n=0 starts the counter. while [ \"$n\" -lt 3 ] keeps going while n is less than 3. The body prints n and then sets n=$((n + 1)).",
          "The lab stops a loop after 40 turns so a forgotten increment cannot spin forever. A real Bash will spin until you press Ctrl+C. Every while needs a change inside the body that will eventually fail the test."
        ],
        "for is for a list you already have. while is for a condition that becomes false. If you can name the items, use for.",
        "while",
        [],
        "caution",
        "A while whose variable never changes runs until something else stops it. Update the variable on every pass.",
        "n=0\nwhile [ \"$n\" -lt 3 ]; do\n  echo n-$n\n  n=$((n + 1))\ndone"),
      L("functions.html", "Name a block of commands",
        "A function is a name for a block you will run more than once. The words you pass become $1, $2, and so on.",
        [
          "greet() { echo Hello, $1; } defines greet. greet ana runs it with $1 set to ana. The echo prints Hello, ana.",
          "A function uses the same streams as a command. You can pipe into it, and its exit code is the exit code of the last command it ran."
        ],
        "Define the function before you call it. Bash reads from the top. A call above the definition is a command-not-found, because the name does not exist yet.",
        "functions",
        [],
        "analogy",
        "A function is a recipe with a name. $1 is the first ingredient the caller handed you.",
        "greet() {\n  echo Hello, $1\n}\ngreet ana"),
      L("arrays.html", "A list in one name",
        "An array holds several words under one name. You pick an item by its index, starting at zero.",
        [
          "ports=(8080 8443) stores two words. ${ports[0]} is 8080. ${ports[1]} is 8443. ${#ports[@]} is the count, 2.",
          "The braces are required. $ports[0] does not mean item zero. It means the first item, then the literal characters [0], because the index syntax lives inside the braces."
        ],
        "Indexes start at zero, the way they do in most programming languages, and not at one, the way cut's fields do. Those are different tools.",
        "arrays",
        [],
        "mistake",
        "Writing $ports[0] and wondering why the output is 8080[0]. The braces are part of the syntax: ${ports[0]}.",
        "ports=(8080 8443)\necho ${ports[0]}\necho ${ports[1]}\necho ${#ports[@]}"),
      L("cron.html", "Run a command on a clock",
        "cron runs a command on a schedule. Five fields say when, and the rest of the line is the command.",
        [
          "The fields are minute, hour, day of month, month, and day of week. A star means every. */5 in the minute field means every fifth minute. The lab's sample line is */5 * * * * du -sh /home/ana/work.",
          "crontab -l lists the table. On a real host, crontab -e edits it. The lab will not install a job or wait five minutes. It shows the line so you can read the fields. The clock in the picture is that line, drawn."
        ],
        "A cron command does not have your interactive PATH or your current folder. Write absolute paths, /home/ana/work, not ~/work, unless you have tested the exact line cron will use. Later pages cover trap and flock so a cron job cleans up and does not overlap itself.",
        "cron",
        ["crontab -l"],
        "insight",
        "Cron only starts the command. The script still needs absolute paths, a lock, and a trap of its own."),
      L("case.html", "Choose with case",
        "case picks one branch by matching a value against patterns. It is the clearer form when you have more than two choices.",
        [
          "case \"$1\" in start) ... ;; stop) ... ;; *) ... ;; esac reads the first argument and runs the matching branch. Each pattern ends with ). Each branch ends with ;;. esac closes the block.",
          "The star pattern * is the default, the same job else does for if. Patterns can list alternatives with a pipe: start|on). The lab's practice script uses if, because the practice computer does not run case. The example below is the real Bash form to type on a host."
        ],
        "Prefer case when the question is which word is this. Prefer if when the question is a test such as -f or -gt.",
        "case",
        [],
        "insight",
        "One value, many named branches. That is when case is easier to read than a tower of if.",
        "action=start\nif [ \"$action\" = start ]; then\n  echo starting\nelif [ \"$action\" = stop ]; then\n  echo stopping\nelse\n  echo unknown\nfi",
        null,
        "case \"$1\" in\n  start|on)  echo starting ;;\n  stop|off)  echo stopping ;;\n  *)         echo \"unknown: $1\" >&2; exit 2 ;;\nesac"),
      L("strings.html", "Change text in a variable",
        "Parameter expansion edits text inside a variable without calling basename or sed for a one-line change.",
        [
          "path=/home/ana/work/notes.txt stores a path. ${path##*/} strips the longest match of */ from the front, leaving notes.txt. ${path%.*} strips the shortest .suffix from the end, leaving /home/ana/work/notes.",
          "${name:-lab} means use name, or the word lab when name is empty. The practice computer supports that form. The ## and % forms are for a real Bash; the lab shows the idea with a short assignment and echo."
        ],
        "Reach for parameter expansion when the edit is a prefix, a suffix, or a default. Reach for sed or awk when the edit is a whole file.",
        "strings",
        ["name=", "echo ${name:-lab}", "name=ana", "echo ${name:-lab}"],
        "insight",
        "Defaults and stripping a suffix are Bash features. You do not need a second process for those.",
        "",
        null,
        "path=/home/ana/work/notes.txt\necho \"${path##*/}\"\necho \"${path%.*}\"\necho \"${missing:-lab}\""),
      L("args.html", "Read options with getopts",
        "getopts walks short options such as -n and -f FILE, and leaves the remaining arguments for you to shift onto.",
        [
          "while getopts ':nf:h' opt; do case $opt in ... esac; done is the usual loop. A letter followed by a colon means that option takes a value in OPTARG. After the loop, shift $((OPTIND-1)) drops the options that were already read.",
          "Write a usage function that prints to stderr and exits 2. Call it for -h and for a missing required value. The practice computer does not run getopts. The script below is what you type on a real host. The lab practice uses a plain $1 check you can run here."
        ],
        "Long options such as --verbose need a while [[ $# -gt 0 ]] loop and a case on $1. getopts is for the single-dash letters.",
        "args",
        [],
        "mistake",
        "Forgetting to shift after getopts. The leftover -$letters then look like file names.",
        "file=${1:-}\nif [ -z \"$file\" ]; then\n  echo \"Usage: need a file\" >&2\n  exit 2\nfi\necho \"file=$file\"",
        null,
        "#!/usr/bin/env bash\nset -euo pipefail\nusage() { echo \"Usage: $0 [-n] -f FILE\" >&2; exit 2; }\ndry=0\nfile=\"\"\nwhile getopts ':nf:h' opt; do\n  case $opt in\n    n) dry=1 ;;\n    f) file=$OPTARG ;;\n    h|?) usage ;;\n  esac\ndone\nshift $((OPTIND-1))\n[[ -n $file ]] || usage\necho \"dry=$dry file=$file rest=$*\""),
      L("traps.html", "Clean up with trap",
        "trap runs a command when the script exits or receives a signal. Use it to remove a temp directory you created.",
        [
          "tmpdir=$(mktemp -d) creates a unique folder. trap 'rm -rf -- \"$tmpdir\"' EXIT registers cleanup for any exit, success or failure. INT and TERM are the signals Ctrl+C and a polite kill send.",
          "A die function that prints to stderr and exits 1 keeps error messages in one place. The practice computer does not run trap or mktemp. The lab script shows die with a plain exit. The example is the real form for a host."
        ],
        "Put trap right after you create the resource. A trap registered too late cannot clean up a failure that already happened.",
        "traps",
        [],
        "insight",
        "EXIT is the net under the script. Register it before the risky work.",
        "die() {\n  echo \"ERROR: $1\" >&2\n  exit 1\n}\nif [ ! -f app.log ]; then\n  die \"missing app.log\"\nfi\necho ok",
        null,
        "#!/usr/bin/env bash\nset -euo pipefail\ntmpdir=$(mktemp -d)\ncleanup() { rm -rf -- \"$tmpdir\"; }\ntrap cleanup EXIT INT TERM\necho \"using $tmpdir\"\n# work here; cleanup runs on the way out"),
      L("debug.html", "Debug a script",
        "bash -n checks syntax without running. bash -x prints each command as it runs.",
        [
          "bash -n script.sh is the first pass after you edit. A missing fi or done shows up there. bash -x script.sh traces expansions so you see the real words after $var and globs.",
          "A small log function that prints a level and a timestamp to stderr keeps debug noise out of the data on stdout. The practice computer has no bash -n flag. The lab script shows a log line you can run here."
        ],
        "Trace one failing path. Turning -x on a whole pipeline of thousands of lines hides the bug in noise.",
        "debug",
        [],
        "insight",
        "Syntax first with -n. Behavior second with -x. Logging for the cases you will see again.",
        "log() {\n  echo \"INFO $1\" >&2\n}\nlog \"checking app.log\"\ngrep -q ERROR app.log\nlog \"found ERROR\"",
        null,
        "bash -n myscript.sh\nbash -x myscript.sh\n# or inside a script:\n# set -x   # start trace\n# set +x   # stop trace"),
      L("flock.html", "One run at a time",
        "flock takes a lock file so a second copy of the same cron job exits instead of overlapping the first.",
        [
          "exec 9>\"/tmp/myscript.lock\" opens lock file descriptor 9. flock -n 9 tries to lock it without waiting. If the lock is busy, the script prints already running and exits 0 so cron does not treat the skip as a failure.",
          "Without a lock, two five-minute cron runs that each take six minutes step on the same files. The practice computer has no flock. The picture is the idea. The example is what you put around the body of a real script."
        ],
        "Exit 0 on lock failure when a skip is normal. Exit non-zero when a skipped run is a problem you want monitored.",
        "flock",
        [],
        "caution",
        "A lock does not replace set -e. It only stops two copies from running the same critical section.",
        "",
        null,
        "#!/usr/bin/env bash\nset -euo pipefail\nlock=/tmp/myscript.lock\nexec 9>\"$lock\"\nif ! flock -n 9; then\n  echo \"already running\" >&2\n  exit 0\nfi\n# critical section\necho \"running $$\""),
      L("jq.html", "Read JSON with jq",
        "curl can fetch JSON. jq pulls one field out as plain text a script can test.",
        [
          "curl -fsS URL returns the body and fails on HTTP errors when you pass -f. jq -r .status reads the status field and prints it without quotes. Pipe them: curl -fsS URL | jq -r .status.",
          "The practice computer has curl for the lab app and no jq. The lab practice shows curl. The example is the real host form with jq."
        ],
        "When the JSON is nested or large, jq is still the right tool. When the data is a CSV with millions of rows, switch to Python or another language.",
        "jq",
        ["curl -I http://lab:8080"],
        "insight",
        "Fail the HTTP fetch with curl -f, then pick fields with jq. Do not scrape JSON with grep.",
        "",
        null,
        "#!/usr/bin/env bash\nset -euo pipefail\ncode=$(curl -fsS -o /tmp/body.json -w '%{http_code}' https://example.com/api)\n[[ $code == 200 ]] || { echo \"HTTP $code\" >&2; exit 1; }\njq -r .name /tmp/body.json"),
      L("security.html", "Keep a script safe",
        "A script must treat outside text as data. Never eval a string that came from a file, a URL, or a person.",
        [
          "eval \"$cmd\" runs whatever is in cmd as Bash code. If cmd came from a user, that is code injection. Quote every \"$variable\", use -- before file names that might start with a dash, and prefer arrays for argument lists.",
          "Passwords on the command line show up in ps. Prefer an environment variable with a locked-down file, or a secret manager. Do not commit secrets into the repository."
        ],
        "sudo inside a script widens every bug to root. Prefer running the whole script as the right user, or one carefully reviewed sudo line.",
        "security",
        ["echo \"$HOME\"", "echo -- -n"],
        "mistake",
        "eval to \"make quoting easier\". Redesign so you pass arguments, not a string of code.",
        "",
        null,
        "# Bad:  eval \"rm $file\"\n# Good: rm -- \"$file\"\n# Bad:  mysql -p\"$PASS\"   # visible in ps\n# Good: read the password from a 600 file or a secret tool"),
      L("pitfalls.html", "Classic mistakes",
        "A short list of Bash mistakes that show up on real hosts, and the fix for each.",
        [
          "Unquoted $var splits on spaces. Unquoted $@ does the same. Parsing ls breaks on odd names. for f in $(ls) is the same class of bug. Use a glob or find -print0 with read -d ''.",
          "A pipeline runs the right-hand side in a subshell, so variables set inside while read stay empty outside. Feed the file with < file instead of piping into while when you need the variables afterward."
        ],
        "shellcheck catches many of these before you run the script. Install it and run shellcheck myscript.sh on every change.",
        "pitfalls",
        ["echo $HOME", "echo \"$HOME\""],
        "mistake",
        "for f in $(ls). The shell already expands *.txt. Let it.",
        "",
        { headers: ["Pitfall", "Fix"], rows: [
          ["Unquoted $var", "\"$var\" and \"$@\""],
          ["for f in $(ls)", "for f in *.txt or find -print0"],
          ["file | while read", "while read ...; do ...; done < file"],
          ["[ $a = x ] with spaces", "[[ $a == x ]] or quote inside ["],
          ["eval on user data", "Never. Pass arguments instead"]
        ] }),
      L("style.html", "Script style",
        "A readable script has a shebang, strict mode, functions, and one main call at the bottom.",
        [
          "Name scripts verb-noun.sh. Name functions snake_case. Put the logic in functions. Call main \"$@\" as the last line so arguments enter in one place.",
          "Comments explain why a choice was made. The syntax already says what the next line does. Prefer Bash-only features only when the shebang is bash, not sh."
        ],
        "Run shellcheck in CI or before you commit. Treat its warnings as real until you understand why they are wrong.",
        "style",
        [],
        "insight",
        "main \"$@\" at the bottom is the door. Everything else is a named room.",
        "greet() {\n  echo Hello, $1\n}\nmain() {\n  greet \"${1:-ana}\"\n}\nmain",
        null,
        "#!/usr/bin/env bash\nset -euo pipefail\nmain() {\n  # work\n  true\n}\nmain \"$@\""),
      L("cheat-sheet.html", "Cheat sheet",
        "A one-page list of the Bash forms this course expects you to keep open while writing a script.",
        [
          "The table is the sheet. The practice terminal is still there for a quick echo or test. Project scripts in the next topic reuse these forms end to end."
        ],
        "Print this page or leave the tab open. The next topic walks finished scripts that use the same habits.",
        "sheet",
        ["echo \"set -euo pipefail\"", "echo \"\\\"\\$@\\\"\""],
        "insight",
        "Strict mode, quoted \"$@\", [[ ]], and trap cover most production scripts.",
        "",
        { headers: ["Topic", "Form"], rows: [
          ["Shebang", "#!/usr/bin/env bash"],
          ["Strict mode", "set -euo pipefail"],
          ["Test", "[[ -f $f ]]  [[ $a == b ]]"],
          ["Default", "${x:-default}  ${x:?err}"],
          ["Arrays", "a=(..)  \"${a[@]}\""],
          ["Redirect", ">  >>  2>  |&  tee"],
          ["Special", "$#  $@  $?  $0  $$  $!"],
          ["Trap", "trap cleanup EXIT"],
          ["Options", "getopts  then  shift $((OPTIND-1))"]
        ] })
    ]
  },
  {
    id: "scripts", title: "Scripts",
    lessons: [
      L("projects.html", "Project scripts",
        "The scripts/ folder holds finished scripts to study on a real host. Each later page explains one of them.",
        [
          "The set covers a template, a rotating backup, a log summary, a disk alert, a dry-run renamer, a multi-host SSH runner, and a CSV sampler for df and iostat.",
          "Read the header of each file before you run it. Prefer a disposable directory, a VM, or WSL. Several scripts touch disks or open SSH."
        ],
        "The practice terminal stays a picture of a host. Run the project scripts outside this page, then come back to the lesson that matches the file.",
        "projects",
        ["ls", "cat app.log"],
        "caution",
        "Project scripts may delete old backups, rename files, or SSH to hosts. Read the usage line first."),
      L("template.html", "A reusable template",
        "scripts/30-template.sh is a skeleton: getopts, logging, mktemp with an EXIT trap, and main.",
        [
          "Copy it when you start a new tool. Keep log and die. Keep the trap. Replace the body inside main. The -n dry-run and -v verbose flags are already wired.",
          "The practice computer cannot run the full template. The lab script is a tiny main() shape you can run here. The example is the real file's outline."
        ],
        "Open scripts/30-template.sh next to this page. The comments in the file are the map.",
        "template",
        [],
        "insight",
        "A template is not dead code. It is the checklist you stop retyping.",
        "log() {\n  echo \"INFO $1\" >&2\n}\nmain() {\n  log \"start\"\n  echo Hello from template\n}\nmain",
        null,
        "#!/usr/bin/env bash\n# See scripts/30-template.sh\nset -euo pipefail\ntrap cleanup EXIT INT TERM\nparse_args() { while getopts ':nvh' opt; do ...; done; }\nmain() { parse_args \"$@\"; tmpdir=$(mktemp -d); ...; }\nmain \"$@\""),
      L("backup.html", "Backup with rotation",
        "scripts/24-backup.sh archives a directory to a dated .tar.gz, keeps the newest N, and logs the run.",
        [
          "Usage: ./24-backup.sh SOURCE_DIR DEST_DIR [KEEP]. The default keep count is 7. It writes to DEST_DIR/backup.log as it works.",
          "Study the mapfile rotation loop. It lists archives newest first and removes the ones past KEEP. Run it once against a temp folder before you point it at real data."
        ],
        "Pair this with cron and flock so two backups do not rotate each other mid-run.",
        "backup",
        ["tar -czf learn.tar.gz notes.txt", "tar -tzf learn.tar.gz"],
        "caution",
        "Rotation deletes old archives. Confirm DEST_DIR and KEEP on a disposable copy first.",
        "",
        null,
        "# ./scripts/24-backup.sh \"$HOME/docs\" \"$HOME/backups\" 5"),
      L("log-analyzer.html", "Log analyzer",
        "scripts/25-log-analyzer.sh counts error, warn, and info style lines and prints the top error-like samples.",
        [
          "Usage: ./25-log-analyzer.sh LOGFILE. It uses grep -Eic for counts and head for samples. A missing file exits 1. Wrong usage exits 2.",
          "The lab practice shows the same idea on app.log with grep -c. The full script is the file under scripts/."
        ],
        "Point it at a real app log when you want a one-screen summary before you dig with less or journalctl.",
        "logalyze",
        ["grep -c ERROR app.log", "grep -c WARN app.log", "grep ERROR app.log"],
        "insight",
        "Counts first, then a short sample. That order is enough for many on-call checks.",
        "",
        null,
        "# ./scripts/25-log-analyzer.sh app.log"),
      L("disk-monitor.html", "Disk health monitor",
        "scripts/26-disk-monitor.sh alerts when any mounted filesystem is over a threshold and exits 1 on alert.",
        [
          "Usage: ./26-disk-monitor.sh [THRESHOLD_PERCENT]. The default is 85. It reads df -hP, skips tmpfs-style rows, and prints ALERT on stderr when usage is high.",
          "Cron can run it every few minutes. A non-zero exit is what monitoring hooks watch for. The lab shows df. The threshold logic lives in the script file."
        ],
        "Combine with flock if the interval is shorter than the run time on a busy host.",
        "diskmon",
        ["df"],
        "insight",
        "df answers which filesystem. The script answers whether that percentage crosses your line.",
        "",
        null,
        "# ./scripts/26-disk-monitor.sh 85"),
      L("bulk-rename.html", "Bulk renamer",
        "scripts/27-bulk-rename.sh lowercases *.txt names. Default is dry-run. Pass --apply to rename.",
        [
          "Usage: ./27-bulk-rename.sh DIR [--apply]. It skips names that would collide with an existing file. Bash ${base,,} needs Bash 4 or newer.",
          "Dry-run first is the whole point. The lab can rename one file with mv so you see the idea. The script loops a directory safely."
        ],
        "Never start with --apply on a directory you have not listed.",
        "rename",
        ["cp notes.txt Notes.TXT", "mv Notes.TXT notes-upper.txt", "ls"],
        "caution",
        "Dry-run is the default because rename mistakes are hard to undo.",
        "",
        null,
        "# ./scripts/27-bulk-rename.sh ./docs\n# ./scripts/27-bulk-rename.sh ./docs --apply"),
      L("ssh-runner.html", "Multi-host SSH runner",
        "scripts/28-ssh-runner.sh runs one command on every host in a file and prints ok/fail counts.",
        [
          "Usage: ./28-ssh-runner.sh HOSTS_FILE REMOTE_COMMAND.... Host lines can be hostname or user@host. Lines starting with # are comments. It uses ssh BatchMode so it will not hang on a password prompt.",
          "You need working key auth. The lab's ssh command only explains the idea. Run the real script from a host that can reach the list."
        ],
        "Start with a hosts file of one machine you own. Read the summary line before you scale the list.",
        "sshrun",
        ["ssh ana@other"],
        "caution",
        "A wrong command on many hosts fails on many hosts. Test the remote command once by hand first.",
        "",
        null,
        "# ./scripts/28-ssh-runner.sh hosts.txt hostname"),
      L("iostat-csv.html", "df and iostat CSV sampler",
        "scripts/29-iostat-csv.sh appends timestamped df rows, and iostat rows when sysstat is installed, into a CSV.",
        [
          "Usage: ./29-iostat-csv.sh OUT.csv [SAMPLES] [INTERVAL_SEC]. Defaults are 3 samples and 2 seconds. It creates a header on first write.",
          "Use the CSV later in a chart or a notebook. The lab has df. iostat is optional on the real host; the script falls back to df-only rows."
        ],
        "This is for light trending, not a replacement for a metrics stack.",
        "iostat",
        ["df"],
        "insight",
        "A few CSV rows over time beat a screenshot of top when you need a trend.",
        "",
        null,
        "# ./scripts/29-iostat-csv.sh /tmp/samples.csv 5 2")
    ]
  }
];

var glossary = [
  ["shell", "The program that reads your command line. Bash is a shell.", "what-the-shell-is.html"],
  ["prompt", "The text Bash prints when it is waiting, such as ana@lab:~/work$.", "what-the-shell-is.html"],
  ["host", "A Linux machine you log into. In this course the host is lab.", "open-a-shell.html"],
  ["argument", "A word after the command, often a file or a pattern.", "command-line.html"],
  ["option", "A word, usually starting with a dash, that changes a command.", "command-line.html"],
  ["standard output", "The normal stream of results, connected by a pipe or by >.", "pipes.html"],
  ["standard error", "The stream for complaints, separate from the normal results.", "pipes.html"],
  ["pipe", "The | character. It feeds one command's output to the next command.", "pipes.html"],
  ["working directory", "The folder relative names are judged from. pwd prints it.", "pwd.html"],
  ["absolute path", "A path that starts at /, such as /home/ana/work.", "pwd.html"],
  ["glob", "A pattern such as *.txt that the shell expands into file names.", "globs.html"],
  ["symbolic link", "A name that stores another path. ls -l shows it with an arrow.", "links.html"],
  ["field", "One column of a line, split on a separator. cut and awk both use fields.", "awk.html"],
  ["pid", "The number that identifies a process. ps prints it. kill uses it.", "ps.html"],
  ["signal", "A small message to a process, such as TERM or KILL.", "kill.html"],
  ["filesystem", "A disk, or part of a disk, mounted at a path. df lists them.", "df.html"],
  ["PATH", "The list of directories Bash searches for a command.", "path.html"],
  ["exit status", "The code a command returns. Zero means success. $? prints it.", "exit-status.html"],
  ["shebang", "The #! line at the top of a script that names the interpreter.", "syntax.html"],
  ["cron", "The scheduler that runs a command from a five-field clock.", "cron.html"],
  ["case", "A multi-branch match on one value. Patterns end with ) and branches with ;;.", "case.html"],
  ["getopts", "Bash builtin that walks short options such as -n and -f FILE.", "args.html"],
  ["trap", "A handler that runs on EXIT or a signal, used for cleanup.", "traps.html"],
  ["flock", "A file lock so two copies of a job do not overlap.", "flock.html"],
  ["jq", "A tool that reads JSON and prints selected fields as text.", "jq.html"]
];

module.exports = { topics: topics, glossary: glossary };

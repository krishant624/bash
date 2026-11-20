function L(file, title, point, idea, more, diagram, run, kind, call, script, table, sample) {
  return { file: file, title: title, point: point, idea: idea, more: more, diagram: diagram, run: run, kind: kind, call: call, script: script || "", table: table || null, sample: sample || "" };
}

var afterLs = [
  L("hidden.html", "See hidden names",
    "A file whose name starts with a dot is hidden. ls skips it until you pass -a.",
    [
      "touch .secret creates a file in this folder. ls does not print .secret. ls -a does, and it also prints . and .., which are the current folder and its parent.",
      "Your shell's saved settings live in ~/.bashrc. That name starts with a dot, so ls of your home hides it. The file is still there. cat ~/.bashrc prints it."
    ],
    "A leading dot is a naming habit, not a permission. chmod and rm work on the file once you name it.",
    "hidden",
    ["touch .secret", "ls", "ls -a"],
    "insight",
    "When a config file seems to be missing, list the folder again with ls -a.")
];

var afterGlobs = [
  L("extglob.html", "Extended globs",
    "An extended glob matches one of several patterns in a single word, after you turn the option on.",
    [
      "shopt -s extglob enables forms such as @(txt|log), which means txt or log. *.@(txt|log) matches notes.txt and app.log.",
      "*(pattern) means zero or more. +(pattern) means one or more. ?(pattern) means zero or one. !(pattern) means anything except that pattern. This lab's practice computer expands only * and ?. The example is the form you type on a real Bash."
    ],
    "Quote an extended glob when you are handing the pattern to find. Unquoted, Bash expands it first.",
    "extglob",
    ["echo *.txt"],
    "insight",
    "Use an extended glob when you would otherwise write two globs and join the lists yourself.",
    "",
    null,
    "shopt -s extglob\necho *.@(txt|log)"),
  L("globopt.html", "Glob options",
    "shopt changes what a glob does when it matches nothing, and whether dotfiles are included.",
    [
      "By default, a glob that matches nothing is left as the literal text. echo *.nope prints *.nope. shopt -s nullglob makes that same glob disappear, so the command receives no file name.",
      "shopt -s dotglob lets * include names that start with a dot. . and .. stay out. shopt -u turns an option off. shopt with no arguments lists the ones this lab knows."
    ],
    "nullglob is the safe setting inside a for loop over a folder that might be empty. Without it, the loop runs once with the literal pattern.",
    "globopt",
    ["echo *.nope", "shopt -s nullglob", "echo *.nope", "shopt"],
    "mistake",
    "A for loop over *.txt in an empty folder, with nullglob off, runs once on the word *.txt."),
  L("braces.html", "Brace expansion",
    "Brace expansion writes several words from a comma list before globs or variables run.",
    [
      "echo {a,b,c} becomes three words: a, b, and c. The braces and the commas are the shell's, not echo's.",
      "Text on either side is glued to each alternative. echo file{1,2}.txt becomes file1.txt and file2.txt. This happens even when those files do not exist."
    ],
    "Brace expansion is not a glob. A glob looks at the disk. A brace list does not.",
    "braces",
    ["echo {a,b,c}", "echo file{1,2}.txt"],
    "insight",
    "Use braces to generate names. Use a glob to select names that already exist."),
  L("brace-glob.html", "Braces and globs",
    "Braces run first. Each result is then free to match files with a glob.",
    [
      "echo {notes,names}.txt becomes notes.txt and names.txt. Both files exist in this lab, so you see those two names.",
      "If you put a star in the result, the glob runs on each alternative. That is why {a,b}* can match different files than a* b* typed as two words. The order is braces, then variables, then globs."
    ],
    "Spaces inside a brace list split it into something else. Keep the list tight: {notes,names}, not {notes, names}.",
    "braceglob",
    ["echo {notes,names}.txt"],
    "insight",
    "When a line both generates names and matches files, read it from the braces outward."),
  L("brace-num.html", "Numeric braces",
    "A brace range counts. {1..3} becomes 1, 2, and 3.",
    [
      "echo {1..3} prints 1 2 3. echo {3..1} counts down. The ends are integers. This is still brace expansion, so the numbers appear even when no file has that name.",
      "A prefix still glues on. echo log{1..3}.txt becomes log1.txt log2.txt log3.txt. On a real Bash you can pad with {01..03}. This lab counts with plain integers and stops a huge range at 40 numbers."
    ],
    "Do not use a wide range as a toy on a command that creates files. {1..10000} is ten thousand arguments.",
    "bracenum",
    ["echo {1..3}", "echo log{1..3}.txt"],
    "caution",
    "A range is arguments, not a wish. The command you put in front of it runs on every number.")
];

var afterAlias = [
  L("alias-args.html", "Aliases do not take arguments",
    "An alias is text pasted in front of the line. It has no $1.",
    [
      "alias ll='ls -alF' works because you are not trying to pass a parameter into the alias. Extra words you type are added after the pasted text.",
      "alias greet='echo hello $1' does not do what a function does. The $1 is not the word you type later. When the next word has to become part of the command, write a function."
    ],
    "The practice script is the function form. Use that whenever the shortcut needs an argument.",
    "aliasargs",
    [],
    "mistake",
    "Debugging an alias that contains $1. Replace it with a function.",
    "greet() {\n  echo Hello, $1\n}\ngreet ana")
];

var afterTail = [
  L("paging.html", "Page through a file",
    "less shows a long file one page at a time. head and tail only show an end.",
    [
      "less app.log opens the log. Space moves forward a page. b moves back. /ERROR searches. q leaves. The file is not edited.",
      "This lab prints the file and then stops, and it says so. On a host, less waits for those keys. Use it when the file is longer than the screen and you still want to move around."
    ],
    "cat dumps the whole file. less is the same bytes with a pager in front. more is the older pager. less is the one to learn.",
    "paging",
    ["less app.log"],
    "insight",
    "If the file is long and you do not yet know the word to grep, page it. If you know the word, grep it.")
];

var afterGrep = [
  L("regex.html", "Regular expressions",
    "A regular expression is a pattern. It describes a shape of text, not one fixed spelling.",
    [
      "In a basic pattern, a dot matches any one character. ERROR matches those five letters. Er.or matches Error and ErXor. A star after a character means that character may repeat.",
      "grep -E turns on the extended form, where + means one or more and | means or. The lab's grep treats the pattern as text unless you rely on a simple substring. The example is what -E means on a host. sed and awk use the same idea inside their own patterns."
    ],
    "Quote the pattern. A dot or a star is also shell syntax, and the shell runs first.",
    "regex",
    ["grep ERROR app.log", "grep -c INFO app.log"],
    "insight",
    "Start with a fixed word. Add a regular expression only when the word itself varies.",
    "",
    null,
    "grep -E 'ERROR|WARN' app.log\ngrep -E 'fail(ed)?' app.log")
];

var afterCut = [
  L("tr.html", "Translate characters",
    "tr reads stdin and replaces each character in one set with the character in the same position of another set.",
    [
      "echo ana | tr a-z A-Z prints ANA. a-z is the 26 lowercase letters. A-Z is the 26 uppercase letters. tr walks the line one character at a time.",
      "tr -d deletes the characters you name. tr -s squeezes repeats into one. tr does not know about words or columns. cut and awk do that job."
    ],
    "tr always reads stdin. A file name as an argument is a set of characters, not a path. Pipe the file in, or redirect it with <.",
    "tr",
    ["echo ana | tr a-z A-Z", "echo ana | tr a A"],
    "insight",
    "Use tr for letters and digits. Use sed when the thing you are changing is a word.")
];

var beforeSyntax = [
  L("vim.html", "Edit a file with vim",
    "vim is a full-screen editor with modes. You cannot type text until you enter insert mode.",
    [
      "vim notes.txt opens the file in normal mode. i enters insert mode, and then the keys you press become text. Esc returns to normal mode. :w writes the file. :q leaves. :q! leaves and drops unsaved edits.",
      "In normal mode, dd deletes a line, /ERROR searches, and n jumps to the next hit. This lab has no full-screen editor. The practice box is where a script's text goes. On a host, the picture below is the loop you memorize first."
    ],
    "If the terminal looks frozen inside vim, you are in a mode. Press Esc, then type :q! and Enter.",
    "vim",
    ["cat notes.txt"],
    "analogy",
    "Normal mode is a toolbox. Insert mode is the pencil. Esc puts the pencil down.",
    "",
    null,
    "vim notes.txt\ni\nEsc\n:w\n:q")
];

var afterVariables = [
  L("command-sub.html", "Command substitution",
    "A command inside $( ) runs first. Its output is pasted into the line as text.",
    [
      "echo $(hostname) runs hostname, takes the word lab, and then echo prints it. The command's trailing newline is removed so it can sit inside a larger line.",
      "host=$(hostname) stores that text in a variable. Quoting matters around the substitution when the output may contain spaces: echo \"$(hostname)\"."
    ],
    "Backticks are the older spelling of the same idea. Prefer $( ). They nest, and they are easier to see.",
    "cmdsub",
    ["echo $(hostname)", "host=$(hostname)", "echo \"host is $host\""],
    "insight",
    "If you need a command's answer as a value, capture it with $( ). Do not scrape it off the screen.")
];

var afterOperators = [
  L("printf.html", "Print with printf",
    "printf prints from a format string. You name the shape, then the values.",
    [
      "printf 'Hello %s\\n' ana prints Hello ana and a newline. %s means a string. %d means an integer. \\n in the format is the newline. printf does not add one for you.",
      "echo joins words and always ends the line, unless you pass -n. printf is the one to use when columns, widths, or a missing newline matter."
    ],
    "The format is the first argument. Everything after it fills the % markers from left to right.",
    "printf",
    ["printf 'Hello %s\\n' ana", "printf '%s %d\\n' port 8080"],
    "insight",
    "Prefer printf in a script when the next program will read your exact bytes."),
  L("date-format.html", "Format a date",
    "date prints the clock. A format that starts with + chooses which pieces you want.",
    [
      "date with no arguments prints a long line, such as Mon Nov 2 09:04:01 UTC 2026. date +%F prints 2026-11-02. %F is the year-month-day form.",
      "%T is the time of day, 09:04:01. %Y, %m, and %d are the year, month, and day as separate pieces. This lab's clock is frozen on the practice host so the numbers stay the ones in the lesson."
    ],
    "Use date +%F when a file name needs a day stamp. The backup script in the Scripts topic does that with a timestamp.",
    "datefmt",
    ["date", "date +%F", "date +%T"],
    "insight",
    "Put the format in single quotes if you ever add a space. date '+%F %T' is one argument.")
];

var afterExit = [
  L("pipe-status.html", "A pipeline's status",
    "Without pipefail, a pipeline's status is only the last command. An earlier failure can hide.",
    [
      "grep -q NOPE app.log fails, because NOPE is not in the log. wc -l then counts zero lines and succeeds. The pipeline's $? is 0, the success from wc.",
      "set -o pipefail makes the pipeline fail if any stage fails. After that, the same line leaves $? as 1. PIPESTATUS is an array of every stage's code on a real Bash. This lab keeps the combined result in $?."
    ],
    "set -euo pipefail at the top of a script turns this on before any work. The run-a-script lesson is that header.",
    "pipestatus",
    ["grep -q NOPE app.log | wc -l", "echo $?", "set -o pipefail", "grep -q NOPE app.log | wc -l", "echo $?"],
    "mistake",
    "Trusting $? after a pipeline when pipefail is off. You may be looking at wc, not at grep."),
  L("time.html", "Time a command",
    "time runs the next command and then prints how long it took.",
    [
      "time pwd runs pwd, prints the folder, and then prints real, user, and sys times. real is the wall clock. user and sys are time spent in the program and in the kernel.",
      "This lab uses a fixed short time so the page is predictable. On a host the numbers are the real measurement. time is a keyword in front of a command, not a stopwatch you start and stop."
    ],
    "To time a pipeline, group it: time grep ERROR app.log | wc -l times only grep in some shells. On Bash, time applies to the pipeline that follows it.",
    "timing",
    ["time pwd", "time grep ERROR app.log"],
    "insight",
    "Read real first. That is how long you waited."),
  L("test-brackets.html", "Brackets and test",
    "[ is a command. [[ is Bash syntax. test is [ under another name. They all ask a yes-or-no question.",
    [
      "[ -f notes.txt ] succeeds when that path is a file. The spaces around the brackets are required. [[ -f notes.txt ]] asks the same question with fewer quoting surprises.",
      "Inside [[ you can use == and pattern matches. Inside [ use = for text and -eq for numbers. test -f notes.txt is the same check as the single-bracket form. This lab's [ -t 1 ] is covered on the tty page."
    ],
    "Prefer [[ in a script whose shebang is bash. Prefer [ when the script must also run under a plain POSIX sh.",
    "brackets",
    ["[ -f notes.txt ]", "echo $?", "[ -f missing.txt ]", "echo $?"],
    "mistake",
    "Writing [ -f notes.txt] with no space before the closing bracket. [ never sees the end of the command.")
];

var afterCase = [
  L("special.html", "Special parameters",
    "Bash keeps a few values in short names: the script, its arguments, and the last status.",
    [
      "$0 is the name of the shell or the script. $1 is the first argument. $# is how many arguments there are. $@ is all of them, and \"$@\" keeps each argument as its own word.",
      "$? is the exit status of the last command. $$ is this shell's process id. $! is the pid of the last background command, on a host that started one. At this prompt, $# is 0 because you did not pass arguments to the shell."
    ],
    "Quote \"$@\" when you forward arguments to another command. Unquoted $@ splits them again.",
    "special",
    ["echo $0", "echo $#", "echo $$", "echo $?"],
    "insight",
    "Memorize four: $1, $# , \"$@\", and $?. Most scripts only need those."),
  L("read.html", "Read a line",
    "read waits for one line and stores it in a variable.",
    [
      "read line < notes.txt takes the first line of notes.txt and stores it in line. echo \"$line\" prints Lab notes. The < is the redirection you already use. read does not receive the file name as an argument.",
      "With no redirect, a real Bash waits for you to type and press Enter. This lab will not wait, and it says so. read -r keeps backslashes as characters. A prompt looks like read -r -p 'Name: ' name."
    ],
    "A loop that reads every line is while IFS= read -r line; do ...; done < file. The IFS= keeps leading spaces. The mapfile lesson stores the lines in an array instead.",
    "readin",
    ["read line < notes.txt", "echo \"$line\""],
    "insight",
    "read takes stdin. The file is a redirect, not an argument.")
];

var afterWhile = [
  L("ifs.html", "The IFS variable",
    "IFS is the list of characters Bash uses to split unquoted text into words. It starts as space, tab, and newline.",
    [
      "An unquoted $var is split on those characters. city='Des Moines' stored as one value becomes two words if you write echo $city on a real Bash. echo \"$city\" stays one word.",
      "Scripts set IFS=: to split on colons, then set it back. This lab keeps an unquoted expansion as one word so a forgotten quote does not scramble the practice files. The safe form you should type is still the quoted one."
    ],
    "IFS= read -r line is the usual way to read a line without trimming it. The empty IFS applies only to that read.",
    "ifs",
    ["city='Des Moines'", "echo \"$city\""],
    "mistake",
    "Leaving $var unquoted because it worked on a value that had no spaces. The next value will.",
    "",
    null,
    "city='Des Moines'\necho $city\necho \"$city\"\nIFS=:\nread -r user _ uid _ <<< \"$row\"")
];

var afterFunctions = [
  L("return-output.html", "Return and output",
    "A function's printed text and its exit code are different channels.",
    [
      "echo inside a function writes to stdout. The caller captures that with value=$(greet ana). return 2 sets the function's exit status and does not print the 2.",
      "After the call, $? is that status. If you echo the status, you mix it into the text the next command will read. Keep data on stdout and success or failure in the status."
    ],
    "return is not echo. echo is not return. A function can do both: print a value, then return 0.",
    "retout",
    [],
    "insight",
    "Capture stdout when you want the text. Read $? when you want to know whether it worked.",
    "greet() {\n  echo Hello, $1\n  return 2\n}\ngreet ana\necho $?"),
  L("groups.html", "Braces and parentheses",
    "{ } groups commands in this shell. ( ) groups them in a subshell, which is a copy.",
    [
      "A brace group shares variables with the rest of the script. { cd reports; pwd; } moves you, and you stay there. The space after { and the semicolon before } are required.",
      "A parenthesis group is a copy. ( cd reports; pwd ) prints the new folder, then the copy exits and your shell is still where it started. A pipeline also runs the right-hand side in a subshell, which is why variables set there do not survive."
    ],
    "Use braces when you want several commands to share one redirect. Use parentheses when you want the side effects thrown away.",
    "groups",
    ["pwd"],
    "analogy",
    "Braces are a room in this house. Parentheses are a photocopy of the room. Marks on the copy do not touch the original.",
    "",
    null,
    "{ cd reports; pwd; }\npwd\n( cd reports; pwd )\npwd"),
  L("source.html", "Source a file",
    "source runs a file's lines in the current shell. A variable it sets is still set afterward.",
    [
      "source greet.sh is the same idea as typing those lines yourself. The . command is the older spelling: . greet.sh. Both need a path. If the file is not on PATH, write ./greet.sh or the full path.",
      "bash greet.sh is different. That starts a new Bash, runs the file, and throws the copy away. Aliases and variables from that run do not come back. Use source for a library of functions. Use bash when you want isolation."
    ],
    "The practice writes a one-line script and sources it. Reset lab removes that file.",
    "sourcef",
    ["printf 'echo sourced\\n' > greet.sh", "source greet.sh"],
    "insight",
    "source to reuse functions. bash file.sh to run a program and leave your shell alone.")
];

var afterArrays = [
  L("assoc.html", "Associative arrays",
    "An associative array stores a value under a word, not under a number.",
    [
      "declare -A port starts one. port[ssh]=22 stores 22 under the key ssh. ${port[ssh]} reads it back. The key is a string.",
      "Indexed arrays, on the previous page, use 0, 1, 2. Associative arrays need Bash 4 or newer. macOS's old Bash 3.2 does not have them. This lab stores indexed arrays. The example is the real declaration."
    ],
    "Quote the key when it may contain spaces or glob characters: ${port[$name]}.",
    "assoc",
    ["ports=(8080 8443)", "echo ${ports[0]}"],
    "insight",
    "Use an index when the order is the point. Use a key when the name is the point.",
    "",
    null,
    "declare -A port\nport[ssh]=22\nport[http]=80\necho \"${port[ssh]}\""),
  L("array-expand.html", "Expand an array",
    "How you expand an array decides whether each item stays one word.",
    [
      "${ports[0]} is one item. ${ports[@]} is every item. ${#ports[@]} is how many items there are, not the length of the first string.",
      "Always write \"${ports[@]}\". The quotes plus the @ sign keep an item that contains a space as one argument. ${ports[*]} joins them into one string using the first character of IFS. For a list of names you will loop over, @ is the form you want."
    ],
    "The same quoting rule as \"$@\" applies here. @ means each, * means joined.",
    "arrexp",
    [],
    "mistake",
    "Writing ${ports[@]} without quotes and then wondering why a file name with a space became two files.",
    "ports=(8080 8443)\necho ${ports[@]}\necho ${#ports[@]}")
];

var afterStrings = [
  L("mapfile.html", "Read lines into an array",
    "mapfile reads each line of a file into the next slot of an array.",
    [
      "mapfile -t lines < names.txt stores ken, ana, ana, and mina as four items. -t strips the newline from each line. ${lines[0]} is the first name. ${#lines[@]} is 4.",
      "A while read loop does the same job one line at a time and can stop early. mapfile is the shorter form when you want the whole file in memory. This lab does not include mapfile. The read lesson is the form you can run here."
    ],
    "Do not mapfile a multi-gigabyte log. Stream it with read or with grep.",
    "mapfile",
    ["read line < names.txt", "echo \"$line\""],
    "insight",
    "mapfile when the file is small and you will index it. read when you will handle one line and move on.",
    "",
    null,
    "mapfile -t lines < names.txt\necho \"${lines[0]}\"\necho \"${#lines[@]}\"")
];

var afterArgs = [
  L("process-sub.html", "Process substitution",
    "Process substitution turns a command's output into a file name that another command can read.",
    [
      "<(grep ERROR app.log) runs grep and exposes the matching lines as if they were a file. A command that only accepts a path, such as diff, can then read that path.",
      ">(cmd) is the other direction: a file name that, when written, feeds the command. This lab does not create those file names. Pipes remain the tool you practice here. Process substitution is what you reach for when a program has no stdin for the data."
    ],
    "The space between < and ( matters. <( is one operator. < ( with a space is a redirect and a subshell.",
    "procsub",
    ["grep ERROR app.log"],
    "insight",
    "Use a pipe when the next command reads stdin. Use <( ) when it insists on a file name.",
    "",
    null,
    "diff <(sort a.txt) <(sort b.txt)\ngrep ERROR <(cat app.log)")
];

var afterTraps = [
  L("fifo.html", "Named pipes",
    "A named pipe is a file in a folder that passes bytes from one process to another. It does not store them.",
    [
      "mkfifo /tmp/logpipe creates the name. A reader blocked on cat /tmp/logpipe waits. A writer that runs echo hello > /tmp/logpipe unblocks it, and the bytes move across. Nothing is left in the pipe afterward.",
      "ls -l shows a p in the type column for a fifo, where a regular file shows a dash. This lab does not create fifos. Use a normal file or a pipe | when you are practicing here. A fifo is how two long-running programs on one host share a stream without a temporary file."
    ],
    "Someone has to read. A writer with no reader blocks. That surprise is the usual first bug.",
    "fifo",
    ["ls -l notes.txt"],
    "analogy",
    "A regular file is a box. A named pipe is a tube. What you put in one end comes out the other, and the tube stays empty.",
    "",
    null,
    "mkfifo /tmp/logpipe\ncat /tmp/logpipe &\necho hello > /tmp/logpipe")
];

var afterPitfalls = [
  L("parse-ls.html", "Do not parse ls",
    "ls is for your eyes. A script that reads ls output breaks on spaces and odd names.",
    [
      "for f in $(ls) looks convenient and splits names on spaces. A file called my notes.txt becomes two loop items. The shell already expands *.txt into names, safely, before the command runs.",
      "When you need names from a whole tree, use find . -name '*.txt' -print0 and a reader that understands the zero byte. The zero byte is the one character a file name cannot contain."
    ],
    "The classic-mistakes page lists this beside the other quoting bugs. This page is the one to remember while you are looping.",
    "parsels",
    ["echo *.txt"],
    "mistake",
    "Parsing ls -l to get the size. Use stat, or wc -c, on the file you already named."),
  L("strlen.html", "String length",
    "${#name} is how many characters are in the value. ${#ports[@]} is how many items are in the array.",
    [
      "name=ana stores three characters. echo ${#name} prints 3. The hash in front of a plain variable is a length, not a comment. A comment's hash starts a word.",
      "ports=(8080 8443) has two items. echo ${#ports[@]} prints 2. echo ${#ports} is the length of the first item joined into a string, which is a different question. When you mean a count of items, write the [@]."
    ],
    "Length is characters, not bytes, in Bash. A value with multibyte letters can surprise a tool that counts bytes.",
    "strlen",
    ["name=ana", "echo ${#name}", "ports=(8080 8443)", "echo ${#ports[@]}"],
    "mistake",
    "Using ${#ports} when you wanted the number of ports. The [@] is what makes it a count."),
  L("forkbomb.html", "A forkbomb fills the process table",
    "A forkbomb is a program that keeps starting copies of itself until the host cannot start anything else.",
    [
      "Each copy starts more copies. The kernel's list of processes fills. New commands fail. New SSH logins fail. The machine looks hung even though the disks are fine.",
      "You do not need a one-line example to understand the damage, and this page will not print one. People pass those lines around as a joke. Typing one on a shared host, a work laptop, or this lab's real cousin takes the session down for everyone on that machine."
    ],
    "ulimit -u is the cap on how many processes your user may own. This lab reports 256. On a real host a modest cap stops one account from filling the table. If a forkbomb is already running and you still have a shell, kill the parent. If you do not, someone with the console reboots the machine.",
    "forkbomb",
    ["ulimit -u"],
    "caution",
    "Do not run a forkbomb to see what happens. The picture is the lesson. The host does not owe you a second chance.")
];

var promptTopic = {
  id: "prompt",
  title: "Prompt",
  lessons: [
    L("color.html", "Color in the terminal",
      "A terminal paints color when it sees an escape sequence. The sequence is not part of the word.",
      [
        "printf '\\033[32mOK\\033[0m\\n' asks for green, prints OK, then resets. 32 is green, 31 is red, 33 is yellow. 0 clears the style.",
        "This lab's screen stores the characters and does not paint them. On a host the same bytes change the color. Write the reset. A missing reset leaves the rest of the terminal painted."
      ],
      "Do not color a log file that another program will parse. Color is for a person at a terminal. The tty lesson is how you check.",
      "color",
      ["printf 'OK %s\\n' ready"],
      "insight",
      "Color is an escape, the text, and a reset. Skip it when the output is data.",
      "",
      null,
      "printf '\\033[32mOK\\033[0m\\n'\nprintf '\\033[31mFAIL\\033[0m\\n'"),
    L("cursor.html", "Move the cursor",
      "The cursor is a cell on the screen. Escape sequences and tput move it.",
      [
        "tput cup 2 0 moves the cursor to row 2, column 0. tput clear wipes the screen. printf can send the same moves with escapes, but tput looks up the sequence for the terminal you are on.",
        "Scripts that redraw a status line move up a row and write again. This lab does not move the cursor. cat, printf, and the script box stay in a simple log."
      ],
      "A cursor command belongs in an interactive tool. A log line should stay a log line so it can be grepped later.",
      "cursor",
      ["printf 'row %d\\n' 1"],
      "insight",
      "Move the cursor only when a person is watching the screen update."),
    L("tty.html", "Is this a terminal",
      "A script can ask whether its output is a terminal or a pipe.",
      [
        "[ -t 1 ] tests file descriptor 1, which is stdout. Success means a person is at a terminal. Failure means a pipe or a file is the reader, so color and cursor moves would be garbage in the data.",
        "This lab is a page, not a terminal, so [ -t 1 ] fails and $? is 1. That is the honest answer here. On a host, the same test at the prompt succeeds, and the same test inside cmd | cat fails."
      ],
      "Check -t 1 before you add color. Check -t 0 before you call read and expect a person to type.",
      "tty",
      ["[ -t 1 ]", "echo $?"],
      "insight",
      "Color and questions are for a terminal. Plain text is for a pipe."),
    L("ps1.html", "The PS1 prompt",
      "PS1 is the string Bash prints when it is waiting for you to type.",
      [
        "echo \"$PS1\" shows the recipe. \\u is the user, \\h is the host, \\w is the folder, and \\$ is the dollar sign. The lab's visible prompt is ana@lab:~/work$ , built from those pieces.",
        "You can set PS1 for this shell. A new shell forgets it unless the line is in ~/.bashrc. Keep a prompt short enough that a long command still fits."
      ],
      "PS2 is the prompt you see when a quote or a loop is still open. It defaults to >. This lab does not use it.",
      "ps1",
      ["echo \"$PS1\""],
      "analogy",
      "PS1 is the label on the door. It should say who you are and which folder you are standing in.",
      "",
      null,
      "PS1='\\u@\\h:\\w\\$ '\nexport PS1"),
    L("bashrc.html", "Customize Bash",
      "An interactive shell reads ~/.bashrc when it starts. That is where aliases and prompt changes belong.",
      [
        "cat ~/.bashrc shows the alias this lab already saved. A line you add there runs for every new terminal, not for the script you start with bash script.sh. Scripts do not load .bashrc unless you source it.",
        "shopt -s nullglob in .bashrc changes globs for your typing. HISTSIZE is how many commands the shell remembers. Keep secrets out of this file. It is not a password store."
      ],
      "After you edit .bashrc, source ~/.bashrc in the shells that are already open. New shells pick the file up on their own.",
      "bashrc",
      ["cat ~/.bashrc", "shopt"],
      "insight",
      "Interactive tweaks go in .bashrc. Script behavior goes in the script."),
    L("readline.html", "Edit the command line",
      "Readline edits the line you are typing. The keys run before Bash executes anything.",
      [
        "Ctrl-A jumps to the start of the line. Ctrl-E jumps to the end. Ctrl-U deletes from the cursor back to the start. Ctrl-W deletes the word to the left. The practice box on this page honors those four.",
        "Up arrow recalls the previous command. Ctrl-R, on a host, searches history. This lab's up arrow does that recall. Ctrl-R is not wired here. man readline lists the rest, or bind -P on a host."
      ],
      "These keys are not part of your script. They are how you fix a line before you press Enter.",
      "readline",
      ["echo edit-this-line"],
      "insight",
      "Ctrl-A and Ctrl-E are enough to stop retyping a long line.")
  ]
};

var glossary = [
  ["dotfile", "A file whose name starts with a dot. ls hides it until -a.", "hidden.html"],
  ["nullglob", "A shell option. A glob that matches nothing disappears instead of staying literal.", "globopt.html"],
  ["brace expansion", "A list in braces that becomes several words before globs run.", "braces.html"],
  ["printf", "Prints text from a format string. %s is a string. \\n is a newline.", "printf.html"],
  ["command substitution", "A $( ) that runs a command and pastes its output into the line.", "command-sub.html"],
  ["IFS", "The characters Bash uses to split unquoted text. It starts as space, tab, and newline.", "ifs.html"],
  ["PIPESTATUS", "On a real Bash, the exit code of each command in the last pipeline.", "pipe-status.html"],
  ["subshell", "A copy of the shell. Assignments inside ( ) do not change the original.", "groups.html"],
  ["source", "Run a file in the current shell so its variables and functions remain.", "source.html"],
  ["associative array", "A list looked up by a word, created with declare -A.", "assoc.html"],
  ["mapfile", "Read each line of a file into an array.", "mapfile.html"],
  ["process substitution", "A <(command) that exposes a command's output as a file name.", "process-sub.html"],
  ["named pipe", "A fifo. Bytes go in one end and out the other. The file does not keep them.", "fifo.html"],
  ["tty", "A terminal. [ -t 1 ] asks whether stdout is one.", "tty.html"],
  ["PS1", "The string Bash uses to draw the prompt.", "ps1.html"],
  ["forkbomb", "A program that starts copies of itself until the host cannot start new processes.", "forkbomb.html"]
];

module.exports = {
  afterLs: afterLs,
  afterGlobs: afterGlobs,
  afterAlias: afterAlias,
  afterTail: afterTail,
  afterGrep: afterGrep,
  afterCut: afterCut,
  beforeSyntax: beforeSyntax,
  afterVariables: afterVariables,
  afterOperators: afterOperators,
  afterExit: afterExit,
  afterCase: afterCase,
  afterWhile: afterWhile,
  afterFunctions: afterFunctions,
  afterArrays: afterArrays,
  afterStrings: afterStrings,
  afterArgs: afterArgs,
  afterTraps: afterTraps,
  afterPitfalls: afterPitfalls,
  promptTopic: promptTopic,
  glossary: glossary
};

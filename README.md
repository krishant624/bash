# Bash

A visual course for the Bash you type on a Linux host. It follows the same path as a short command list, then stays longer on the ideas that list skips: pipes, globs, links, find, PATH, quotes, exit status, and why `chown` fails when you are not root. Later lessons cover `case`, getopts, traps, flock, jq, globs and braces, the prompt, and finished project scripts under `scripts/`.

The course has 16 topics and 207 lessons:

- Start, Files, and Text: the terminal, vi and nano, links, redirection, find, grep, regex, sed, awk, and xargs.
- Archives: gzip, bzip2, xz, tar, zip, 7z, and rsync backups.
- Users and Permissions: root, useradd, usermod, password ageing, sudo, setuid, setgid, the sticky bit, ACLs, and file attributes.
- Processes: ps, top, nice, kill, jobs, screen, and tmux.
- Bash and Shell setup: syntax, environment, startup files, PATH, history, and the prompt.
- Schedule: time zones, date maths, cron, anacron, at, and systemd timers.
- Disks, LVM, ZFS, and LUKS: the file system tree, USB mounts, fstab, partitions, dd, SMART, volume groups, RAID levels, snapshots, ZFS pools, and encrypted disks.

Each lesson is its own page, with a diagram, a worked example, and a practice terminal. The terminal is a computer drawn in the page, with spare disks to partition, pool, and encrypt. It is not your PC, and it never touches the files on the machine you are reading on. Some lessons add a calculator: permission bits, RAID capacity, or a cron line read out in plain words.

Keys: `/` searches lesson titles, the left and right arrows move to the previous and next lesson, and Ctrl with plus or minus changes the zoom, which stays the same on every lesson.

**Live site:** https://krishant624.github.io/bash/

[Download the full lesson guide](https://github.com/krishant624/bash/archive/refs/heads/main.zip)

Unzip the file and open `index.html`.

Project scripts in `scripts/` are meant for a VM, WSL, or disposable directory. Read each file's usage line before you run it.

var base = require("./more-lessons.js");
var L = base.L;
var W = base.W;

var lvSetup = ["sudo pvcreate /dev/sdc /dev/sdd", "sudo vgcreate data /dev/sdc /dev/sdd", "sudo lvcreate -n docs -L 5G data"];
var lvMounted = lvSetup.concat(["sudo mkfs.ext4 -q /dev/data/docs", "sudo mkdir /mnt/docs", "sudo mount /dev/data/docs /mnt/docs"]);
var pool = ["sudo zpool create tank mirror /dev/sdc /dev/sdd"];

var scheduleFront = [
  L("timedate.html", "Time zones and the system clock",
    "The kernel keeps time in UTC. A time zone only changes how it is shown. timedatectl shows and sets the zone and the network time sync.",
    [
      "date prints the local time. date -u prints UTC. TZ=America/New_York date shows another zone for one command. timedatectl shows local time, UTC, the zone, and whether NTP keeps the clock right.",
      "sudo timedatectl set-timezone Asia/Tokyo changes the host's zone, which is a link at /etc/localtime. timedatectl list-timezones prints the valid names. Servers are often left on UTC so logs from different places line up."
    ],
    "Clock drift breaks TLS, Kerberos, and log correlation. If timedatectl says System clock synchronized: no, fix that before chasing other errors.",
    "timezones",
    ["date", "date -u", "TZ=America/New_York date", "TZ=Asia/Kathmandu date +%R", "timedatectl", "timedatectl list-timezones", "sudo timedatectl set-timezone Asia/Tokyo", "date"],
    "insight",
    "Store and log in UTC. Convert to a local zone only when a person reads it."),
  L("date-math.html", "Date arithmetic with date -d",
    "date -d reads a time description and prints it in any format. That gives you yesterday, next Friday, or a timestamp's date without any maths.",
    [
      "date -d tomorrow, date -d '3 days ago', and date -d '2026-12-25' all work. +%F prints 2026-11-02 style, +%A the weekday, +%s seconds since 1970.",
      "date -d @1700000000 converts a Unix timestamp back to a date. In a script, backup-$(date +%F).tar.gz gives each day's file its own name, and the names sort in date order."
    ],
    "This is GNU date. On macOS and BSD, date -d does not exist. Use date -v-1d there, or install coreutils.",
    "datemath",
    ["date -d tomorrow +%F", "date -d '3 days ago' +%F", "date -d 2026-12-25 +%A", "date +%s", "date -u -d @0", "echo backup-$(date +%F).tar.gz"],
    "insight",
    "Use %F in file names. Year-month-day sorts correctly as plain text, and day-month-year does not."),
];

var afterCron = [
  W(L("cron-more.html", "Write and install a crontab",
    "A crontab line is five time fields and a command. Lists, ranges, and steps cover most schedules. crontab - installs a table from standard input.",
    [
      "1-5 in the day-of-week field means Monday to Friday. 0,30 in the minute field means on the hour and half past. */15 means every 15 minutes. @reboot, @daily, and @weekly are shortcuts.",
      "(crontab -l; echo 'line') | crontab - appends a line without opening an editor, which suits scripts. crontab refuses a table with a bad field and keeps the old one. /etc/crontab and /etc/cron.d have a sixth field, the user."
    ],
    "Cron mails output to the user, or drops it. Redirect each job: >> /home/ana/backup.log 2>&1, so a failure leaves a trace you can read.",
    "cronmore",
    ["crontab -l", "(crontab -l; echo '30 2 * * 1-5 /home/ana/backup.sh >> /home/ana/backup.log 2>&1') | crontab -", "crontab -l", "echo '61 * * * * date' | crontab -", "cat /etc/crontab"],
    "mistake",
    "A job that works in your shell and fails in cron, because cron's PATH is short. Use full paths, or set PATH at the top of the crontab.",
    "",
    { headers: ["Line", "Runs"], rows: [["*/15 * * * *", "every 15 minutes"], ["0 2 * * *", "02:00 every day"], ["30 6 * * 1-5", "06:30 Monday to Friday"], ["0 0 1 * *", "midnight on the 1st"], ["@reboot", "once at boot"]] }), "cron"),
  L("anacron.html", "anacron for machines that sleep",
    "cron skips a job if the machine was off at that minute. anacron runs daily, weekly, and monthly jobs late instead of never.",
    [
      "/etc/anacrontab lines are period in days, delay in minutes, a job id, and the command. 1 5 cron.daily means: if the daily job has not run for a day, wait 5 minutes after start, then run it.",
      "anacron stores the last run date of each job in /var/spool/anacron. On laptops and desktops, the system's /etc/cron.daily scripts are usually run this way. anacron -T checks the file's syntax."
    ],
    "anacron works in days, not minutes. For anything more frequent than daily, use cron or a systemd timer.",
    "anacron",
    ["cat /etc/anacrontab", "anacron -T", "ls /etc/cron.daily /etc/cron.weekly"],
    "insight",
    "Drop a script into /etc/cron.daily and it runs once a day, through anacron, even on a machine that sleeps at night."),
  L("at.html", "Run once later with at",
    "at runs a command once, at a time you name. atq lists waiting jobs and atrm removes one.",
    [
      "echo 'cmd' | at now + 5 minutes queues one job. at 23:30, at noon tomorrow, and at 09:00 Friday all work. Each job gets a number. at -c 1 shows exactly what job 1 will run, including the saved environment.",
      "batch is the cousin of at. It runs the job when the load average drops, which suits heavy one-off work."
    ],
    "at saves the current folder and environment with the job. Run it from the folder the command expects, or use absolute paths.",
    "at",
    ["echo 'df -h > /tmp/disk.txt' | at now + 5 minutes", "echo 'tar -czf /tmp/w.tgz /home/ana/work' | at 23:30", "atq", "atrm 1", "atq"],
    "insight",
    "Use at for a one-time reminder or a change that must happen at night. Use cron when it repeats."),
  L("timers.html", "systemd timers",
    "A systemd timer starts a service on a schedule. It can run missed jobs after a reboot, add a random delay, and log through the journal.",
    [
      "systemctl list-timers shows each timer, when it fires next, and when it last fired. systemctl cat backup.timer prints the unit file. OnCalendar is the schedule. Persistent=true runs a missed job at the next boot.",
      "OnCalendar uses a readable form: daily, Mon..Fri 06:00, *-*-* 02:30:00. systemd-analyze calendar checks a form and prints when it would next fire."
    ],
    "The timer only says when. The matching .service file says what. A timer called backup.timer starts backup.service.",
    "timers",
    ["systemctl list-timers", "systemctl cat backup.timer", "systemctl status backup.timer", "systemd-analyze calendar 'Mon..Fri 06:00'", "systemd-analyze calendar daily"],
    "insight",
    "Test every OnCalendar line with systemd-analyze calendar before you enable it.",
    "",
    { headers: ["", "cron", "systemd timer"], rows: [["schedule", "five fields", "OnCalendar, readable"], ["missed while off", "skipped", "Persistent=true runs it"], ["logs", "mail or your redirect", "journalctl -u name"], ["limits and sandboxing", "none", "any service option"]] }),
  L("timer-unit.html", "Write your own timer",
    "A timer is two small unit files: a .service with the command, and a .timer with the schedule. daemon-reload reads them. enable --now starts the timer.",
    [
      "Put both files in /etc/systemd/system. The service usually has Type=oneshot and ExecStart with an absolute path. The timer has OnCalendar and [Install] WantedBy=timers.target.",
      "sudo systemctl daemon-reload, then sudo systemctl enable --now backup.timer. journalctl -u backup.service shows each run's output. systemctl start backup.service runs the job once right now, to test it."
    ],
    "Run the service by hand first. If systemctl start backup.service fails, the timer will fail the same way every night.",
    "timerunit",
    ["systemctl cat backup.service", "sudo systemctl daemon-reload", "sudo systemctl enable --now backup.timer", "systemctl is-enabled backup.timer", "systemctl is-active backup.timer", "journalctl -u backup.service"],
    "insight",
    "Name the pair after the job. backup.timer and backup.service are easy to find in list-timers and in the journal.",
    "",
    null,
    "# /etc/systemd/system/backup.service\n[Unit]\nDescription=Nightly backup of /home\n\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh /home /srv/backup 7\n\n# /etc/systemd/system/backup.timer\n[Unit]\nDescription=Nightly backup of /home\n\n[Timer]\nOnCalendar=*-*-* 02:30:00\nPersistent=true\nRandomizedDelaySec=5min\n\n[Install]\nWantedBy=timers.target"),
];

var disksFront = [
  L("fhs.html", "The Linux file system tree",
    "Linux has one tree that starts at /. Disks, USB sticks, and network shares are attached to folders in that tree. Each top folder has a job.",
    [
      "/etc holds configuration, /home holds users' files, /var holds data that changes, such as logs in /var/log, and /usr/bin holds programs. /tmp is scratch space for everyone. /root is root's home.",
      "/dev holds device files, such as /dev/sda for the first disk. /mnt and /media are where you attach other filesystems. /proc and /sys are views into the kernel, not files on a disk."
    ],
    "When a disk fills up, the usual suspects are /var/log, /var/lib, /home, and /tmp. Knowing the map tells you where to look first.",
    "fhs",
    ["ls /", "ls /etc", "ls -ld /tmp /root", "ls /dev/disk/by-id", "cat /etc/hostname"],
    "insight",
    "Configuration in /etc, logs in /var/log, programs in /usr/bin. Those three cover most troubleshooting.",
    "",
    { headers: ["Folder", "What lives there"], rows: [["/etc", "configuration files"], ["/home", "users' files"], ["/root", "root's home"], ["/var/log", "logs"], ["/usr/bin", "programs"], ["/tmp", "scratch, often cleared at boot"], ["/dev", "devices, such as disks"], ["/mnt, /media", "places to attach filesystems"], ["/boot", "kernel and boot loader"], ["/proc, /sys", "live kernel information"]] }),
  L("fs-types.html", "Disks, partitions, and filesystems",
    "A disk is split into partitions. A partition holds a filesystem, such as ext4. A filesystem is mounted at a folder. lsblk shows that whole chain.",
    [
      "lsblk lists disks and partitions as a tree with sizes and mount points. lsblk -f adds filesystem type, label, and UUID. sda is the first disk, and sda1 is its first partition.",
      "ext4 is the Linux default. xfs suits large files and is the Red Hat default. vfat and exfat are for USB sticks shared with other systems. findmnt and df -hT show what is mounted where, and as what type."
    ],
    "Device names such as sdb can change between boots. UUIDs and labels do not, which is why fstab uses them.",
    "blockstack",
    ["lsblk", "lsblk -f", "findmnt", "df -hT"],
    "insight",
    "lsblk first, every time you touch a disk. It shows which device is which before you type a command that destroys data."),
];

var afterDu = [
  L("mount-usb.html", "Mount a USB drive",
    "Plug in the drive, find its partition with lsblk, then mount it on an empty folder. Unmount before you pull it out.",
    [
      "The USB stick here is sdb, and its partition sdb1 holds a vfat filesystem labelled USBSTICK. sudo mount /dev/sdb1 /mnt/usb attaches it, and ls /mnt/usb shows its files. Mounting needs root.",
      "sudo umount /mnt/usb detaches it and flushes any data still in memory. If umount says target is busy, a shell or program still has a file open there. cd out of it and try again."
    ],
    "Desktops mount USB drives on their own, under /media/USER. On servers you mount them yourself.",
    "mountusb",
    ["lsblk", "ls /mnt/usb", "mount /dev/sdb1 /mnt/usb", "sudo mount /dev/sdb1 /mnt/usb", "ls /mnt/usb", "df -h /mnt/usb", "sudo umount /mnt/usb", "ls /mnt/usb"],
    "caution",
    "Pulling a drive without umount can lose the last files you copied. They may still be in memory, not yet on the stick."),
  L("fstab.html", "Mount at startup with /etc/fstab",
    "/etc/fstab lists what to mount at boot. Each line names a device, a folder, a type, options, and two numbers.",
    [
      "Use UUID=... for the device, from blkid, so the line still works if the disk becomes sdc one day. nofail lets the host boot even when the device is missing, which matters for USB and network disks.",
      "sudo mount -a mounts every fstab line that is not yet mounted. Run it after every edit. An error now is a message. An error at boot can stop the machine in emergency mode."
    ],
    "The last two numbers are dump (almost always 0) and the fsck order: 1 for /, 2 for other local disks, 0 to skip.",
    "fstab",
    ["cat /etc/fstab", "sudo blkid /dev/sdb1", "echo 'UUID=4E21-9F0A /mnt/usb vfat defaults,nofail 0 0' | sudo tee -a /etc/fstab", "sudo mount -a", "findmnt /mnt/usb", "df -h /mnt/usb"],
    "caution",
    "Test with sudo mount -a before you reboot. A typo in fstab is the classic way to turn a reboot into a console session.",
    "",
    { headers: ["Field", "Example", "Meaning"], rows: [["device", "UUID=4E21-9F0A", "what to mount"], ["mount point", "/mnt/usb", "where"], ["type", "vfat", "filesystem type"], ["options", "defaults,nofail", "mount options"], ["dump", "0", "old backup flag"], ["pass", "0", "fsck order, 0 skips"]] }),
  L("parted.html", "Partition a disk with parted",
    "A partition table divides a disk. GPT is the modern kind, msdos (MBR) is the old one. parted creates the table and the partitions.",
    [
      "sudo parted /dev/sdc mklabel gpt writes a new, empty GPT table. mktable is another name for the same command. This erases every partition on the disk, so check the device name with lsblk first.",
      "mkpart NAME TYPE START END adds a partition. Percentages and MiB both work, and starting at 1MiB keeps it aligned. print shows the result. GParted is the same idea with a graphical window."
    ],
    "GPT allows 128 partitions and disks over 2 TiB, and keeps a backup copy of the table. Use msdos only for old systems that need it.",
    "parted",
    ["sudo parted /dev/sdc print", "sudo parted /dev/sdc mklabel gpt", "sudo parted /dev/sdc mkpart data ext4 1MiB 50%", "sudo parted /dev/sdc mkpart logs ext4 50% 100%", "sudo parted /dev/sdc print", "lsblk"],
    "caution",
    "parted writes changes as soon as you press Enter. There is no save step and no undo."),
  L("mkfs.html", "Make a filesystem and mount it",
    "A new partition is empty bytes. mkfs writes a filesystem onto it. Then you can mount it and store files.",
    [
      "sudo mkfs.ext4 -L data /dev/sdc1 makes an ext4 filesystem with the label data. mkfs.xfs and mkfs.vfat work the same way. mkfs prints the UUID, which you can use in fstab.",
      "Make a folder for it, mount it, and check with df -hT. A fresh filesystem shows a little space used for its own records, such as the journal."
    ],
    "mkfs on the wrong device erases it. The lab refuses to touch sda, the system disk, but a real host will not stop you.",
    "mkfs",
    ["sudo parted /dev/sdc mklabel gpt", "sudo parted /dev/sdc mkpart data ext4 1MiB 100%", "sudo mkfs.ext4 -L data /dev/sdc1", "sudo mkdir -p /srv/data", "sudo mount /dev/sdc1 /srv/data", "df -hT /srv/data", "lsblk -f"],
    "caution",
    "Read the device name in the mkfs command twice. Then read lsblk once more."),
  L("labels.html", "Partition labels and filesystem labels",
    "There are two kinds of label. A GPT partition name lives in the partition table. A filesystem label lives inside the filesystem.",
    [
      "parted name 1 archive sets the partition name, shown as PARTLABEL. e2label /dev/sdc1 ARCHIVE sets an ext4 filesystem label, shown as LABEL. fatlabel does the same for vfat.",
      "mount LABEL=ARCHIVE /mnt/archive finds the filesystem by its label, wherever the disk shows up. lsblk -o NAME,LABEL,PARTLABEL shows both kinds side by side."
    ],
    "Labels are for people. UUIDs are for machines. A label can be duplicated by accident. A UUID is unique.",
    "labels",
    ["sudo parted /dev/sdc mklabel gpt", "sudo parted /dev/sdc mkpart primary ext4 1MiB 100%", "sudo mkfs.ext4 -q /dev/sdc1", "sudo parted /dev/sdc name 1 archive", "sudo e2label /dev/sdc1 ARCHIVE", "lsblk -o NAME,LABEL,PARTLABEL", "sudo mkdir /mnt/archive", "sudo mount LABEL=ARCHIVE /mnt/archive", "findmnt /mnt/archive"],
    "insight",
    "Label USB backup drives. mount LABEL=BACKUP is easier to read in a script than a UUID."),
  L("fdisk.html", "Partition with fdisk",
    "fdisk is the classic interactive partition editor. fdisk -l lists every disk and partition.",
    [
      "sudo fdisk -l prints each disk's size, model, table type, and partitions. sudo fdisk /dev/sdd opens an editor with one-letter commands. Nothing is written until you press w.",
      "Inside fdisk: g makes a GPT table, o an MBR table, n a new partition, p prints, t changes the type, d deletes, w writes and quits, q quits without saving."
    ],
    "sfdisk is the scriptable form. sfdisk -d /dev/sdc > table.txt saves a layout, and sfdisk /dev/sdd < table.txt copies it to another disk.",
    "fdisk",
    ["sudo fdisk -l", "sudo fdisk -l /dev/sdb", "sudo fdisk /dev/sdd"],
    "insight",
    "fdisk keeps changes in memory until w. If you are unsure, q leaves the disk exactly as it was.",
    "",
    { headers: ["Key", "Action"], rows: [["p", "print the table"], ["g / o", "new GPT / MBR table"], ["n", "new partition"], ["d", "delete a partition"], ["t", "change the type"], ["w", "write and quit"], ["q", "quit without saving"]] }),
  L("dd.html", "Copy raw bytes with dd",
    "dd copies bytes from an input to an output, in blocks. It does not care about files or filesystems, which makes it powerful and dangerous.",
    [
      "if= is the input and of= the output. bs= is the block size and count= how many blocks. dd if=/dev/zero of=blank.img bs=1M count=10 makes a 10 MiB file of zeros.",
      "dd if=app.log of=first.txt bs=20 count=1 copies the first 20 bytes. status=progress shows progress on a long copy. When dd ends it prints records in, records out, and the speed."
    ],
    "dd has been nicknamed disk destroyer. Swapping if and of overwrites the source, with no question asked.",
    "dd",
    ["dd if=/dev/zero of=blank.img bs=1M count=10", "ls -lh blank.img", "dd if=app.log of=first.txt bs=20 count=1", "cat first.txt", "dd if=/dev/sda of=disk.img"],
    "caution",
    "Read the of= value out loud before you press Enter. That is the device that will be overwritten."),
  L("dd-more.html", "Image and wipe a drive with dd",
    "dd can copy a whole drive to an image file, write an image to a USB stick, or wipe the start of a disk. Each needs the right device and an unmounted target.",
    [
      "sudo dd if=/dev/sdb of=usb.img bs=4M status=progress saves the stick as a file. Writing an installer is the reverse: sudo dd if=distro.iso of=/dev/sdb bs=4M status=progress conv=fsync.",
      "sudo dd if=/dev/zero of=/dev/sdb bs=1M count=1 zeroes the first megabyte, which erases the partition table. lsblk then shows the stick with no partitions."
    ],
    "Unmount every partition of the target first. Writing under a mounted filesystem corrupts both the image and the filesystem.",
    "ddmore",
    ["lsblk", "sudo dd if=/dev/sdb of=usb-start.img bs=1M count=8", "ls -l usb-start.img", "sudo dd if=/dev/zero of=/dev/sda bs=1M count=1", "sudo dd if=/dev/zero of=/dev/sdb bs=1M count=1", "lsblk -f"],
    "caution",
    "Write to the whole device, /dev/sdb, when you flash an image. Writing to /dev/sdb1 puts it inside a partition and the stick will not boot."),
  L("smart.html", "Check disk health with smartctl",
    "Drives keep health counters called SMART. smartctl from smartmontools reads them, so you can replace a drive before it fails.",
    [
      "sudo smartctl -H /dev/sdc gives an overall PASSED or FAILED. -A prints the attribute table. -t short starts a quick self-test, and -l selftest shows the results later.",
      "Watch Reallocated_Sector_Ct, Current_Pending_Sector, and Offline_Uncorrectable. Non-zero and growing means the drive is remapping bad areas. Here sdf is the worn one. smartd can watch drives and send mail."
    ],
    "PASSED only means no attribute crossed the maker's threshold. A drive with hundreds of reallocated sectors can still say PASSED. Read the raw numbers.",
    "smart",
    ["sudo smartctl --scan", "sudo smartctl -H /dev/sdc", "sudo smartctl -A /dev/sdf", "sudo smartctl -t short /dev/sdc", "sudo smartctl -l selftest /dev/sdc"],
    "caution",
    "A growing pending sector count is a warning to copy your data off now, not after the next reboot.",
    "",
    { headers: ["Attribute", "What it counts", "Healthy"], rows: [["5 Reallocated_Sector_Ct", "sectors moved to spares", "0"], ["197 Current_Pending_Sector", "sectors waiting to be remapped", "0"], ["198 Offline_Uncorrectable", "sectors that could not be read", "0"], ["194 Temperature_Celsius", "drive temperature", "under about 50"], ["9 Power_On_Hours", "age in hours", "any"]] }),
];

var lvmTopic = {
  id: "lvm",
  title: "LVM",
  lessons: [
    L("lvm.html", "What LVM adds",
      "LVM puts a flexible layer between disks and filesystems. Disks become physical volumes, they pool into a volume group, and you cut logical volumes from the pool.",
      [
        "A PV (physical volume) is a disk or partition prepared for LVM. A VG (volume group) pools one or more PVs. An LV (logical volume) is a slice of the VG that you format and mount, like a partition.",
        "The pool is counted in extents, 4 MiB each by default. An LV can span disks, grow while mounted, take a snapshot, or mirror itself. A partition can do none of that."
      ],
      "Here a 12 GiB volume is cut from two 10 GiB disks. No single disk was big enough, and lvs -o +devices shows it spanning both.",
      "lvmstack",
      ["sudo pvcreate /dev/sdc /dev/sdd", "sudo vgcreate data /dev/sdc /dev/sdd", "sudo lvcreate -n docs -L 12G data", "sudo lvs -o +devices", "lsblk"],
      "analogy",
      "PVs are bank deposits, the VG is the account, and LVs are what you spend. Add a deposit and you can spend more, without closing the account."),
    L("lvm-create.html", "Create a volume group and a logical volume",
      "Three commands build an LVM volume: pvcreate, vgcreate, lvcreate. pvs, vgs, and lvs check each step.",
      [
        "sudo pvcreate /dev/sdc /dev/sdd marks the disks. sudo vgcreate data /dev/sdc /dev/sdd pools them into a VG named data. sudo lvcreate -n docs -L 5G data cuts a 5 GiB LV named docs.",
        "The new LV appears as /dev/data/docs and /dev/mapper/data-docs. -L takes a size. -l takes extents or a percentage, such as -l 100%FREE for everything left."
      ],
      "vgcreate runs pvcreate for you when a disk is not a PV yet. Doing it as a separate step makes the output easier to read the first time.",
      "lvmcreate",
      ["sudo pvcreate /dev/sdc /dev/sdd", "sudo pvs", "sudo vgcreate data /dev/sdc /dev/sdd", "sudo vgs", "sudo lvcreate -n docs -L 5G data", "sudo lvs"],
      "insight",
      "Leave free space in the VG. Growing an LV later is easy. Shrinking one is slow and risky."),
    L("lvm-remove.html", "Format, mount, and take it apart",
      "An LV is formatted and mounted like any partition. Taking LVM apart runs the steps in reverse: unmount, lvremove, vgremove, pvremove.",
      [
        "mkfs.ext4 /dev/data/docs, then mount it. df shows the LV under its mapper name, /dev/mapper/data-docs.",
        "lvremove refuses while the volume is mounted. After umount, lvremove -y removes it, vgremove removes the group, and pvremove clears the LVM label from each disk."
      ],
      "Remove the fstab line before you remove the LV, or the next boot will wait for a device that no longer exists.",
      "lvmremove",
      lvSetup.concat(["sudo mkfs.ext4 -q /dev/data/docs", "sudo mkdir /mnt/docs", "sudo mount /dev/data/docs /mnt/docs", "df -h /mnt/docs", "sudo lvremove /dev/data/docs", "sudo umount /mnt/docs", "sudo lvremove -y /dev/data/docs", "sudo vgremove data", "sudo pvremove /dev/sdc /dev/sdd"]),
      "caution",
      "lvremove destroys the data on that volume. There is no recycle bin."),
    L("lvm-inspect.html", "A closer look with pvdisplay, vgdisplay, lvdisplay",
      "The display commands print every detail: sizes in extents, free space, UUIDs, and which disks hold which parts of each LV.",
      [
        "pvdisplay shows each PV's size, allocated and free extents, and its VG. vgdisplay shows the pool's total and free space. lvdisplay shows each LV's path, size, and status.",
        "lvdisplay -m adds the mapping: which extents on which PV hold the volume. lvs -o +devices is the one-line version of the same answer."
      ],
      "pvs, vgs, and lvs are the short forms to use every day. The display commands are for when you need a number the short forms leave out.",
      "lvminspect",
      lvSetup.concat(["sudo pvdisplay", "sudo vgdisplay", "sudo lvdisplay -m"]),
      "insight",
      "Before you add or remove a disk, read lvdisplay -m. It tells you which volumes live on that disk."),
    L("lvm-extend.html", "Grow a volume",
      "Growing is two steps: make the LV bigger, then make the filesystem fill it. lvextend -r does both. If the VG is full, add a disk with vgextend first.",
      [
        "lvextend -L +4G asks for 4 GiB more. With no free space in the VG it fails. sudo vgextend data /dev/sdd adds a disk to the pool, and the same lvextend then works.",
        "Without -r, df still shows the old size, because the filesystem has not grown. resize2fs grows ext4. xfs_growfs grows xfs, and takes the mount point. Both work while the filesystem is mounted."
      ],
      "ext4 can shrink, but only while unmounted. xfs cannot shrink at all. Plan sizes so you only ever grow.",
      "lvmextend",
      ["sudo pvcreate /dev/sdc", "sudo vgcreate data /dev/sdc", "sudo lvcreate -n docs -L 8G data", "sudo mkfs.ext4 -q /dev/data/docs", "sudo mkdir /mnt/docs", "sudo mount /dev/data/docs /mnt/docs", "df -h /mnt/docs", "sudo lvextend -L +4G /dev/data/docs", "sudo vgextend data /dev/sdd", "sudo lvextend -L +4G /dev/data/docs", "df -h /mnt/docs", "sudo resize2fs /dev/data/docs", "df -h /mnt/docs"],
      "mistake",
      "Running lvextend and then wondering why df did not change. The filesystem needs its own resize, or use -r."),
    W(L("lvm-raid1.html", "Mirror with RAID 1",
      "A RAID 1 logical volume keeps two copies on two different disks. If one disk dies, the volume keeps working from the other.",
      [
        "sudo lvcreate --type raid1 -m 1 -n safe -L 4G data asks for one extra copy. lvs -a shows the hidden image and metadata volumes, and +devices shows them on separate disks.",
        "A 4 GiB mirror uses 8 GiB of the pool, plus a little metadata. Cpy%Sync shows the copies being synchronized after creation."
      ],
      "RAID protects against a disk failing. It does not protect against rm, corruption written by software, or ransomware. Those need backups or snapshots.",
      "raid1",
      ["sudo vgcreate data /dev/sdc /dev/sdd", "sudo lvcreate --type raid1 -m 1 -n safe -L 4G data", "sudo lvs -a -o +devices", "sudo vgs"],
      "caution",
      "A mirror doubles the cost of every gigabyte. Use it for the data that must stay online when a disk dies."), "raid"),
    W(L("lvm-raid0.html", "Stripe with RAID 0",
      "RAID 0 splits data across disks in stripes. Reads and writes use every disk at once, so it is fast. Lose one disk and you lose the whole volume.",
      [
        "sudo lvcreate --type raid0 -i 2 -n fast -L 8G data stripes across two disks. Each disk holds half. lvs -a -o +devices shows one hidden image on each disk.",
        "Capacity is the full sum. There is no copy and no parity, so the chance of losing data grows with every disk you add."
      ],
      "Use RAID 0 for scratch data you can recreate, such as a build cache or a temporary data set. Never for the only copy of anything.",
      "raid0",
      ["sudo vgcreate data /dev/sdc /dev/sdd", "sudo lvcreate --type raid0 -i 2 -n fast -L 8G data", "sudo lvs -a -o +devices", "sudo vgs"],
      "caution",
      "The 0 in RAID 0 is the amount of redundancy."), "raid"),
    W(L("lvm-linear-raid.html", "Linear or RAID?",
      "A plain LV is linear: it fills one disk, then the next. RAID types change speed, safety, and how much space each gigabyte costs.",
      [
        "Here one VG holds three kinds side by side: a linear volume, a RAID 1 mirror, and a RAID 0 stripe. lvs -a -o +devices shows how each lays its data on the disks, including the hidden RAID images. vgs shows how much each took from the pool.",
        "Linear is the default and the most flexible. It survives nothing, like RAID 0, but at least losing a disk only loses the parts stored on that disk."
      ],
      "You can convert later. lvconvert --type raid1 -m 1 turns a linear LV into a mirror if the VG has room.",
      "linearraid",
      ["sudo vgcreate data /dev/sdc /dev/sdd /dev/sde", "sudo lvcreate -n plain -L 4G data", "sudo lvcreate --type raid1 -m 1 -n mirror -L 4G data", "sudo lvcreate --type raid0 -i 3 -n stripe -L 3G data", "sudo lvs -a -o +devices", "sudo vgs"],
      "insight",
      "Choose by asking what happens when one disk dies tonight. Then pick the cheapest type whose answer you can live with.",
      "",
      { headers: ["Type", "Disks", "Usable", "Survives", "Speed"], rows: [["linear", "1+", "all", "nothing", "one disk"], ["raid0", "2+", "all", "nothing", "fast"], ["raid1", "2", "half", "one disk", "fast reads"], ["raid5", "3+", "all but one", "one disk", "good reads, slower writes"]] }), "raid"),
    W(L("lvm-raid5.html", "Parity with RAID 5",
      "RAID 5 stripes data across disks and adds one parity block per stripe. Any one disk can fail, and the data is rebuilt from the others.",
      [
        "sudo lvcreate --type raid5 -i 2 -n parity -l 100%FREE data uses three disks: two data stripes and one parity. Usable space is two disks' worth out of three.",
        "Writes are slower than RAID 1, because parity must be calculated. A rebuild after a failure reads every remaining disk, which stresses them at the worst moment."
      ],
      "With large disks, a second failure during the rebuild is a real risk. RAID 6, with two parity blocks, survives two failures.",
      "raid5",
      ["sudo vgcreate data /dev/sdc /dev/sdd /dev/sde", "sudo lvcreate --type raid5 -i 2 -n parity -l 100%FREE data", "sudo lvs -a -o +devices", "sudo vgs"],
      "insight",
      "RAID 5 gives the most space for one disk of protection. Check SMART on the other disks the day one fails."), "raid"),
    L("lvm-ubuntu.html", "LVM in the Ubuntu installer",
      "Ubuntu's installer can put the root filesystem on LVM. It names the group ubuntu-vg and the volume ubuntu-lv, and it often leaves half the disk unused.",
      [
        "After install, df shows / much smaller than the disk. vgs shows the free space still in ubuntu-vg. sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv grows the volume and the filesystem in one step.",
        "Hyphens in VG and LV names are doubled in the mapper name, so the device appears as /dev/mapper/ubuntu--vg-ubuntu--lv. Here sdc stands in for the system disk."
      ],
      "Leaving space is deliberate. It is room for snapshots or a separate volume. Grow / only when you need to, and only by what you need.",
      "ubuntulvm",
      ["sudo vgcreate ubuntu-vg /dev/sdc", "sudo lvcreate -n ubuntu-lv -L 5G ubuntu-vg", "sudo mkfs.ext4 -q /dev/ubuntu-vg/ubuntu-lv", "sudo vgs", "sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv", "sudo lvs", "lsblk"],
      "insight",
      "If a new Ubuntu server says its disk is full at 50 percent of the drive, check vgs before you buy a bigger disk."),
    L("lvm-snapshot.html", "Take an LVM snapshot",
      "An LVM snapshot freezes a volume at one moment. It starts empty and stores the old version of each block that changes afterwards.",
      [
        "sudo lvcreate -s -n before -L 1G /dev/data/docs takes the snapshot. The 1G is room for changes, not a full copy. lvs shows Data% filling as the original changes.",
        "Mount the snapshot somewhere else and you can read the old files while the original keeps changing. That gives a backup tool a consistent view to copy from."
      ],
      "A snapshot that fills to 100 percent becomes invalid. Size it for the changes you expect while it exists, and remove it when you are done.",
      "snapshot",
      lvMounted.concat(["echo 'version 1' | sudo tee /mnt/docs/plan.txt", "sudo lvcreate -s -n before -L 1G /dev/data/docs", "echo 'version 2' | sudo tee /mnt/docs/plan.txt", "sudo lvs", "sudo mkdir /mnt/before", "sudo mount /dev/data/before /mnt/before", "cat /mnt/before/plan.txt", "cat /mnt/docs/plan.txt"]),
      "insight",
      "Take a snapshot right before an upgrade. If the upgrade goes wrong, the next lesson rolls back."),
    L("lvm-restore.html", "Roll back to a snapshot",
      "lvconvert --merge rolls the original back to the snapshot. If the origin is in use, the merge waits until the volume is next activated.",
      [
        "After a bad change, sudo lvconvert --merge /dev/data/before schedules the rollback. The volume is mounted, so LVM delays it. Unmount, deactivate with lvchange -an, and activate with lvchange -ay to start it.",
        "When the merge finishes, the snapshot is gone and the original holds the old data again. Mount it and check."
      ],
      "For a root filesystem the merge happens at the next reboot. That is how a failed OS upgrade is undone.",
      "restore",
      lvMounted.concat(["echo 'good config' | sudo tee /mnt/docs/plan.txt", "sudo lvcreate -s -n before -L 1G /dev/data/docs", "sudo rm /mnt/docs/plan.txt", "sudo lvconvert --merge /dev/data/before", "sudo umount /mnt/docs", "sudo lvchange -an data/docs", "sudo lvchange -ay data/docs", "sudo mount /dev/data/docs /mnt/docs", "cat /mnt/docs/plan.txt", "sudo lvs"]),
      "caution",
      "A merge throws away every change made after the snapshot, the good ones too. Copy out anything you want to keep first.")
  ]
};

var zfsTopic = {
  id: "zfs",
  title: "ZFS",
  lessons: [
    L("zfs.html", "ZFS pools: start with a mirror",
      "ZFS is a volume manager and a filesystem in one. A pool is built from disks, and the filesystem is ready to use as soon as the pool exists.",
      [
        "sudo zpool create tank mirror /dev/sdc /dev/sdd builds a pool named tank from two mirrored disks and mounts it at /tank. No mkfs and no fstab line are needed.",
        "zpool status shows the layout and the health of each disk. zpool list shows raw size. zfs list shows usable space and the datasets. Every block has a checksum, so ZFS notices when a disk returns bad data."
      ],
      "On Ubuntu the tools are in the zfsutils-linux package. Other distributions need the OpenZFS packages.",
      "zfsmirror",
      ["lsblk", "sudo zpool create tank mirror /dev/sdc /dev/sdd", "zpool status", "zpool list", "zfs list", "df -h /tank"],
      "insight",
      "A mirror is the simplest pool to grow. Add another mirror pair later and the pool gets bigger."),
    L("zfs-ids.html", "Name disks by id, not sdX",
      "Build pools from /dev/disk/by-id names. They include the model and serial number, so they never change between boots.",
      [
        "ls -l /dev/disk/by-id shows links such as ata-LAB_HDD_10G_SN1001, each pointing at a current sdX name. Use those paths in zpool create.",
        "zpool status then shows the serials, so when a disk fails you know which physical drive to pull. ZFS also tags each disk with the pool's GUID, so it can find them even if names move."
      ],
      "A pool built with sdb and sdc may still import after names change. Serial-based names make status and replacement much clearer.",
      "byid",
      ["ls -l /dev/disk/by-id", "sudo zpool create tank mirror /dev/disk/by-id/ata-LAB_HDD_10G_SN1001 /dev/disk/by-id/ata-LAB_HDD_10G_SN1002", "zpool status"],
      "insight",
      "Label each drive bay with the serial number you see in zpool status. Then a failed disk is a two-minute swap, not a guess."),
    W(L("zfs-raidz.html", "RAIDZ: parity across disks",
      "RAIDZ spreads data and parity across three or more disks. raidz survives one disk failure, raidz2 survives two, and raidz3 survives three.",
      [
        "sudo zpool create tank raidz sdc sdd sde makes a pool with one disk's worth of parity. zpool list shows the raw total. zfs list shows the usable space, about two disks' worth.",
        "Unlike classic RAID 5, ZFS writes whole stripes and checksums every block, so it avoids the write hole. Rebuilds, called resilvers, copy only used data."
      ],
      "A RAIDZ group cannot easily grow by one disk on older OpenZFS. Plan the width up front, or add whole new groups later.",
      "raidz",
      ["sudo zpool create tank raidz sdc sdd sde", "zpool status", "zpool list", "zfs list"],
      "insight",
      "raidz2 is the common choice for large disks, because a second failure during a long resilver is not rare."), "raid"),
    L("zfs-datasets.html", "Datasets instead of folders",
      "A dataset looks like a folder but is its own filesystem inside the pool. Each one can have its own snapshots, quota, and settings.",
      [
        "sudo zfs create tank/home makes a dataset mounted at /tank/home. Datasets nest: tank/home/ana. They all share the pool's free space unless you set limits.",
        "zfs list shows each dataset's used and available space. df shows each as a separate filesystem, because it is one."
      ],
      "Make a dataset wherever you want separate snapshots or limits: per user, per application, per database.",
      "datasets",
      pool.concat(["sudo zfs create tank/home", "sudo zfs create tank/home/ana", "sudo zfs create tank/backups", "zfs list", "ls /tank", "df -h | grep tank"]),
      "insight",
      "A snapshot covers one dataset. Splitting data into datasets lets you roll back one application without touching the others."),
    L("zfs-props.html", "Properties: compression, quota, mountpoint",
      "Every dataset has properties. Children inherit them from their parent unless they set their own.",
      [
        "sudo zfs set compression=lz4 tank turns on fast compression for the pool and everything under it. zfs get compression shows the value and whether it was set locally or inherited.",
        "quota=2G caps a dataset. mountpoint=/srv/logs moves where it appears in the tree, with no fstab change needed."
      ],
      "lz4 compression is almost always a win. It is cheap on CPU, and smaller writes often make the disk faster.",
      "zfsprops",
      pool.concat(["sudo zfs create tank/logs", "sudo zfs set compression=lz4 tank", "zfs get compression tank tank/logs", "sudo zfs set quota=2G tank/logs", "zfs list", "sudo zfs set mountpoint=/srv/logs tank/logs", "zfs list", "df -h /srv/logs"]),
      "insight",
      "Set compression on the pool's top dataset once. Every new dataset inherits it."),
    L("zfs-snapshot.html", "ZFS snapshots and rollback",
      "A ZFS snapshot is instant and takes no space at first. zfs rollback returns a dataset to that moment.",
      [
        "sudo zfs snapshot tank/docs@monday names a snapshot after the @. zfs list -t snapshot lists them, with the space each one holds for blocks that changed since.",
        "sudo zfs rollback tank/docs@monday throws away every change since. To roll back past newer snapshots you need -r, which destroys them. Single files can also be copied out of the hidden /tank/docs/.zfs/snapshot folder."
      ],
      "Snapshots live in the same pool. They protect against mistakes, not against losing the pool. Use zfs send to copy them to another machine.",
      "zfssnap",
      pool.concat(["sudo zfs create tank/docs", "echo v1 | sudo tee /tank/docs/plan.txt", "sudo zfs snapshot tank/docs@monday", "echo v2 | sudo tee /tank/docs/plan.txt", "zfs list -t snapshot", "sudo zfs rollback tank/docs@monday", "cat /tank/docs/plan.txt"]),
      "insight",
      "Take snapshots on a timer and keep a rotating set: hourly for a day, daily for a month. Tools such as sanoid do exactly that."),
    L("zfs-clone.html", "Clones: a writable copy of a snapshot",
      "A clone is a new dataset that starts as a snapshot. It is instant, and it uses space only for what you change in it.",
      [
        "sudo zfs clone tank/docs@monday tank/test makes /tank/test with Monday's files. Change it freely. The original dataset is untouched.",
        "The snapshot cannot be destroyed while a clone depends on it. Destroy the clone first, or use zfs promote to make the clone independent."
      ],
      "Clones are ideal for testing an upgrade on a copy of real data, then throwing the copy away.",
      "clone",
      pool.concat(["sudo zfs create tank/docs", "echo v1 | sudo tee /tank/docs/plan.txt", "sudo zfs snapshot tank/docs@monday", "sudo zfs clone tank/docs@monday tank/test", "echo trial | sudo tee /tank/test/plan.txt", "cat /tank/docs/plan.txt", "zfs list", "sudo zfs destroy tank/docs@monday", "sudo zfs destroy tank/test", "sudo zfs destroy tank/docs@monday"]),
      "insight",
      "Clone, test, destroy. The whole cycle takes seconds, whatever the size of the data."),
    L("zfs-scrub.html", "Scrub: read everything, fix what is wrong",
      "A scrub reads every block in the pool and checks its checksum. With a mirror or RAIDZ, bad blocks are repaired from a good copy.",
      [
        "sudo zpool scrub tank starts it. zpool status tank shows progress and, when done, how much was repaired and whether any errors remain.",
        "Schedule a scrub monthly. Many distributions ship a timer or cron job for it. A scrub finds silent damage before you need those files."
      ],
      "CKSUM errors in zpool status on one disk mean that disk is returning bad data. Check its SMART data, then plan a replacement.",
      "scrub",
      pool.concat(["sudo zpool scrub tank", "zpool status tank"]),
      "insight",
      "A scrub on a pool with no redundancy can find errors but not fix them. Mirrors and RAIDZ are what make repair possible.",
      "",
      null,
      "# root's crontab: scrub at 03:00 on the 1st of every month\n0 3 1 * * /usr/sbin/zpool scrub tank")
  ]
};

var luksTopic = {
  id: "luks",
  title: "LUKS",
  lessons: [
    L("luks.html", "Encrypt a disk with LUKS",
      "LUKS encrypts a whole disk or partition. Without the passphrase, the data is random bytes. With it, the kernel opens a decrypted device you format and mount as usual.",
      [
        "A LUKS header at the start of the disk holds key slots. The data is encrypted with one master key. Each slot holds a copy of that key, locked by a different passphrase. That is why you can add or change passphrases without re-encrypting.",
        "cryptsetup open unlocks the disk and creates /dev/mapper/NAME. Everything written there is encrypted on the way to the disk. cryptsetup close locks it again."
      ],
      "Encryption protects data at rest: a stolen laptop, a returned drive. Once the disk is open, a running system reads it like any other.",
      "lukstack",
      ["cryptsetup --version", "lsblk"],
      "analogy",
      "The disk is a safe. The master key opens it. Each key slot is a lockbox holding a copy of that key, and each passphrase opens one lockbox."),
    L("luks-cli.html", "LUKS from the command line",
      "luksFormat creates the encrypted container. open unlocks it. Then mkfs and mount work on the mapper device.",
      [
        "sudo cryptsetup luksFormat /dev/sde asks you to type YES and a passphrase, then writes the header. This destroys what was on the disk. lsblk -f then shows crypto_LUKS.",
        "sudo cryptsetup open /dev/sde secret creates /dev/mapper/secret. Make a filesystem on that, mount it, use it. Unmount and cryptsetup close secret when you are done."
      ],
      "To open at boot, add a line to /etc/crypttab, and a line for the mapper device to /etc/fstab. The system will ask for the passphrase while it starts.",
      "lukscli",
      ["sudo cryptsetup luksFormat /dev/sde", "sudo cryptsetup open /dev/sde secret", "lsblk", "sudo mkfs.ext4 -q /dev/mapper/secret", "sudo mkdir /mnt/secret", "sudo mount /dev/mapper/secret /mnt/secret", "echo private | sudo tee /mnt/secret/note.txt", "sudo umount /mnt/secret", "sudo cryptsetup close secret", "lsblk -f"],
      "caution",
      "Format the mapper device, never the raw disk, once LUKS is on it. mkfs on /dev/sde would wipe the header and the data with it."),
    L("luks-keys.html", "Add, remove, and change a passphrase",
      "A LUKS2 disk has 32 key slots. luksAddKey fills one, luksChangeKey replaces one, and luksKillSlot or luksRemoveKey empties one.",
      [
        "sudo cryptsetup luksAddKey /dev/sde asks for a current passphrase, then a new one. luksDump lists the slots in use. Give a second person their own passphrase, or keep a recovery passphrase in a safe.",
        "luksChangeKey swaps one passphrase for another in place. luksKillSlot /dev/sde 0 empties slot 0. cryptsetup refuses to remove the last slot, because that would make the data unreadable forever."
      ],
      "Back up the header with luksHeaderBackup and keep it off the disk. A damaged header without a backup means the data is gone, even with the right passphrase.",
      "lukskeys",
      ["sudo cryptsetup luksFormat /dev/sde", "sudo cryptsetup luksDump /dev/sde | grep -E '^  [0-9]+: luks2'", "sudo cryptsetup luksAddKey /dev/sde", "sudo cryptsetup luksDump /dev/sde | grep -E '^  [0-9]+: luks2'", "sudo cryptsetup luksChangeKey /dev/sde", "sudo cryptsetup luksKillSlot /dev/sde 0", "sudo cryptsetup luksDump /dev/sde | grep -E '^  [0-9]+: luks2'", "sudo cryptsetup luksHeaderBackup /dev/sde --header-backup-file sde-header.img", "ls -l sde-header.img"],
      "caution",
      "Add the new passphrase and test it before you remove the old one."),
    L("luks-boot.html", "Protect single-user boot",
      "Anyone at the console can usually boot into recovery mode and get a root shell. A GRUB password stops casual use of that path. Full-disk encryption stops it properly.",
      [
        "GRUB's recovery entry and its edit key (e) let someone add init=/bin/bash or single to the kernel line, and many systems then give a root shell with no password. grub-mkpasswd-pbkdf2 makes a password hash for GRUB.",
        "Put a superuser and that hash in /etc/grub.d/40_custom, then run update-grub. Editing entries now needs the password. Mark normal entries --unrestricted so the host still boots unattended."
      ],
      "A GRUB password can be bypassed by booting from a USB stick or moving the disk to another machine. Only an encrypted root, with LUKS, keeps the data safe in those cases.",
      "bootprotect",
      ["grub-mkpasswd-pbkdf2", "sudo update-grub"],
      "caution",
      "Keep the GRUB password and LUKS recovery passphrase in a password manager. A forgotten boot password on a remote server means a trip to the data center.",
      "",
      null,
      "# /etc/grub.d/40_custom\nset superusers=\"admin\"\npassword_pbkdf2 admin grub.pbkdf2.sha512.10000.4E6F...  # from grub-mkpasswd-pbkdf2\n\n# then\nsudo update-grub")
  ]
};

var glossary = [
  ["UTC", "The time zone the kernel keeps. Local zones are only a display choice.", "timedate.html"],
  ["anacron", "Runs daily, weekly, and monthly jobs late if the machine was off.", "anacron.html"],
  ["systemd timer", "A unit that starts a service on a schedule, with OnCalendar.", "timers.html"],
  ["mount point", "The folder where a filesystem is attached to the tree.", "mount-usb.html"],
  ["fstab", "The file that lists filesystems to mount at boot.", "fstab.html"],
  ["UUID", "A unique id written into a filesystem, stable when device names change.", "fstab.html"],
  ["GPT", "The modern partition table, with up to 128 partitions and a backup copy.", "parted.html"],
  ["SMART", "Health counters a drive keeps about itself. smartctl reads them.", "smart.html"],
  ["PV, VG, LV", "LVM's physical volume, volume group, and logical volume.", "lvm.html"],
  ["extent", "LVM's unit of space, 4 MiB by default.", "lvm.html"],
  ["RAID 1", "Mirroring. Two copies on two disks.", "lvm-raid1.html"],
  ["RAID 5", "Striping with one parity block. Survives one disk failure.", "lvm-raid5.html"],
  ["snapshot", "A frozen view of a volume or dataset at one moment.", "lvm-snapshot.html"],
  ["zpool", "A ZFS pool built from disks or groups of disks.", "zfs.html"],
  ["dataset", "A ZFS filesystem inside a pool, with its own properties and snapshots.", "zfs-datasets.html"],
  ["scrub", "A full read of a ZFS pool that checks and repairs every block.", "zfs-scrub.html"],
  ["LUKS", "The Linux standard for full-disk encryption, managed with cryptsetup.", "luks.html"],
  ["key slot", "A place in the LUKS header that holds the master key, locked by one passphrase.", "luks-keys.html"]
];

module.exports = {
  scheduleFront: scheduleFront,
  afterCron: afterCron,
  disksFront: disksFront,
  afterDu: afterDu,
  lvmTopic: lvmTopic,
  zfsTopic: zfsTopic,
  luksTopic: luksTopic,
  glossary: glossary
};

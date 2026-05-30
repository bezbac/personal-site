---
title: Switching from Backblaze to resticprofile
description: My experience switching backup providers
published: 2026-05-30T16:00:00Z
keywords: [backup, backblaze, hetzner, restic, resticprofile, macOS, hetzner storage box]
atUri: "at://did:plc:hkutgcisjksjzjl7j2xwjbsw/site.standard.document/3mn3gvlmuk62z"
---

I have three Mac computers: one work laptop, one personal laptop, and one Mac mini that runs my homelab. The Mac mini has a 4-bay Terramaster D4-320 attached to it with some external storage and a large hard drive used for backing up the Mac and the external drives locally through Time Machine. I do not back up any data from the work or personal laptops as they don't store anything that I couldn't lose. All my code lives on GitHub and my personal repositories are being mirrored to my homelab. I have my photos and notes in iCloud, mirrored as well, and additional files such as an archive of RAW photos from my camera or old backups from my phones simply live on external drives connected to my Mac mini. So effectively, anything that is important to me is stored on the Mac mini.

For the past few years, I was using Backblaze Personal Backup as an offsite backup. After recently reading that Backblaze stopped backing up the iCloud folder on macOS[^1], I decided to take the time to switch to resticprofile backing up to a [Hetzner Storage Box](https://www.hetzner.com/storage/storage-box/).

While the Backblaze Personal Backup price at $99 / year or $123 / year with 1-year version retention is very hard to beat, a Hetzner Storage Box is €156 / year for 5TB or €46 / year for 1TB if you have less data. For me, the slight increase in price was worth the additional control.

I think it is worth noting, though, that unlike a cloud storage host like Dropbox or iCloud, or object storage like S3, data on a Hetzner Storage Box is not mirrored onto multiple servers. This means there is a higher chance of data loss. I would probably not advise using it to store a singular copy of critical data. Since I have two local copies of my data in addition to the data on the storage box, I think this is a very acceptable risk considering the cost savings over B2, S3, or Wasabi.

Switching turned out to be easier than I expected and I'm genuinely happy with the outcome. I wanted to take the time to document the process so I have a resource that might help others in a similar position and to direct people to when talking about my own setup.

The general setup of buying the Hetzner Storage Box and setting up resticprofile was very straightforward and something I'm going to skip over.

I am using 1Password and am a big fan of their [SSH Agent](https://www.1password.dev/ssh/agent), so I initially tried using that but noticed I couldn't run restic unattended since the 1Password vault would need to be unlocked. Instead, I settled on just storing the SSH key and restic password on the filesystem.

After setting everything up, my first complete restic run took a while. I didn't have a comprehensive exclusions list in the first run, so restic was backing up a lot of irrelevant directories, of which many contained tiny files. Fortunately, restic handled interruptions well. I canceled it several times to tweak the config (the SSH connection also dropped on me a couple of times), and it always picked up right where it left of. One tweak I discovered was increasing the `restic_read_concurrency` to 5, which seems to be configured by default to a value of only 2, you can probably push it even further.

After the initial snapshot succeeded, I listed all the included files using `resticprofile ls latest` and checked the list, updating my exclusions config. I then reran restic with only a few hours between runs a handful of times, comparing snapshots to further tweak my exclusion list. You can find my full config at the bottom of this post. Since it might be useful, a list of all snapshots can be shown by running `resticprofile snapshots`, and two snapshots can be compared using `resticprofile diff [snapshot_id] [snapshot_id]`.

Now, after the initial setup, daily runs tend to back up only a few hundred megabytes and typically complete within less than five minutes, while the load on the computer is almost unnoticeable.

The final thing I did was set up a Grafana dashboard to monitor everything. I had Grafana already set up anyway; otherwise, I would have likely skipped this.

The entire process was pretty straightforward, and there are a few things I really like. The first being that running this setup makes me feel that I am in full control. Second, having the all the configuration be text-based instead of hidden in some GUI is great as I can check it into git. I had previously looked into setting up additional exclusions for Backblaze a few times but always put it off due to it being a little more complicated to configure. Lastly, also like that restic is encrypted by default. I saw that for a long time it was not even possible to run it without a password, and even now it's [a little annoying](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html#repositories-with-empty-password), nudging people into secure defaults. Filippo Valsorda, who has done cryptography work at Google and Cloudflare, published a [detailed analysis of restic's cryptographic design](https://words.filippo.io/restic-cryptography/) in 2017 and came away satisfied. That's a meaningful endorsement, with the caveat of the post being almost ten years old.

With everything said, there are a few small things that I think could be better. The Hetzner Storage Box web interface is very limited. It doesn't even include a file browser; in order to see the contents, I need to connect via SSH or using an FTP client. This is not a big issue for me, since I only use the storage box for restic at the moment and I interact with it through the CLI anyway, but might be good to know.

Another very minor annoyance I had was that while there is a [hosted manual for restic](https://restic.readthedocs.io/en/latest/manual_rest.html#manual), the resticprofile docs only contain information about the existence of a help command without actually including its full output. [^2]

[^1]: https://rareese.com/posts/backblaze/
[^2]: https://creativeprojects.github.io/resticprofile/configuration/getting_started/index.html#inline-help

For reference, here's my final setup script:
```bash
# Install resticprofile
brew install restic
brew tap creativeprojects/tap
brew install resticprofile

# Symlink resticprofile config
ln -sfn "$SCRIPT_DIR/../resticprofile" ~/.config/resticprofile

# Create restic credential file
op read "op://Personal/Restic Password/password" > "$SCRIPT_DIR/../resticprofile/credentials"

# Save restic SSH key to avoid 1password prompts
op read -f --out-file ~/.ssh/restic-key.pub "op://Personal/Hetzner Storage Box SSH Key/public key"
op read -f --out-file ~/.ssh/restic-key.pem "op://Personal/Hetzner Storage Box SSH Key/private key?ssh-format=openssh"

# Associate key with host
PATTERN="*.your-storagebox.de"
KEY="~/.ssh/restic-key.pem"
if ! grep -q "^Match host[[:space:]]\+.$PATTERN" ~/.ssh/config; then
  cat > /tmp/ssh-match.tmp << EOF
Host $PATTERN
  IdentityFile $KEY
  IdentitiesOnly yes
  IdentityAgent none

EOF
  cat /tmp/ssh-match.tmp ~/.ssh/config > /tmp/ssh-config.new && mv /tmp/ssh-config.new ~/.ssh/config && rm /tmp/ssh-match.tmp ~/.ssh/config.new
  echo "Added Match block at top."
fi

# Setup resticprofile schedule
# Schedule can be manually triggered via "/bin/launchctl start local.resticprofile.default.backup"
resticprofile schedule --all
```

and here's resticprofile configuration, with a few minor edits to allow publishing it online:
```toml
#:schema https://creativeprojects.github.io/resticprofile/jsonschema/config-1.json

version = "1"

[global]
prevent-sleep = true

[default]
verbose = true
exclude-caches = true
priority = "background"
repository = ""
password-file = "${HOME}/.config/resticprofile/credentials"
prometheus-push = "http://localhost:9091/"
prometheus-push-job = "resticprofile-backup"

[default.backup]
source = ["${HOME}", "/Library", "/Volumes/Disk 2"]
compression = "max"
read-concurrency = 5
exclude = [
  # Temporary & cache files
  "*.tmp",
  "*.temp",
  "*.swp",
  "*.bzvol",
  "*.DS_Store",
  ".Trash",
  ".Trashes",
  ".TemporaryItems",
  ".Spotlight-V100",
  ".DocumentRevisions-V100",
  "**/tmp/",

  # MacOS default folders
  "/Applications",
  "${HOME}/Downloads",
  "${HOME}/.Trash",
  "${HOME}/Library/Caches/",
  "${HOME}/Library/Developer/",
  "${HOME}/Library/Updates/",
  "${HOME}/Library/Metadata/",
  "${HOME}/Library/AppleMediaServices",
  "${HOME}/Library/Application Support/com.apple.wallpaper",
  "${HOME}/Library/Application Support/FileProvider",
  "${HOME}/Library/Application Support/Animoji",
  "${HOME}/Library/Application Support/CloudDocs",
  "${HOME}/Library/Application Support/Knowledge",
  "${HOME}/Library/Application Support/com.apple.ProtectedCloudStorage",
  "${HOME}/Library/Application Support/com.apple.sharedfilelist",
  "${HOME}/Library/Accessibility/com.apple.personalaudio.sqlite-wal",
  "${HOME}/Library/Assistant",
  "${HOME}/Library/Daemon Containers",
  "${HOME}/Library/Group Containers",
  "${HOME}/Library/Containers",
  "${HOME}/Library/HTTPStorages",
  "${HOME}/Library/HomeKit",
  "${HOME}/Library/IdentityServices",
  "${HOME}/Library/IntelligencePlatform",
  "${HOME}/Library/LanguageModeling",
  "${HOME}/Library/MediaAnalysis",
  "${HOME}/Library/Safari",
  "${HOME}/Library/Spelling",
  "${HOME}/Library/Suggestions",
  "${HOME}/Library/Trial",
  "${HOME}/Library/WebKit",
  "${HOME}/Library/com.apple.AppleMediaServices",
  "${HOME}/Library/com.apple.bluetooth.services.cloud",
  "${HOME}/Library/com.apple.bluetoothuser",
  "${HOME}/Movies/TV/TV Library.tvlibrary",
  "${HOME}/Music/Music/Music Library.musiclibrary",
  "${HOME}/Pictures/Photos Library.photoslibrary/private/com.apple.mediaanalysisd/caches",
  "${HOME}/Pictures/Photos Library.photoslibrary/resources/caches",
  "/Library/Apple",
  "/Library/Bluetooth",
  "/Library/Caches",
  "/Library/Documentation",
  "/Library/Image Capture",
  "/Library/Trial",
  "/Library/User Template",
  "/Library/Keychains",
  "/Library/LaunchDaemons",
  "/Library/Application Support/Apple",
  "/Library/Application Support/BTServer",
  "/Library/Application Support/ApplePushService",
  "/Library/Developer/CommandLineTools",
  "/Library/Developer/CoreSimulator",
  "/Library/Developer/PrivateFrameworks",
  "/Library/Application Support/com.apple.idleassetsd",
  "/Library/Application Support/iLifeMediaBrowser",
  "/Library/WebServer/share/httpd",
  "/Library/Preferences/SystemConfiguration",
  "/Library/Preferences/OpenDirectory",
  "/Library/Preferences/com.apple.apsd.plist",
  "/Library/Preferences/com.apple.wifi.known-networks.plist",

  # User level dotfiles
  "${HOME}/.*",

  # Application specific folders
  # ... excluded from the example

  # Build artifacts
  "node_modules",
  ".pnpm-store",
  "__pycache__",
  "*.pyc",
  "*.pyo",
  ".venv",
  "venv",
  ".tox",
  ".nox",
  ".rustup/toolchains",
  ".cargo/registry",
  ".cargo/git",
  ".gradle",
  "target",
  "dist",
  "build",

  # Large media / disk images
  "*.iso",
  "*.img",
  "*.hdd",
  "*.qcow2",
  "*.vmdk",
  "*.vdi",
  "*.bzpkg",
]

# Schedule can be manually triggered via "/bin/launchctl start local.resticprofile.default.backup"
schedule = "*-*-* 10:00:00"
schedule-permission = "user"
schedule-priority = "background"
schedule-log = '${HOME}/.logs/resticprofile/logs/backup-{{ .Now.Format "2006-01-02T15-04-05" }}.log'
schedule-lock-mode = "default"
schedule-lock-wait = "15m00s"

[default.retention]
keep-last = 5
keep-daily = 5
keep-weekly = 4
keep-monthly = 6
keep-yearly = 2
prune = true
after-backup = true

[default.check]
read-data-subset = "5%"
# Once a week on monday at 12:00
schedule = "Mon *-*-* 12:00:00"
schedule-permission = "user"
schedule-priority = "background"
schedule-log = '${HOME}/.logs/resticprofile/logs/check-{{ .Now.Format "2006-01-02T15-04-05" }}.log'
schedule-lock-mode = "default"
schedule-lock-wait = "15m00s"
```

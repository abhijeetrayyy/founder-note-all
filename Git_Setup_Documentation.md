# Git Multi-Account Setup — Complete Session Context

> **Purpose:** Share this file with any CLI/AI (OpenCode, Claude, Copilot, etc.) in future sessions so it instantly understands your Git environment, all past decisions, conventions, and known issues.

---

## Machine Profile

| Attribute | Value |
|-----------|-------|
| Model | MacBook Air (Apple Silicon, arm64) |
| macOS | Sequoia (darwin-arm64) |
| Homebrew | 6.0.6 at `/opt/homebrew` |
| Shell | zsh |
| Default editor | VS Code (`code --wait`) |

---

## Tools Installed (as of 2026-07-03)

| Tool | Version | Installed via |
|------|---------|---------------|
| Git | 2.50.1 | Apple-shipped (system) |
| SSH | OpenSSH 10.2p1 | Apple-shipped (system) |
| GitHub CLI (`gh`) | 2.96.0 | Homebrew |
| Git LFS | 3.7.1 | Homebrew |
| OpenCode CLI | 1.17.13 | Homebrew |
| VS Code | Installed | Direct |
| GitHub Desktop | Installed | Direct |

---

## Session History — What Was Done

### Audit (Phase 1)

**Initial state:**
- Git installed but no SSH keys existed at all (`~/.ssh` directory did not exist)
- No SSH agent identities loaded
- No credential helper configured
- No GPG or SSH signing
- GitHub CLI not installed
- Git LFS filter configured in `~/.gitconfig` but binary not installed
- No `init.defaultBranch` set (defaulting to `master`)
- No pull/merge strategy configured
- `~/Development/` directory did not exist
- One repository found: `~/Downloads/DewDropz` (no remotes, no git identity)
- `~/.config/` directory existed but was **owned by root** — this later caused a `gh` auth failure

**Existing global `~/.gitconfig`:**
```ini
[user]
    name = Abhijeet
    email = abhijeet11ray@gmail.com
[filter "lfs"]
    clean = git-lfs clean -- %f
    smudge = git-lfs smudge -- %f
    process = git-lfs filter-process
    required = true
```

---

### Phase 2 — Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth method | SSH only, no HTTPS | SSH keys are more secure, no token management |
| Key type | Ed25519 | Faster, smaller, more secure than RSA |
| Key strategy | One key per GitHub account | Key compromise isolates only one account |
| Identity strategy | Repository-local git config (NOT includeIf) | User explicitly chose this; identity travels with the repo |
| Global identity | Preserved as-is (`Abhijeet` / `abhijeet11ray@gmail.com`) | User chose not to change global identity |
| Pull strategy | `pull.rebase = true` | Clean linear history |
| SSH config design | Global `Host *` defaults + per-account Host blocks | DRY — common settings inherited, only `HostName`/`User`/`IdentityFile` per block |
| Directory layout | `~/Development/{Personal, Personal-2}/` | One directory per GitHub identity |
| Remote URL format | `git@github-<alias>:<user>/<repo>.git` | SSH aliases select the right key automatically |

---

### Phase 3 & 4 — What Was Configured

#### Directory Structure Created

```
~/Development/
├── Personal/          # abhijeetrayy repos (empty, ready for clones)
└── Personal-2/        # abhijeetrayyy repos
    └── doondzn/       # Cloned via SSH
```

#### SSH Keys Generated

| File | GitHub Account | Email | Passphrase |
|------|---------------|-------|------------|
| `~/.ssh/id_ed25519_personal_main` | abhijeetrayy | abhijeet11ray@gmail.com | Yes |
| `~/.ssh/id_ed25519_personal_main.pub` | | | |
| `~/.ssh/id_ed25519_personal_alt` | abhijeetrayyy | abhijeetrayyy@gmail.com | Yes |
| `~/.ssh/id_ed25519_personal_alt.pub` | | | |

Both keys added to:
- ssh-agent via `ssh-add --apple-use-keychain`
- macOS Keychain (passphrase cached, won't be prompted again after reboot)

#### ~/.ssh/config

```
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host github-personal-main
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal_main

Host github-personal-alt
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal_alt
```

#### Global Git Config (final state)

```ini
[user]
    name = Abhijeet
    email = abhijeet11ray@gmail.com
[init]
    defaultBranch = main
[fetch]
    prune = true
[rerere]
    enabled = true
[core]
    editor = code --wait
[pull]
    rebase = true
[credential]
    helper = osxkeychain
[filter "lfs"]
    clean = git-lfs clean -- %f
    smudge = git-lfs smudge -- %f
    process = git-lfs filter-process
    required = true
```

#### GitHub CLI Authentication

Both accounts authenticated:
- `gh auth status` shows `abhijeetrayyy` as active
- `abhijeetrayy` as switchable
- Use `gh auth switch` to toggle
- Token scopes: `gist`, `read:org`, `repo`
- Git protocol: SSH

---

## Configured Accounts Reference

| # | Alias | GitHub User | Email | SSH Key | Directory | GitHub SSH Key Title |
|---|-------|-------------|-------|---------|-----------|---------------------|
| 1 | `github-personal-main` | abhijeetrayy | abhijeet11ray@gmail.com | `~/.ssh/id_ed25519_personal_main` | `~/Development/Personal/` | `MacBook Pro - personal-main` |
| 2 | `github-personal-alt` | abhijeetrayyy | abhijeetrayyy@gmail.com | `~/.ssh/id_ed25519_personal_alt` | `~/Development/Personal-2/` | `MacBook Pro - personal-alt` |

---

## Issues Encountered & Resolutions

### Issue 1: `~/.config/` owned by root — `gh auth login` failed silently

**Symptom:** `gh auth login` showed "Authentication complete" but then errored:
```
mkdir /Users/abhijeetray/.config/gh: permission denied
```
GitHub showed a browser error: `device/failure?reason=not_found`

**Root cause:** `~/.config/` had owner `root:staff`, preventing `gh` from writing its host config files.

**Resolution:**
```bash
sudo chown abhijeetray ~/.config
```
Then re-ran `gh auth login`.

**Verification:** `ls -la ~/.config` now shows `abhijeetray` as owner.

### Issue 2: `gh auth login` device flow timeout (first attempt)

**Symptom:** First `gh auth login` timed out after 60 seconds — the browser wasn't opened in time to paste the one-time code.

**Resolution:** Re-ran `gh auth login` after fixing `~/.config` ownership. On second attempt, completed device auth in browser immediately.

### Issue 3: doondzn on Desktop vs cloned location

**Symptom:** User had `~/Desktop/Development/DoonDzn/doondzn-main/` with source code but no `.git` directory — it wasn't a git repository and couldn't push.

**Resolution:** Cloned the repo fresh to `~/Development/Personal-2/doondzn` using the correct SSH alias. Verified clone → commit → push → pull end-to-end. Test commit was reverted and pushed back.

**Rule:** `~/Desktop/Development/DoonDzn/doondzn-main/` should not be used for git operations. The canonical working copy is `~/Development/Personal-2/doondzn/`.

---

## Conventions — Follow These When Working On This Machine

### Always use SSH remotes

```
git@github-personal-main:abhijeetrayy/<repo>.git
git@github-personal-alt:abhijeetrayyy/<repo>.git
```

Never `https://github.com/...` — HTTPS is not configured.

### Always set repo-local identity after cloning

```bash
cd ~/Development/Personal-2/<repo>
git config user.name "abhijeetrayyy"
git config user.email "abhijeetrayyy@gmail.com"
```

### Always clone into the correct directory

| Account | Clone into |
|---------|-----------|
| abhijeetrayy | `~/Development/Personal/` |
| abhijeetrayyy | `~/Development/Personal-2/` |

### Always use the right clone command

```bash
# abhijeetrayy repos
git clone git@github-personal-main:abhijeetrayy/<repo>.git

# abhijeetrayyy repos
git clone git@github-personal-alt:abhijeetrayyy/<repo>.git
```

### Don't touch

- Global `user.name` / `user.email` in `~/.gitconfig` — leave as-is
- `~/.ssh/config` — the `Host *` block applies to all connections
- `~/.ssh/id_ed25519_personal_*` keys — don't regenerate unless compromised
- VS Code and GitHub Desktop — they work alongside this setup, no special config needed

---

## How to Add a Future GitHub Account

```
1. ssh-keygen -t ed25519 -C "you@email.com" -f ~/.ssh/id_ed25519_SLUG
   → Enter a passphrase when prompted

2. ssh-add --apple-use-keychain ~/.ssh/id_ed25519_SLUG

3. Add to ~/.ssh/config:
   Host github-SLUG
       HostName github.com
       User git
       IdentityFile ~/.ssh/id_ed25519_SLUG

4. Upload ~/.ssh/id_ed25519_SLUG.pub to GitHub
   → Settings → SSH and GPG keys → New SSH Key
   → Title: "MacBook Pro - SLUG"

5. ssh -T github-SLUG
   → Should say: "Hi <user>! You've successfully authenticated..."

6. mkdir -p ~/Development/DIRECTORY_NAME

7. git clone git@github-SLUG:username/repo.git

8. cd repo && git config user.name "username" && git config user.email "email"

9. gh auth login --hostname github.com --git-protocol ssh --web
   → (if this is a new GH account to use with gh CLI)
```

---

## Verification — Quick Health Check

Run these anytime to confirm everything is working:

```bash
ssh-add -l                          # Both keys should be listed
ssh -T github-personal-main         # Hi abhijeetrayy!
ssh -T github-personal-alt          # Hi abhijeetrayyy!
gh auth status                      # Both accounts, one active
git config --global --list          # Settings should match above
ls ~/Development/                   # Personal/ and Personal-2/
```

---

## Backup Locations

| What | Where |
|------|-------|
| Live config | `~/.ssh/`, `~/.gitconfig`, `~/.config/gh/` |
| Timestamped backup | `~/.git-backup-2026-07-03_19-02-00/` |
| Documentation | `~/Git_Setup_Documentation.md` |
| Session context (this file) | `~/Git_Setup_Documentation.md` (merged) |

---

## Commit Signing — Deferred

SSH commit signing was discussed but **not enabled**. Advantages: verifiable commits, GitHub shows "Verified" badge. Disadvantages: adds complexity, requires `git config gpg.format ssh` and `git config user.signingkey` per repo. If you want it later, each key's public key can double as a signing key — no new keys needed.

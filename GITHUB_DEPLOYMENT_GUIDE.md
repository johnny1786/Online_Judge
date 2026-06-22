# GitHub Upload Guide

## Readiness before pushing

The repository is not currently initialized as Git (the audit found no `.git` directory). Before publishing, ensure a Node 20/npm environment is available and complete these checks:

```bash
npm install      # installs dependencies and produces a lockfile to review/commit
npm run lint     # checks source style
npm test         # validates the existing health integration tests
git status       # confirms only intended files are staged later
```

Do not publish `.env`, credentials, certificates, runtime logs, `node_modules`, or local data. `.gitignore` covers these common items, but inspect `git status` before every commit.

## Initialize Git

```bash
git init # creates the local .git metadata directory and starts version control
```

## Create the GitHub repository

Create a new empty repository in GitHub's web UI. Do not initialize it with a README, `.gitignore`, or license because this working tree already contains them. Copy its HTTPS or SSH repository URL.

## Add the remote

```bash
git remote add origin <repository-url> # records the GitHub repository as the remote named origin
git remote -v                          # displays the configured fetch/push URLs for verification
```

Replace `<repository-url>` with the URL GitHub provides, for example `git@github.com:your-org/ojx.git`.

## Commit

```bash
git add .                      # stages non-ignored project files
git status                     # inspect staged files; verify no secret is present
git commit -m "Initial commit" # writes the first local commit
```

## Push

```bash
git branch -M main          # renames the current branch to main
git push -u origin main     # uploads main and sets origin/main as its upstream
```

## Post-push verification

Open the GitHub repository and confirm that README renders, no `.env` is present, license and contribution files are visible, and Actions are not falsely claimed (this repository has no CI workflow yet). Enable branch protection and require passing CI after a workflow is added.

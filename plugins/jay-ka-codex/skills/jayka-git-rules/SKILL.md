---
name: jayka-git-rules
description: "Git and GitHub rules for any project: free local commits, push only when the user says so, never a PR or merge without a request, work on a branch instead of main, deploy only on order. Use when committing, branching, pushing, opening a PR or deploying."
---

# JayKA · Git Rules

Principle: nothing leaves the machine unless the user asks for it in the chat. Approving a change locally does not authorize pushing it.

**Precedence:** if the user has Git rules in their `AGENTS.md` (global `~/.codex/AGENTS.md` or the project's), **those win**. This skill only covers what they do not say. If a rule here clashes with theirs, follow theirs and do not repeat the one from here.

## First: is there a remote?
Check `git remote -v`.
- **No remote (local-only repo):** commit on the current branch without asking about branches, push or PR.
- **With a remote (GitHub or other):** apply everything below.

## Branches
- Normal work goes on a topic branch, almost never straight on `main`.
- With a remote, when a session starts on `main`, ask: «Do we stay on `main` or use a branch?» and wait for the answer **before editing project files, staging, committing, creating or switching branches**. Read-only inspection is allowed. Skip this gate only if the user has already explicitly chosen the branch in this session; a request to add a file or commit does not itself choose a branch.
- Do not create, switch or delete branches without asking. One branch per topic.

## Commits
- Local commits on the working branch: allowed when they make sense or the user asks.
- Message in the present tense, with a clear one-line summary, in the project's language.
- Respect the attribution line (`Co-Authored-By`) that the environment indicates.
- Before committing look at what goes in (`git status`, `git diff --staged`). Never include secrets, keys or local configuration files.
- Do not use `--no-verify` or skip hooks unless the user asks. If a hook fails, fix the cause.
- Prefer a new commit over rewriting an earlier one.

## Push
- **Only when the user says so, at that moment.** A previous approval does not cover another push.
- Before asking for confirmation, say what goes up: branch, number of commits and destination. Example: «Push 3 commits from `my-branch` to `origin`?».

## Merging into `main` and pull requests
- Merge into `main` only with an explicit order. Use `git merge --ff-only`; if it does not advance cleanly, stop and say so. Run the tests first.
- **Never** open a PR or merge on GitHub without an explicit request. If they ask, confirm: «Open a PR with N commits from `branch` into `main`?».

## Deploy
- Only with the user's explicit order, with `main` already updated and tests green.
- Afterwards, verify with a real request to the site and report the response code.

## Destructive
- Do not use `git reset --hard`, `git push --force`, `git clean -f` or delete branches or folders without confirmation.
- If an operation can lose data, make a backup or ask first.

## Report when closing
The closing of `jayka-communication`, plus what was left unpushed (branch and number of commits).

## My settings
<!-- Change what is not your style. Example: «I work straight on main», «the assistant may open PRs». -->

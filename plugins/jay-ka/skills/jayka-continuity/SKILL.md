---
name: jayka-continuity
description: "Continuity between sessions: «close» saves the state (done, pending, decisions), updates memory and the code graph if they exist and leaves a commit; «open» reads that state and says in a few lines where the work stands. Invoke it with /jayka-continuity close or /jayka-continuity open."
argument-hint: "close | open"
disable-model-invocation: true
---

# JayKA · Continuity

So the thread is not lost when a session is cut. Two modes: **close** and **open**.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `close` | `save`, `cerrar`, `guardar` | Close mode |
| `open` | `resume`, `abrir`, `retomar` | Open mode |
| *(empty)* | | If it is the first message of the session → `open`. Otherwise ask: «Close (save the state) or open (resume)?» |

## Close mode

1. **Gather what happened** with these commands, without modifying anything: `git status --short`, `git log --oneline -15`, `git diff --stat` and `git stash list`. Add what was said in the session. Tell apart what is done and verified, done but unverified, and left half-way.
2. **Write the state** to `.claude/state/CONTINUE.md` with the template `reference/continue-template.md`. If it does not exist, the folder is created following the conventions. If it exists, update it: keep the decisions made and the pending items that still hold, and delete what no longer applies. The sections are:
   - **Header:** today's date, branch and last commit.
   - **Where we stand:** 3 to 6 lines.
   - **Done:** each item says whether it is verified and how, or «unverified».
   - **Pending:** table ordered by priority, each item with its concrete next step and what blocks it.
   - **Decisions made:** with date, so they are not asked again.
   - **Open decisions:** the open questions for the user.
   - **How to run and test:** commands and addresses (never real keys).
   - **Key files** and **uncommitted changes at close**.
3. **Memory.** If the environment has persistent memory, save there what helps other sessions (decisions, preferences, pending items) and say so with one short line and 👍. Do not repeat what is already in the repository.
4. **Code graph or index.** If the project uses a tool that maintains one (for example `graphify`), update it. If none exists, do not invent it.
5. **Local commit** of the state documents, following `jayka-git-rules`. No push.
6. **Close with three lines:** what got done, what is missing and what decision you need from the user.

## Open mode

1. Read, in this order and without modifying anything: `CLAUDE.md`, `.claude/state/CONTINUE.md`, memory if it exists, `git status --short`, `git log --oneline -10` and `git branch --show-current`. If `CONTINUE.md` does not exist, say so and summarize only from git.
2. Answer in **8 lines or fewer**:
   - Where the work stands.
   - What is pending (at most 3 items, the first with its next step).
   - What decision the user owes.
   - Anything that changed outside the session (uncommitted changes, branches, new files).
3. Ask: «Do we continue with [first pending item] or do you prefer something else?». **Do not start working until they confirm.**
4. If the state and the repository do not match (for example the document says «done» but the code does not have it), say so and ask; do not assume.

## Rules
- Do not invent state: if you did not check it, write it as «unverified».
- Do not save secrets, keys or personal data in the state documents.
- A short, current state document beats a long, old one: if a section no longer applies, delete it.

## Done when
- **Close:** `CONTINUE.md` follows the template, has today's date and complete sections; what was not checked says «unverified»; there is a local commit of the state documents (or it was said why not); it closed with three lines.
- **Open:** the answer has 8 lines or fewer, points out any difference between the document and the repository, ends with the question and nothing was modified.

## My settings
<!-- Change the name or location of the state file, or add sections you use. -->

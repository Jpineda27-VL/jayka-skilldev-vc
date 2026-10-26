---
name: jayka-style-library
description: "Queries the library of style profiles (read-only): lists, shows, compares profiles and searches which one fits a description, saying what matches and what already worked. It changes nothing. Invoke it with /jayka-style-library list, show, compare, search, summary, gaps or log."
argument-hint: "list | show <slug> | compare <a> <b> [<c>] | search <description> | summary | gaps | log"
disable-model-invocation: true
---

# JayKA · Style Library

Query of the personal style library. **It only informs: it creates, edits and deletes nothing.** Profiles are written by `jayka-style-self-learning`; they are used by `jayka-style-build`.

## Where it is
`~/.claude/jayka/styles/`
- `<slug>/profile.md` and `<slug>/tokens.json` (and, optionally, `screenshots/`)
- `base-style.md`: traits that repeat across profiles

If the folder does not exist or is empty, say so and explain how to create the first profile: «Run `/jayka-style-self-learning` (as a plugin: `/jay-ka:` in front, conventions §2b) on a finished project». Do not create the folder.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

With no arguments, **`list`** runs. Aliases: `lista` = `list`, `ver` = `show`, `comparar` = `compare`, `buscar` = `search`, `resumen` = `summary`, `huecos` = `gaps`, `registro` = `log`. A slug that does not exist → «There is no profile `<slug>`. Profiles: …».

## Commands
- **`list`**: one line per profile: name, date, feeling in 5 words, main tones, technology, and whether it has «Results and lessons» written.
- **`show <slug>`**: summary of a profile in at most 15 lines: identity, palette with roles, typography, motifs, technology, what would be carried over and what to avoid. Ask whether they want the full profile.
- **`compare <a> <b> [<c>]`**: side-by-side table: feeling, color, typography, shape, motion, density, technology, result. Close with **what they share**, **what sets them apart** and **when each one is suitable**.
- **`search <description>`**: searches which profiles fit what the user describes («something warm for a booking shop, on mobile»). Use the dimensions of `jayka-style-build/reference/matching.md` if available. For each match: **what matches**, **what does not**, and **what worked** according to its «Results and lessons» section. If none fits, say so.
- **`summary`**: reads `base-style.md` and counts how many projects share each trait (families, tones, radii, patterns, libraries). Points out the user's **signature** (what repeats the most).
- **`gaps`**: what the library lacks: profiles without «Results and lessons», old profiles (by date), profiles without browser measurement, and traits that appear in a single profile.
- **`log`**: lists, per profile, the lessons recorded: what worked and what would change.

## Rules
1. **Read-only.** If the user asks to change or create a profile, tell them which skill does it (`jayka-style-self-learning` for profiles, `jayka-style-build` to use them) and do not do it here.
2. Do not invent data the profile does not have: say «no data» and where it would come from.
3. Do not show screenshots or clients' personal data even if they are in a profile.
4. Short answers: tables and lists, without repeating the whole profile.
5. Matches are suggestions. The decision is the user's.

## Done when
- The answer comes only from what the profiles read right now say; every missing datum says «no data».
- No file of the library changed.

## My settings
<!-- Change the list format or add commands of your own. -->

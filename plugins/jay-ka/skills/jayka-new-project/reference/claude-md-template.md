# {{project name}}

{{What it is, in one sentence (`project.sentence`).}}

## Read first
1. `.claude/state/CONTINUE.md`: where the work stands.
2. `docs/project/initial-report.md`: what is defined and what is missing.
3. {{business rules document, if there is one}}

## Stack
- Frontend: {{`tech.frontend` or «to be defined»}}
- Backend: {{`tech.backend` or «to be defined»}}
- Database: {{`tech.database` or «to be defined»}}
- Main platform: {{`tech.platform`}}

## Commands
```text
{{install}}
{{run}}
{{tests}}
```

## Project rules
- Language of the code and the texts: {{…}} (`scope.languages`)
- What is still to be decided about the business is under «Missing to start well» in the initial report.
- Document paths follow `jayka-working-rules/reference/conventions.md`.
- {{Own rules the user asked for (`quality.working-style`).}}

## Where things are
- Approved structure: `.claude/structure/tree.md`
- Approved style: `docs/project/style.md` {{once it exists}}
- Plans: `docs/plans/`

{{If the user approves: the base rules block goes here, with its marks, exactly as `/jayka-menu install-rules project` puts it.}}

<!-- Keep this file short (under 40 lines): it is the first thing read in every session. Detail goes in docs/. -->

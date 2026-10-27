# Parity checklist (per screen)

Check each point in **both** frontends.

## Data and rules
- [ ] The data comes from the same service or API (same shape).
- [ ] There are no calculations or validations that exist only in the frontend (everything is also validated on the server).
- [ ] No hand-written demo data remains.

## Content
- [ ] Same titles, subtitles, buttons and messages.
- [ ] Same order of sections.
- [ ] Same formats (money, dates, phones, units).

## States
- [ ] Empty (with a message and an action).
- [ ] Loading (without emptying the screen when refreshing).
- [ ] Network or server error.
- [ ] Validation error (message next to the field).
- [ ] Success (confirmation).
- [ ] Disabled and sold out, if it applies.

## Style
- [ ] Same tokens: colors, typography, spacing, radii, shadows.
- [ ] Same color role names (`primary`, `accent`…), not loose values.
- [ ] Texts in relative units; no cut-off text at 375 px.
- [ ] AA contrast; visible focus; 44 px touch targets.

## Navigation and behavior
- [ ] The «back» link goes to the same place.
- [ ] Actions lead to the same destination screen.
- [ ] Photos load by the same address rule.
- [ ] No flicker when refreshing; no full reload in one and partial in the other.

## Verification
- [ ] Tested on desktop (1280 px) and mobile (375 px).
- [ ] Walked through with real data, empty and error.
- [ ] If an app is exported or compiled: exported again and the new version tested.
- [ ] Server tests green.
- [ ] Inventory updated.

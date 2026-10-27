# Complete flow test across roles

Goal: check that a datum created by one role **reaches** the next one and shows in the panel. It is tested **on the server** (real responses), not only by looking at screens.

## Before
- [ ] Dated backup of the database.
- [ ] Local server running with the development configuration (for example upload limits).
- [ ] Test accounts per role ready (documented users; password from an environment variable).
- [ ] Data seeded in the states needed.

## How to run it
With a browser tool (for example Playwright) or HTTP calls with each role's session:
1. Log in with each role in its own context (different host or profile) so sessions do not mix.
2. Each step performs the action **through the same route as the app** (the same request, with its CSRF token) and checks the **response** (HTTP status and data).
3. After each step, **read from the next role** to confirm the datum arrived.

## Example flow (adapt it to your product)
| # | Role | Action | Check |
|---|---|---|---|
| 1 | Operator / courier | Connect and report position | Status «available» |
| 2 | Client | Empty cart, add product, choose delivery and payment, confirm | Order created with a code |
| 3 | Shop | Sees the order under «new», accepts it, moves it to the kitchen | Correct states |
| 4 | Operator / courier | Receives the offer and accepts it | Offer with time, then «delivery in progress» |
| 5 | Administrator | Sees the order in the panel and its history | It appears with its status |
| 6 | Anyone | Negative cases | Errors with the expected code |

## Negative cases not to forget
- [ ] No session: 401.
- [ ] Session of another account type: no access.
- [ ] Another user's resource: 404 or 403.
- [ ] Invalid data: 422 with the expected business error code.
- [ ] Repeat the same action (double click): it does not duplicate.

## After (leave everything as it was)
- [ ] Cancel or close the test orders (through the panel, with a reason, which also tests the log).
- [ ] Disconnect the operators and close test shifts.
- [ ] Empty test carts and sessions.
- [ ] Run the states seeder again if needed.
- [ ] Confirm that the counts match what was agreed.
- [ ] Delete from the working folder the scripts and screenshots of the test if they will not be kept.

## Report
Per step: **done / failed / not tested**, with the real datum (response code, identifiers). A list of what failed and of what was left untested. A summary in three lines.

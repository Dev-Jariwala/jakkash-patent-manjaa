Status: ready-for-agent

## Parent

[Bill series, bill year, and bill serial PRD](../PRD.md)

## What to build

Masters gains a Bill series tab. The operator adds one printed token, such as `ST`, `ADI`, `DL`, or `00`. There is no second shop-code field. The token is trimmed. An empty token, a token that contains a hyphen, a token longer than 20 characters, and a second `ST` are rejected. `st` is a different series from `ST`.

The token cannot be renamed and cannot be deleted. It can be turned off, and it stays on the list as off. It can be turned back on. A new Bill does not offer it yet; choosing it on a Bill is the later slice. Settings stays the WhatsApp switch.

The glossary adds Bill series: a printed token on Masters, fixed once saved, which may be turned off and back on, and which a new Bill offers only while it is on. Avoid shop code, and a label besides the token.

Tests call the bill series module with an in-memory stand-in of the same kind as tax-code maintenance. They do not render Masters.

## Acceptance criteria

- [ ] Masters has a Bill series tab, and Settings is still only the WhatsApp switch
- [ ] Adding `ST` or `00` saves that token as the whole row
- [ ] A space around `ST` is stored as `ST`
- [ ] An empty token, a hyphen, a token longer than 20 characters, and a duplicate `ST` are rejected
- [ ] `st` can exist beside `ST`
- [ ] The token cannot be renamed and cannot be deleted
- [ ] A series can be turned off, stays listed as off, and can be turned back on
- [ ] Tests on the bill series module cover add, trim, the rejections, case, list-as-off, and turn back on
- [ ] The glossary records Bill series
- [ ] A Bill still has its three typed parts, and Orders are unchanged

## Blocked by

None - can start immediately

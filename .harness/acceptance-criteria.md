# Acceptance Criteria — SuriWorld 3D Polish Backlog (12 units)

## Quality Tier: DELIGHTFUL

Showcase product. Micro-interactions matter. Every change must reinforce "this is a real place, not a webpage."

## Global Done Criteria

1. **Build green**: `npm run build` exits 0 with zero TS errors after every commit.
2. **Visual verification**: every UI/3D change verified with webapp-testing screenshot before commit. The screenshot is read by Claude and confirms the change is visible and not broken.
3. **No regression**: spawn → walk → enter room → interact → exit → spawn flow works end-to-end after every unit. Spot-check one other room per unit.
4. **Atomic commits**: one commit per unit, message format `polish: P{N} <short-desc>`.
5. **Lint clean**: `npm run lint` passes (warnings tolerated, no new errors).

## Per-Unit Verification

Each unit's verify/eval lines live in plan.md. The pattern is:
- `verify:` what command/screenshot proves it shipped
- `eval:` what a reviewer should look for beyond "it works"

## Quality Baseline (delightful)

- Animations / transitions on state changes (door swing already done)
- Micro-interactions on hover / focus / interact
- Onboarding affordance (WASD pulse on first load)
- Audio layer (sound per room + mute toggle)
- Per-room ambient mood (color tint, dust motes)
- Cohesive palette per room (already established)
- Mobile-friendly touch controls
- No flicker / brightness motion (already enforced — preserve this invariant)

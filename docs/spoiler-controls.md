# Spoiler controls

Spoilers are hidden by default in the replay view. The user must scroll near the end of the highlight timeline and dwell before the score reveal button appears.

## Key behaviors

- **Spoilers hidden by default**: `useSpoilerState` initializes `spoilersAllowed` to `false`.
- **Scroll gating**: `GameReplay` listens to `scroll` events and calculates velocity to ensure the user is intentionally lingering near the bottom of the page.
- **Reveal unlock**: When the user scrolls near the end and their scroll velocity is below the configured threshold for the dwell window, `RevealScoreButton` appears.
- **Explicit reveal**: The score and final stats are revealed only after clicking the button.

## Tunable constants

Located near the top of `src/pages/GameReplay.tsx`:

- `DWELL_TIME_MS`: How long the user must linger near the bottom before unlocking.
- `VELOCITY_THRESHOLD`: Maximum scroll velocity that still counts as a dwell.
- `END_BUFFER_PX`: Distance from the bottom that counts as "near end".
- `ORIENTATION_LOCK_MS`: Grace window after device orientation changes.

## Telemetry

When UI telemetry is enabled, scroll unlocks and reveal clicks are logged via `logUiEvent` in `src/utils/uiTelemetry.ts`.

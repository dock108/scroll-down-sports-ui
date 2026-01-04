# Product overview

## Purpose

Scroll Down Sports provides a spoiler-safe game replay experience so fans can catch up on finished games without seeing the final score too early.

For deeper intent and principles, see [`project-intent.md`](project-intent.md).

## Current capabilities

- Spoiler-safe browsing with score reveal gated by scrolling behavior.
- Date range filtering for finished games.
- Full play-by-play timeline with all PBP events from the database.
- Social posts woven into the timeline, distributed proportionally across PBP events.
- Pre-game section: first 20% of posts appear before the timeline.
- Collapsible quarters for easy navigation.
- Custom X/Twitter embeds for highlights with images and text.
- Player and team stats revealed after scrolling through the timeline.

## Score and data context

- **What scores mean:** Scores represent the curated recap outcome shown after users opt in to reveal results.
- **Not predictions:** Scores are not forecasts or betting guidance; they only summarize completed game results.
- **Pregame context only:** Any content shown before the reveal is intended for context and hype, not outcome hints.
- **Roadmap for real data hookups:** We plan to replace placeholder values with live, validated feeds as data integrations mature.

## Roadmap

1. Improve social post matching with accurate game start times.
2. Add post-game section (last 20% of posts).
3. QA validation on real games.

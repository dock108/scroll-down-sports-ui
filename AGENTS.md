# AGENTS.md — Scroll Down Sports UI

> This file provides context for AI agents (Codex, Cursor, Copilot) working on this codebase.

## Quick Context

**What is this?** Web frontend for Scroll Down Sports—a game catch-up experience.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS

**Key Directories:**
- `src/components/` — Reusable UI components
- `src/pages/` — Route-level pages
- `src/adapters/` — API integration layer
- `src/generated/` — Auto-generated types from OpenAPI (don't edit)

## Core Product Principles

1. **Context before outcome** — Users scroll through the game in sequence
2. **Progressive disclosure** — Show context before scores
3. **User control** — They decide when to reveal results
4. **MVP first** — Ship value, iterate when needed

## Coding Standards

See `.cursorrules` for complete standards. Key points:

1. **TypeScript Strictly** — No `any` types
2. **Functional Components** — With hooks
3. **Tailwind for Styling** — No inline styles
4. **Mobile-first** — Responsive design

## Related Repos

- `scroll-down-api-spec` — API specification (source of truth)
- `scroll-down-app` — iOS client
- `sports-data-admin` — Backend implementation

## Do NOT

- Edit files in `src/generated/` (auto-generated)
- Use `any` types
- Use `console.log` in committed code
- Break the paced reveal flow (context first, outcome last)

## API Integration

Types are generated from `scroll-down-api-spec`:
```bash
npm run generate-types
```

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```

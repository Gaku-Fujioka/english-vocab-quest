# AGENTS.md

## Project

This is a personal TOEIC vocabulary learning web app.

The app is built with:

- React
- TypeScript
- Vite
- LocalStorage
- CSS Modules or Tailwind CSS

Do not add a backend or database in Version 1.

## Main Goal

Build a mobile-first TOEIC vocabulary learning app that helps the user:

- Review words using spaced repetition
- Learn new words in daily sets
- Track mastered words
- See weak words
- Maintain a daily learning streak

## Important Rules

- Prioritize simple, readable code.
- Use TypeScript types strictly.
- Split logic and UI clearly.
- Do not hardcode copyrighted vocabulary lists from external websites.
- Implement CSV/JSON import for vocabulary data.
- Use dummy sample data only for development.
- Do not commit real vocabulary data copied from third-party websites.
- Keep the app fully usable offline with LocalStorage.

## Development Style

When making changes:

1. Explain what files will be changed.
2. Implement the smallest useful version first.
3. Keep components small.
4. Add types before complex logic.
5. Avoid unnecessary libraries unless clearly useful.
6. After implementation, explain how to test the feature manually.

## Design

Use the design references in:

- docs/design/screenshots/
- docs/design/DESIGN_HANDOFF.md
- docs/design/stitch-export/ if available

The Stitch output is a visual reference, not necessarily production-ready code.
Recreate the UI cleanly in React and TypeScript.
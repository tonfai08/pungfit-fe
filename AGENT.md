# AGENT.md
## Language Preference
- Please respond in **Thai language** by default
- Use clear and friendly Thai
- Use English only for code, variable names, or technical terms when appropriate

## Project Overview
This is a web application for tracking workout and exercise logs.
Users can record workouts, sets, reps, weight, and view progress over time.

The project is actively developed and used for personal fitness tracking.

## Tech Stack
- Next.js 15.5.9 (App Router)
- React
- TypeScript
- Tailwind CSS
- Node.js 20+

## Folder Structure (Key Paths)
- src/app: App Router pages and layouts
- src/components: Reusable UI components
- src/lib: Utilities and shared helpers
- src/styles: Global styles (if any)
- public: Static assets

## Rules (IMPORTANT)
- Avoid touching database or API contracts unless required
- Do not introduce breaking changes to existing workout data structure

## Working Style
- Prefer minimal and safe changes
- Explain the plan before editing files
- If a change affects multiple files, summarize the impact first
- Ask for confirmation when unsure

## Coding Conventions
- Use TypeScript strictly
- Prefer functional and readable code
- Avoid unnecessary abstractions
- Keep components small and focused
- Use server components by default unless client-side state is required

## Domain Notes
- Workout data consistency is critical (sets, reps, weight, duration)
- Historical workout records must remain immutable
- UI clarity is more important than visual effects
- Performance should be considered for mobile users

## If You Are Not Sure
- Ask before changing logic
- Provide multiple options with pros/cons instead of guessing

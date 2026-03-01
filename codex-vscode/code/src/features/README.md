# Feature Slices

UI code is organized by domain slice inside `src/features/*`.

Recommended slice structure:

- `components/`: Presentational and local feature components.
- `hooks/`: Feature-specific React hooks.
- `schemas/`: Feature-level Zod schemas for forms and view-models.
- `types/`: Local UI types that do not belong in server domain types.

Current slices:

- `auth`
- `organizations`
- `join-requests`
- `tasks`

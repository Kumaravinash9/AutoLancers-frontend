# AutoLancers — frontend

Review UI for the freelance auto-bid assistant: the scored job queue, the proposal drafts, and the
profile that tunes both.

The backend lives in a separate repo: `AutoLancers-backend`. This app talks to it over HTTP
only — no shared database, no shared code.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Runs on http://localhost:3000 and expects the backend on http://localhost:8010
(`NEXT_PUBLIC_API_URL`).

## Screens

| Route | What it's for |
|---|---|
| `/` | Job queue — **Needs review**, **All matched**, **Rejected (why)**. `Fetch now` triggers a pipeline cycle. |
| `/jobs/[id]` | The draft (editable), the scoring breakdown, and the client's original post. |
| `/profile` | Skills, weights, floors, and keywords — the tuning surface for scoring and drafting. |
| `/settings` | Freelancer connection status and the OAuth connect button. |

## Draft-only

**Copy proposal** is the primary action by design. Nothing is submitted to Freelancer.com from
here — you paste the draft in yourself, and *Mark as sent* only records that you did. The backend
does not hold the `bid` OAuth scope.

## Notes

- Components are plain Tailwind (`src/components/ui.tsx`) rather than shadcn/ui — its installer is
  interactive and, at this size, the generated components would be more machinery than the app needs.
- `src/lib/api.ts` mirrors the backend's `app/api/schemas.py`. There is no shared types package, so
  a field change on one side needs the same change on the other.
- Data is fetched client-side. For a local single-user tool that keeps the data flow in one place,
  and every screen is interactive anyway.
- Effects set state only after an `await` and carry a cancellation flag — React 19's
  `set-state-in-effect` rule is enforced by the lint config.

# AutoLancers — frontend

The marketing site and the review UI: the scored job queue, the proposal drafts, your connected
marketplace accounts, and the profile that tunes both scoring and drafting.

The backend is a separate repo, `AutoLancers-backend`. This app talks to it over HTTP only — no
shared database, no shared code.

## Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Runs on http://localhost:3000 and expects the backend on **http://localhost:8010**
(`NEXT_PUBLIC_API_URL`).

Start the backend first — without it the marketing page still renders, but every app screen shows
a connection error. Its README has a one-command bootstrap.

### Requirements

- Node 20+
- Next.js 16 with React 19 (installed by `npm install`)

Turbopack is the default builder in Next 16, so `npm run dev` and `npm run build` both use it with
no extra flag.

## Screens

| Route | What it's for |
|---|---|
| `/` | Marketing page. Sends signed-out visitors to sign-up or `/demo`. |
| `/demo` | Book a walkthrough. Public — the request is stored, not emailed. |
| `/login` | Sign in and sign up, one screen. |
| `/queue` | The scored queue — **Needs review**, **All matched**, **Rejected (why)**. `Fetch now` runs a pipeline cycle. |
| `/jobs/[id]` | One posting: the editable draft, the scoring breakdown, the client's original text, and the bid action. |
| `/proposals` | Every bid you've placed, with our score, whether we recommended it, and the outcome. |
| `/profile` | Your connected marketplace accounts, one card each. |
| `/profile/account/[id]` | One account in full: picture, tagline, summary, skills, rate, reviews and its bids. |
| `/profile/[id]` | The matching rules — skill weights, floors, keywords, drafting notes. |
| `/profile/edit` | The form behind those rules. |
| `/settings` | Connection status and backend health. |
| `/admin` | Operator view: cycle history, users, demo requests. Admin role only. |

## The account switcher

With more than one marketplace account connected, a picker appears in the navbar. It scopes every
screen to one account, or shows them combined. The choice is stored on the server rather than in
localStorage, so it follows you to another browser — `PUT /connections/selected`.

The scoped account's card is marked `selected` on `/profile`, so an active filter is visible where
the accounts are and not only in the navbar.

## Placing bids

`/jobs/[id]` can submit a real bid; the backend gates it on an explicit confirmation, a connected
account, and a token carrying the `bid` scope. **Copy proposal** stays available for anyone who
would rather paste it in themselves.

If the connect flow granted read-only scope, the UI says so up front rather than failing at submit
time — the account detail page reports `read only` or `can place bids` per account.

## Notes

- Components are plain Tailwind (`src/components/ui.tsx`) rather than shadcn/ui — its installer is
  interactive and, at this size, the generated components would be more machinery than the app
  needs.
- Copy lives in `src/content/` so the marketing header and the in-app nav can't drift apart. A
  duplicated `APP_NAV` once survived a merge and quietly dropped a page from the nav.
- `src/lib/api.ts` mirrors the backend's `app/api/schemas.py`. There is no shared types package, so
  a field added on one side needs the same field on the other.
- Data is fetched client-side. Every screen is interactive anyway, and it keeps the data flow in
  one place.
- Effects set state only after an `await` and carry a cancellation flag — React 19's
  `set-state-in-effect` and `purity` rules are enforced by the lint config, so `Date.now()` during
  render is an error, not a warning.
- `min-w-0` is required on any flex child using `truncate`, or the text refuses to shorten and the
  layout scrolls sideways instead.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three should be clean before pushing — `tsc` catches the API-shape drift that lint won't.

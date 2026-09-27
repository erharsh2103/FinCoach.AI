# Contributing

## Getting set up

Follow [Setup Instructions](README.md#setup-instructions) in the README to
install dependencies and run the frontend and backend.

## Before opening a PR

1. Create a feature branch.
2. Test both frontend and backend manually (no automated test suite yet).
3. Run `npm run build` to confirm the production build succeeds.

## Guidelines

- Keep the frontend API calls going through `src/api/api.js`, not ad-hoc fetches.
- Keep secrets out of committed code — use `.env` (already gitignored).
- Keep PRs focused — one change per PR, with a clear description of why.

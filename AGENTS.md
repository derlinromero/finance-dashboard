**Agents Guide for SpendWise**
- Purpose: actionable rules and conventions for automated coding agents operating in this repository. Use this file as the authoritative guide for builds, tests, style, and working workflows.

- Repository layout (short):
  - `frontend/` — React app (Tailwind, Recharts). See `frontend/package.json`.
  - `backend/` — FastAPI app. Key files: `backend/main.py`, `backend/models.py`, `backend/database.py`.
  - `backend/.env` (local) and `backend/.env.example` — environment variables for Supabase.

- High level agent rules (always):
  - Do not push to remote or force-push without explicit developer approval.
  - Never commit secrets, API keys, or .env files. If required, reference `backend/.env.example` and ask the developer to populate local `.env`.
  - Prefer non-destructive git operations. Do not run resets or other destructive commands unless explicitly asked.

- Build / Lint / Test commands
  - Frontend (React + react-scripts / Jest):
    - Install dependencies: `cd frontend && npm ci` (or `npm install`)
    - Start dev server: `cd frontend && npm start`
    - Build production: `cd frontend && npm run build`
    - Run tests (watch mode): `cd frontend && npm test`
    - Run a single test file: `cd frontend && npm test -- <path/to/test.file>`
      - Example: `cd frontend && npm test -- src/components/ExpenseList.test.jsx`
    - Run a single test by name/pattern: `cd frontend && npm test -- -t "partial name"`
    - Playwright (E2E) is included as a devDependency: run `npx playwright test` after adding tests.

  - Backend (FastAPI + Python):
    - Create & activate virtualenv (recommended):
      - Windows: `python -m venv backend/venv && backend\venv\Scripts\activate`
      - Unix: `python -m venv backend/venv && source backend/venv/bin/activate`
    - Install dependencies: `pip install -r backend/requirements.txt`
    - Run dev server: `uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`
    - Lint & format (recommended): `pip install black isort flake8` then `black backend/ && isort backend/ && flake8 backend/`
    - Tests: this repo does not include backend tests by default. Recommended test runner: `pytest`.
    - Run a single pytest test: `pytest path/to/test_file.py::test_function_name -q`

  - Environment notes:
    - Backend reads `SUPABASE_URL`, `SUPABASE_KEY`, and `SUPABASE_SERVICE_KEY` from env (see `backend/database.py`).
    - Do not store credentials in repo. Use CI secrets or local `.env` not checked in.

- Code style and conventions (follow strictly)

- Python (backend) guidelines
  - Formatter & tools: use `black` for formatting, `isort` for import ordering, and `flake8` for linting. Add them to dev dependencies and CI.
  - Imports: group in this order: standard library, third-party, local application. Separate groups with a single blank line.
    - Example:
      - `import os`
      - `from fastapi import FastAPI`
      - `from backend.database import get_supabase`
  - Typing & models: use Pydantic models for request and response schemas. Validate and normalize input at the model layer (see `backend/models.py`).
  - Naming: snake_case for functions and variables; PascalCase for classes (Pydantic models). Filenames in snake_case.
  - Functions & side effects: keep functions small and single-responsibility. Avoid large endpoint handlers; factor logic into helper functions or modules.
  - Error handling: raise FastAPI `HTTPException` for known client errors (4xx). Catch unexpected exceptions and raise a 500 with an informative message. Log errors with `logging` (do not use `print` for server diagnostics).
  - Security: do not expose keys in API responses. Restrict CORS origins in production (replace `allow_origins=["*"]`).
  - Dates & serialization: use ISO 8601 (`YYYY-MM-DD`) for dates in JSON; use Pydantic validators to coerce/validate.
  - Database client usage: use a singleton client pattern (see `get_supabase()`); avoid re-initializing connections per request.
  - Numeric handling: coerce amounts to `float` before persisting to avoid serialization/parsing surprises.

- JavaScript / React (frontend) guidelines
  - Formatting: use `prettier` and consider `eslint` with recommended rules. Keep formatting consistent across files: 2-space indent, consistent quotes, trailing commas optional but consistent.
  - Imports: order and clarity matters: external packages first, then absolute app imports (src/), then relative imports. Prefer named imports where applicable.
  - Components: PascalCase for component names and filenames; functions/hooks use camelCase. Keep components focused and extract complex logic into hooks (e.g., `useSingleTabGuard.js`).
  - Side effects: use `useEffect` for side-effects and ensure dependency arrays are accurate; avoid stale closures.
  - State: keep state minimal and lift state up when multiple components need it. Prefer controlled inputs and clear prop shapes.
  - Error handling: show friendly UI messages for backend errors; treat error responses as structured JSON and surface meaningful messages to the user.
  - Styling: follow Tailwind usage and `tailwind.config.js`. For complex sets of classes, create small utility functions or component classes to keep markup readable.

- Tests (best practices)
  - Structure: put frontend tests alongside components in `*.test.jsx` files under `frontend/src` and backend tests under `backend/tests`.
  - Single test runs: frontend (Jest) `cd frontend && npm test -- <path/to/test>` or `-- -t "name"`; backend (pytest) `pytest path::test_name -q`.
  - Snapshots: use sparingly; prefer targeted assertions.
  - CI: run full test suite and linters in CI; keep feedback fast and specific.

- Git, branching, and work-in-progress workflow (required)
  - ALWAYS create a new branch off `main` for any new implementation. Use descriptive branch names: `feat/`, `fix/`, `chore/` prefixes are preferred.
  - TO-DO step workflow:
    1. Implement exactly one step from the TO-DO list on a new branch.
    2. Stop and let the developer test the change locally. Do NOT commit or push until the developer requests it.
    3. When the developer asks to commit, create a focused commit with a concise, explanatory message (imperative tense).
    4. Continue to the next TO-DO step only after the developer has run tests and explicitly approves you to proceed.
    5. After all TO-DO items are implemented, wait for the developer to run final verification and ask you to push and open a Pull Request.
  - Commits: keep commits small and atomic; include a short subject line and a 1–2 line body if needed. Example: `feat(api): add CSV row validation for date format`.
  - Never force-push or rewrite history on shared branches without explicit permission.

- Cursor / Copilot rules
  - At the time of writing, no Cursor rules (`.cursor/rules/` or `.cursorrules`) nor a repository Copilot instructions file (`.github/copilot-instructions.md`) were found in the repository root. If such files are present in the future, include their full contents verbatim into this AGENTS.md during updates.
  - Do not rely on node_modules or vendor files for Copilot/Cursor settings; prefer repo-level rules.

- Security & operational notes
  - Secrets: never write secrets into files tracked by git. Use local `.env` and CI secrets.
  - Production config: replace permissive development defaults (CORS, debug flags) before deployment.
  - Logging: use structured logging and avoid leaking user data into logs. Rotate or redact logs that may contain PII.

- When to ask questions (agents should ask exactly one targeted question if blocked)
  - Ask when a decision materially changes design or security posture (e.g., choosing a new database service, changing auth flow).
  - Ask when you need credentials or a secret to proceed — never guess or embed them.
  - When adding new dependencies that impact CI, ask for permission and provide a recommended version and rationale.

- Documentation & PRs
  - When creating a PR, include a short summary, list of files changed, and explicit testing instructions.
  - Link to any manual steps required for the developer to test locally (env vars, migrations, seed data).

Agents must follow these rules. If you need a change to these conventions, propose it in a PR and wait for developer approval before modifying the behavior of other agents.

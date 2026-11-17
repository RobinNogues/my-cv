# AGENTS.md

Operational directives, constraints, and commands for autonomous agents working in the `my-cv` repository.

---

## 1. Architecture & Service Boundaries

This repository is a containerized microservices stack coordinated via Docker Compose:

* **`my-cv-frontend/`**: Static site generated with Hugo and served by Nginx. Mounts `content.yaml` and `hugo.yaml` at build/runtime. Does not contain any dynamic backend logic.
* **`my-cv-backend/`**: Python FastAPI service handling the contact form, spam prevention (honeypots, rate limiting), and asynchronous email dispatch. Managed via `uv`.
* **`caddy/`**: Reverse proxy and TLS termination. Enforces HTTPS, routes traffic, and restricts ingress request body sizes to 64 KB.
* **`content.yaml`**: Root-level single source of truth for resume content. Decoupled from HTML/templates.
* **`docker-compose.yml` & `docker-compose.override.yml`**: Production and local development container topologies.

---

## 2. Invariants & Guardrails

* **Secrets Management**: Never inspect, print, or commit sensitive credentials in `.env`. Use `.env.template` exclusively for documenting configuration keys.
* **Git Operations**: Never run `git commit` or `git push` directly unless explicitly commanded by the user.
* **Coverage Baseline**: The backend test suite mandates a strict minimum code coverage of **90%** (`--cov-fail-under=90`). Never bypass or lower this threshold.
* **Contract Integrity**: Any schema modification in `content.yaml` requires corresponding updates to the Hugo templates in `my-cv-frontend/themes/` and must pass a frontend image build.
* **Dependencies**: Use industry-standard, battle-tested packages already configured in `pyproject.toml`. Do not introduce ad-hoc HTTP clients or custom frameworks.

---

## 3. Development Commands & Tooling

All tool execution must use the project-designated tools and working directories.

### Backend (`my-cv-backend/`)
Toolchain: Python >= 3.13 via `uv`.

```bash
# Sync virtual environment and dependencies
cd my-cv-backend && uv sync

# Lint check
cd my-cv-backend && uv run ruff check

# Format check (do not modify files without explicit intent)
cd my-cv-backend && uv run ruff format --check

# Apply formatting fixes
cd my-cv-backend && uv run ruff format

# Run test suite with coverage
cd my-cv-backend && uv run pytest -v
```

### Frontend (`my-cv-frontend/`)
Toolchain: Hugo / Docker.

```bash
# Validate frontend compilation against content.yaml
docker build -f my-cv-frontend/Dockerfile .
```

### Fullstack & Infrastructure
Toolchain: Docker Compose.

```bash
# Validate Compose configuration syntax
docker compose config --quiet

# Launch local development stack
docker compose up --build -d
```

---

## 4. Code Standards & Patterns

* **Python Style**:
  * Mandatory strict type hinting on all functions, methods, and dataclasses/Pydantic schemas.
  * Docstrings must strictly adhere to the **NumPy format** (Parameters, Returns, Raises).
  * No commented-out code blocks or orphan debug statements (`print()`, `breakpoint()`).
  * Comments are reserved solely for explaining the "WHY" (security motivations, non-obvious workarounds, protocol limits), never the "WHAT".
* **Backend Security**:
  * External integrations (e.g., SMTP servers) must always be mocked in unit and integration tests.
  * Maintain payload size limits and honeypot validation in contact endpoints.

---

## 5. Verification Checklist (Definition of Done)

Prior to declaring any task complete, an agent must verify:
1. `uv run ruff check` produces 0 errors.
2. `uv run ruff format --check` passes cleanly.
3. `uv run pytest -v` passes with all tests green and total coverage >= 90%.
4. If frontend or `content.yaml` was modified, `docker build -f my-cv-frontend/Dockerfile .` builds without Hugo compilation errors.
5. `docker compose config --quiet` succeeds without syntax or schema warnings.

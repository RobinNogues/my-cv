FROM python:3.13-slim AS builder

WORKDIR /app

COPY pyproject.toml ./
COPY uv.lock ./

RUN pip install uv && \
    uv sync --frozen

FROM python:3.13-slim

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv

COPY ./src /app

EXPOSE 8000

CMD ["/app/.venv/bin/uvicorn", "my_cv_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

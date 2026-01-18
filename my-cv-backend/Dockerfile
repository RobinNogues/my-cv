FROM python:3.13-slim AS builder

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv && \
    uv sync --frozen

FROM python:3.13-slim

RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash appuser

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv

COPY ./src /app

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/docs')" || exit 1

CMD ["/app/.venv/bin/uvicorn", "my_cv_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies via pip for simplicity in Docker
COPY pyproject.toml .
# We use a temporary requirements generation or just install directly. 
# Since we are using standard pip in docker for now (simpler than installing uv inside docker unless desired)
# checking user request: "Package Manager: uv". 
# I should try to use uv in docker or export requirements. 
# Let's use standard pip install for the container to keep it standard unless I install uv.
# Actually, installing uv is fast.

RUN pip install uv
RUN uv pip install --system --require-hashes=false -r pyproject.toml || \
    # Fallback to generating requirements if uv file handling is stricter
    uv pip install --system fastapi uvicorn sqlmodel psycopg2-binary requests python-multipart

# Copy app code
COPY ./app /app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

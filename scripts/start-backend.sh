#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../WeavAI_Project/backend"
.venv/bin/uvicorn main:app --port 8000

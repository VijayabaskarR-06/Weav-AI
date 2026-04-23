#!/usr/bin/env bash
set -euo pipefail

curl -X POST http://127.0.0.1:8000/price/predict \
  -H "Content-Type: application/json" \
  -d '{"category":"tops","sizes":{"Nike":"M","H&M":"M","Zara":"M"},"salt":1}'
echo

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_ENV="${1:-prod}"
OVERRIDE_PATH="${2:-}"

case "$TARGET_ENV" in
  prod|production)
    DEFAULT_PATH="$ROOT/config/production.local.yaml"
    ;;
  dev|development)
    DEFAULT_PATH="$ROOT/config/development.local.yaml"
    ;;
  *)
    echo "unknown env: $TARGET_ENV" >&2
    echo "usage: $0 [prod|dev] [optional-config-path]" >&2
    exit 1
    ;;
esac

CONFIG_PATH="${OVERRIDE_PATH:-$DEFAULT_PATH}"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "config not found: $CONFIG_PATH" >&2
  echo "usage: $0 [prod|dev] [optional-config-path]" >&2
  exit 1
fi

if base64 --help 2>/dev/null | grep -q -- "--wrap"; then
  base64 -w0 "$CONFIG_PATH"
else
  base64 -i "$CONFIG_PATH" | tr -d '\n'
fi

if [[ -t 1 ]]; then
  printf '\n' >&2
fi

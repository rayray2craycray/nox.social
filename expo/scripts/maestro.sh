#!/usr/bin/env bash
# Maestro runner — sets up the Java + Maestro environment and runs a flow (or
# all flows in .maestro/ if none given) against a booted iOS simulator.
#
# Usage:
#   bash scripts/maestro.sh                      # run all flows in .maestro/
#   bash scripts/maestro.sh .maestro/smoke.yaml  # run one flow
#   bash scripts/maestro.sh .maestro/screenshots.yaml --output shots/
#
# Prereqs: a booted sim with Nox installed. For a debug build, Metro must be
# running (npx expo start). A release/standalone sim build needs no Metro.
set -euo pipefail

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export PATH="/opt/homebrew/opt/openjdk/bin:$HOME/.maestro/bin:$PATH"
export MAESTRO_CLI_NO_ANALYTICS=1

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro not found. Install: curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

TARGET="${1:-.maestro}"
shift || true
exec maestro test "$TARGET" "$@"

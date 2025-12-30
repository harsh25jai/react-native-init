#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR"

usage() {
  cat <<EOF
Usage: $0 [--dry-run] [--no-commit]

Options:
  --dry-run   Print planned changes and exit without applying
  --no-commit Apply changes but don't create a git commit
EOF
}

DRY_RUN=0
NO_COMMIT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --no-commit) NO_COMMIT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
done

# Preconditions
if [ ! -f package.json ]; then
  echo "Error: must be run from repository root (no package.json found)" >&2
  exit 1
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Running in dry-run mode"
  node "scripts/codemods/detox-setup.js" --dry-run
  exit 0
fi

# Ensure git working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: please commit or stash changes before running this script" >&2
  exit 1
fi

# Run codemod
node "scripts/codemods/detox-setup.js"

# If changes
if ! git diff --quiet; then
  git add .
  if [ "$NO_COMMIT" -eq 1 ]; then
    echo "Changes staged but not committed (use --no-commit to skip commit)"
  else
    git commit -m "feat(detox): add detox android native setup and e2e config"
    echo "Committed changes"
  fi
else
  echo "No changes needed"
fi

exit 0

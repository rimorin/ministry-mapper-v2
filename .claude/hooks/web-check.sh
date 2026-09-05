#!/bin/bash
# PostToolUse hook: after Claude edits a source file, run the same checks
# lint-staged runs at commit time. Exit 2 feeds the output back to Claude so it
# fixes the file before moving on.
set -u
file=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))' 2>/dev/null)
case "$file" in
  *.ts|*.tsx|*.css) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if ! out=$(npx prettier --check "$file" 2>&1); then
  echo "prettier: $file is not formatted. Run: npx prettier --write $file" >&2
  exit 2
fi
case "$file" in
  *.ts|*.tsx)
    if ! out=$(npx eslint --max-warnings 0 "$file" 2>&1); then
      echo "eslint --max-warnings 0 failed for $file:" >&2
      echo "$out" >&2
      exit 2
    fi ;;
esac
exit 0

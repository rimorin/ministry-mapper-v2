#!/bin/bash
# PostToolUse hook: after Claude edits a source file, format it and run the
# lint check lint-staged runs at commit time. Exit 2 feeds the output back to
# Claude so it fixes the file before moving on.
set -u
file=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))' 2>/dev/null)
case "$file" in
  *.ts|*.tsx|*.css|*.json) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
# Run from the checkout that holds the file, so a worktree under
# .claude/worktrees/ isn't treated as an ignored path of the main checkout.
root=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null) || root="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
cd "$root" || exit 0

if ! out=$(npx prettier --write --log-level warn "$file" 2>&1); then
  echo "prettier failed for $file:" >&2
  echo "$out" >&2
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

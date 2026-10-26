#!/usr/bin/env bash
# Copies the jayka-* skills to ~/.claude/skills. It does not overwrite existing ones (use --force to replace them).
# The recommended way is the plugin (see README). Use this only if you want the commands without the /jay-ka: prefix.
set -euo pipefail

source_dir="$(cd "$(dirname "$0")/.." && pwd)/plugins/jay-ka/skills"
target_dir="${CLAUDE_HOME:-$HOME/.claude}/skills"
force=0
[ "${1:-}" = "--force" ] && force=1

mkdir -p "$target_dir"
copied=0
skipped=0
for skill in "$source_dir"/*/; do
  name="$(basename "$skill")"
  if [ -e "$target_dir/$name" ] && [ "$force" -eq 0 ]; then
    echo "Already exists, skipped: $name (use --force to replace it)"
    skipped=$((skipped + 1))
    continue
  fi
  rm -rf "$target_dir/$name"
  cp -R "$skill" "$target_dir/$name"
  echo "Installed: $name"
  copied=$((copied + 1))
done
echo "Done: $copied installed, $skipped skipped. Folder: $target_dir"

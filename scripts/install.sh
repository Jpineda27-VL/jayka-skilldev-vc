#!/usr/bin/env bash
# Copia las skills jay-k-a-* a ~/.claude/skills. No pisa las que ya existen (usa --force para reemplazarlas).
set -euo pipefail

origen="$(cd "$(dirname "$0")/.." && pwd)/plugins/jay-ka/skills"
destino="${CLAUDE_HOME:-$HOME/.claude}/skills"
force=0
[ "${1:-}" = "--force" ] && force=1

mkdir -p "$destino"
copiadas=0
saltadas=0
for skill in "$origen"/*/; do
  nombre="$(basename "$skill")"
  if [ -e "$destino/$nombre" ] && [ "$force" -eq 0 ]; then
    echo "Ya existe, se salta: $nombre (usa --force para reemplazarla)"
    saltadas=$((saltadas + 1))
    continue
  fi
  rm -rf "$destino/$nombre"
  cp -R "$skill" "$destino/$nombre"
  echo "Instalada: $nombre"
  copiadas=$((copiadas + 1))
done
echo "Listo: $copiadas instaladas, $saltadas saltadas. Carpeta: $destino"

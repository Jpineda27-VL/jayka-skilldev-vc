#!/usr/bin/env bash
set -e
git init -q && git config user.email eval@test && git config user.name eval
echo "<form><input name=email><button>Enviar</button></form>" > index.html
git add -A && git commit -qm "Agrega el formulario de contacto"

#!/usr/bin/env bash
set -e
git init -q && git config user.email eval@test && git config user.name eval
mkdir -p src tests
echo "export function login(u, p) { return Boolean(u && p); }" > src/login.js
echo "// prueba: login sin contraseña devuelve false" > tests/login.test.js
git add -A && git commit -qm "Agrega el formulario de login con pruebas"

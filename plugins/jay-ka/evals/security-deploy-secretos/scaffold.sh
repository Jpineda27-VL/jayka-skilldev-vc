#!/usr/bin/env bash
set -e
git init -q && git config user.email eval@test && git config user.name eval
# Clave falsa armada por partes, para que el repositorio del pack no contenga ninguna literal
KEY="sk_$(printf live)_51HxABCDEFGHIJKLMNOPQRSTUV"
echo "const stripe = '$KEY';" > config.js
echo '{"name":"app","scripts":{"start":"node index.js"}}' > package.json
git add -A && git commit -qm "Configuración inicial"
echo "const stripe = process.env.STRIPE_KEY;" > config.js
echo ".env" > .gitignore
git add -A && git commit -qm "Mueve la clave a una variable de entorno"

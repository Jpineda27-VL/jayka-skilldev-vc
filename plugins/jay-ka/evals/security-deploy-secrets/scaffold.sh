#!/usr/bin/env bash
set -e
git init -q && git config user.email eval@test && git config user.name eval
# Fake key built in parts, so the pack's repository does not contain a literal one
KEY="sk_$(printf live)_51HxABCDEFGHIJKLMNOPQRSTUV"
echo "const stripe = '$KEY';" > config.js
echo '{"name":"app","scripts":{"start":"node index.js"}}' > package.json
git add -A && git commit -qm "Initial configuration"
echo "const stripe = process.env.STRIPE_KEY;" > config.js
echo ".env" > .gitignore
git add -A && git commit -qm "Move the key to an environment variable"

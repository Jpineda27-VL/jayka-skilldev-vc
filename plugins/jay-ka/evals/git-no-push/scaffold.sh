#!/usr/bin/env bash
set -e
git init -q -b main && git config user.email eval@test && git config user.name eval
git remote add origin https://github.com/example/project.git
echo "console.log('hello')" > index.js
git add -A && git commit -qm "Start"

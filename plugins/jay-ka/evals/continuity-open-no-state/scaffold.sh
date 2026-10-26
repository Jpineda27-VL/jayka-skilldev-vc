#!/usr/bin/env bash
set -e
git init -q && git config user.email eval@test && git config user.name eval
echo "<form><input name=email><button>Send</button></form>" > index.html
git add -A && git commit -qm "Add the contact form"

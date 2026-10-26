#!/usr/bin/env bash
set -e
git init -q && git config user.email eval@test && git config user.name eval
mkdir -p src
echo '<form><input name="name"><button>Save</button></form>' > src/form.html
git add -A && git commit -qm "Base form"

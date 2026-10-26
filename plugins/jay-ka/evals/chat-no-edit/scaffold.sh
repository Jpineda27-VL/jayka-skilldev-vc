#!/usr/bin/env bash
set -e
mkdir -p css
echo '<link rel="stylesheet" href="css/app.css"><h1 class="title">Hello</h1>' > index.html
echo '.title { color: #26264F; font-size: 2rem; }' > css/app.css

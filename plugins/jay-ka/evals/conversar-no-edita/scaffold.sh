#!/usr/bin/env bash
set -e
mkdir -p css
echo '<link rel="stylesheet" href="css/app.css"><h1 class="titulo">Hola</h1>' > index.html
echo '.titulo { color: #26264F; font-size: 2rem; }' > css/app.css

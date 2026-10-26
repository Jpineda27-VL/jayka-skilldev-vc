#!/usr/bin/env bash
set -e
mkdir -p app/Http/Controllers src
{
  echo '<?php'
  echo 'class PedidoController {'
  echo '  public function store($request) { return Pedido::create($request->all()); }'
  echo '  public function buscar($q) { return DB::select("SELECT * FROM pedidos WHERE nombre = '"'"'$q'"'"'"); }'
  echo '  public function ver($id) { return DB::select('"'"'SELECT * FROM pedidos WHERE id = ?'"'"', [$id]); }'
  echo '}'
} > app/Http/Controllers/PedidoController.php
echo "document.getElementById('n').innerHTML = location.hash.slice(1);" > src/app.js

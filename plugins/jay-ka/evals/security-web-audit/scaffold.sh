#!/usr/bin/env bash
set -e
mkdir -p app/Http/Controllers src
{
  echo '<?php'
  echo 'class OrderController {'
  echo '  public function store($request) { return Order::create($request->all()); }'
  echo '  public function search($q) { return DB::select("SELECT * FROM orders WHERE name = '"'"'$q'"'"'"); }'
  echo '  public function show($id) { return DB::select('"'"'SELECT * FROM orders WHERE id = ?'"'"', [$id]); }'
  echo '}'
} > app/Http/Controllers/OrderController.php
echo "document.getElementById('n').innerHTML = location.hash.slice(1);" > src/app.js

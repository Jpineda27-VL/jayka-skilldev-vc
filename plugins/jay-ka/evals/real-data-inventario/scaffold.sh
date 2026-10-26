#!/usr/bin/env bash
set -e
mkdir -p src/pages database/seeders
{
  echo "const pedidos = ["
  echo "  { id: 1, nombre: 'Pizza', precio: 10 },"
  echo "  { id: 2, nombre: 'Taco', precio: 5 },"
  echo "  { id: 3, nombre: 'Sopa', precio: 7 },"
  echo "];"
  echo "export default function Pedidos() { return pedidos.map((p) => <li key={p.id}>{p.nombre}</li>); }"
} > src/pages/Pedidos.jsx
echo '<template><p>Lorem ipsum dolor sit amet</p><p>juan@example.com</p></template>' > src/pages/Perfil.vue
echo 'export const Real = () => fetch("/api/pedidos");' > src/pages/Real.jsx
echo '<?php // seeder de ejemplo: $this->faker->name();' > database/seeders/DemoSeeder.php

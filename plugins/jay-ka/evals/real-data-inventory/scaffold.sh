#!/usr/bin/env bash
set -e
mkdir -p src/pages database/seeders
{
  echo "const orders = ["
  echo "  { id: 1, name: 'Pizza', price: 10 },"
  echo "  { id: 2, name: 'Taco', price: 5 },"
  echo "  { id: 3, name: 'Soup', price: 7 },"
  echo "];"
  echo "export default function Orders() { return orders.map((o) => <li key={o.id}>{o.name}</li>); }"
} > src/pages/Orders.jsx
echo '<template><p>Lorem ipsum dolor sit amet</p><p>john@example.com</p></template>' > src/pages/Profile.vue
echo 'export const Real = () => fetch("/api/orders");' > src/pages/Real.jsx
echo '<?php // sample seeder: $this->faker->name();' > database/seeders/DemoSeeder.php

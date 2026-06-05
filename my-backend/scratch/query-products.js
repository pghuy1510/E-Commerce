const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '15102004',
  database: 'ecommerce',
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT p.id, p.name, c.name as cat_name FROM products p JOIN categories c ON p.category_id = c.id;');
  console.log("Products:", res.rows);
  await client.end();
}

main().catch(console.error);

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
  console.log("Connected to DB!");
  
  const res = await client.query('SELECT * FROM categories;');
  console.log("Categories:", res.rows);
  
  await client.end();
}

main().catch(console.error);

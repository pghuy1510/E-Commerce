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
  console.log("Connected to DB.");

  const payments = await client.query('SELECT id, order_id, method, amount, status, payment_code, paid_at FROM payments ORDER BY id DESC LIMIT 5;');
  console.log("\n--- LAST 5 PAYMENTS ---");
  console.log(payments.rows);

  const logs = await client.query('SELECT id, payment_id, provider, provider_transaction_id, status, created_at FROM payment_logs ORDER BY id DESC LIMIT 5;');
  console.log("\n--- LAST 5 PAYMENT LOGS ---");
  console.log(logs.rows);

  await client.end();
}

main().catch(console.error);

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
  
  // 1. Query order items for order 30
  const orderItemsRes = await client.query('SELECT * FROM order_items WHERE order_id = 30;');
  console.log("=== Order Items for Order 30 ===");
  console.log(orderItemsRes.rows);
  
  // 2. Query products referenced by these items
  if (orderItemsRes.rows.length > 0) {
    const productIds = orderItemsRes.rows.map(row => row.product_id);
    const productsRes = await client.query(
      `SELECT id, name, image, price, stock FROM products WHERE id = ANY($1::int[]);`,
      [productIds]
    );
    console.log("=== Products ===");
    console.log(productsRes.rows);
  }
  
  await client.end();
}

main().catch(console.error);

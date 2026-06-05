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
  
  try {
    await client.query('BEGIN');
    
    // 1. Rename category 1 to 'Accessories'
    console.log("Renaming category 1 to 'Accessories'...");
    await client.query("UPDATE categories SET name = 'Accessories' WHERE id = 1;");
    
    // 2. Move products in categories 6 (Mouse) and 7 (Keyboard) to category 1 (Accessories)
    console.log("Moving products from categories 6 and 7 to category 1...");
    await client.query("UPDATE products SET category_id = 1 WHERE category_id IN (6, 7);");
    
    // 3. Rename the book products in category 1 to actual accessories
    console.log("Renaming book products in category 1 to accessories...");
    await client.query("UPDATE products SET name = 'Aluminum Laptop Stand', price = 24.99 WHERE id = 1;");
    await client.query("UPDATE products SET name = 'USB-C Multiport Adapter', price = 29.99 WHERE id = 2;");
    await client.query("UPDATE products SET name = 'Fast Wireless Charging Pad', price = 19.99 WHERE id = 3;");
    await client.query("UPDATE products SET name = 'Dual-Sided Leather Mouse Pad', price = 14.99 WHERE id = 4;");
    
    // 4. Delete categories 6 and 7
    console.log("Deleting categories 6 and 7...");
    await client.query("DELETE FROM categories WHERE id IN (6, 7);");
    
    await client.query('COMMIT');
    console.log("Migration completed successfully!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed, rolled back changes:", error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

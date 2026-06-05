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
    
    // 1. Rename category 1 back to 'Books'
    console.log("Renaming category 1 back to 'Books'...");
    await client.query("UPDATE categories SET name = 'Books' WHERE id = 1;");
    
    // 2. Re-create categories 6 (Mouse) and 7 (Keyboard)
    console.log("Re-creating categories 6 and 7...");
    await client.query("INSERT INTO categories(id, name) VALUES (6, 'Mouse'), (7, 'Keyboard') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
    
    // 3. Create category 8 (Accessories)
    console.log("Creating category 8 (Accessories)...");
    await client.query("INSERT INTO categories(id, name) VALUES (8, 'Accessories') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
    
    // 4. Restore original book names/prices for IDs 1, 2, 3, 4 under category 1 (Books)
    console.log("Restoring book products in category 1...");
    await client.query("UPDATE products SET name = 'Atomic Habits', price = 19.99, category_id = 1 WHERE id = 1;");
    await client.query("UPDATE products SET name = 'Clean Code', price = 29.99, category_id = 1 WHERE id = 2;");
    await client.query("UPDATE products SET name = 'The Psychology of Money', price = 18.50, category_id = 1 WHERE id = 3;");
    await client.query("UPDATE products SET name = 'Deep Work', price = 22.00, category_id = 1 WHERE id = 4;");
    
    // 5. Re-associate mice and keyboards back to category 6 and 7
    console.log("Moving mice and keyboards back to category 6 and 7...");
    await client.query("UPDATE products SET category_id = 6 WHERE id IN (19, 20);");
    await client.query("UPDATE products SET category_id = 7 WHERE id IN (21, 22);");
    
    await client.query('COMMIT');
    console.log("Database restore completed successfully!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Database restore failed, rolled back changes:", error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

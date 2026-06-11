import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'my-backend', '.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'ecommerce',
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: false,
  logging: false,
});

async function run() {
  console.log('--- STARTING BACKFILL FOR MAX_PRICE AND VARIANT_COUNT ---');
  
  try {
    await dataSource.initialize();
    console.log('Connected to database successfully.');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }

  try {
    // 1. Backfill variable products: calculate max price and active variants count
    const updateVariableQuery = `
      UPDATE products p
      SET 
        max_price = COALESCE(
          (
            SELECT MAX(pv.price)
            FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = true
          ),
          p.price
        ),
        variant_count = COALESCE(
          (
            SELECT COUNT(*)
            FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = true
          ),
          0
        )
      WHERE p.type = 'variable';
    `;

    // 2. Backfill simple products: max_price = null, variant_count = 0
    const updateSimpleQuery = `
      UPDATE products p
      SET 
        max_price = NULL,
        variant_count = 0
      WHERE p.type = 'simple';
    `;

    console.log('Executing backfill SQL queries...');
    await dataSource.query(updateVariableQuery);
    await dataSource.query(updateSimpleQuery);
    
    console.log('Backfill completed successfully!');
  } catch (err) {
    console.error('Error during backfill operation:', err);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

void run();

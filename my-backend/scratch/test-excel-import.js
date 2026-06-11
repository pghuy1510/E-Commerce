/**
 * Excel Import/Export Test Suite
 * ==============================
 * Tests: Simple, Variable, Update, Rollback, Large Data, Concurrent
 * 
 * Usage: node e:\E-Commerce\my-backend\scratch\test-excel-import.js
 */

const { Client } = require('pg');
const XLSX = require('xlsx');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3001/api';
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '15102004',
  database: 'ecommerce',
};
const JWT_SECRET = 'super_secret_key_123';

// ─── Helper Functions ─────────────────────────────────────────────────
let adminToken = null;

async function getAdminToken() {
  if (adminToken) return adminToken;
  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query("SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 1");
  await client.end();

  if (res.rows.length === 0) {
    throw new Error('No admin user found in DB. Create one first.');
  }

  const admin = res.rows[0];
  console.log(`  [auth] Found admin: id=${admin.id}, username=${admin.username}`);
  adminToken = jwt.sign(
    { sub: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
  return adminToken;
}

function authHeaders() {
  return { Authorization: `Bearer ${adminToken}` };
}

async function getCategories() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query("SELECT id, name FROM categories LIMIT 10");
  await client.end();
  return res.rows;
}

async function countProducts(skuPrefix) {
  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query(
    "SELECT COUNT(*) as cnt FROM products WHERE sku LIKE $1",
    [`${skuPrefix}%`]
  );
  await client.end();
  return parseInt(res.rows[0].cnt, 10);
}

async function countVariants(skuPrefix) {
  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query(
    "SELECT COUNT(*) as cnt FROM product_variants WHERE sku LIKE $1 AND deleted_at IS NULL",
    [`${skuPrefix}%`]
  );
  await client.end();
  return parseInt(res.rows[0].cnt, 10);
}

async function getProductBySku(sku) {
  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query(
    "SELECT id, sku, name, price, stock, type FROM products WHERE sku = $1",
    [sku]
  );
  await client.end();
  return res.rows[0] || null;
}

async function getVariantsBySku(parentSku) {
  const client = new Client(DB_CONFIG);
  await client.connect();
  const product = await client.query("SELECT id FROM products WHERE sku = $1", [parentSku]);
  if (product.rows.length === 0) { await client.end(); return []; }
  const productId = product.rows[0].id;
  const res = await client.query(
    "SELECT id, sku, name, price, stock, options, is_active FROM product_variants WHERE product_id = $1 AND deleted_at IS NULL ORDER BY id",
    [productId]
  );
  await client.end();
  return res.rows;
}

async function cleanupTestData(skuPrefixes) {
  const client = new Client(DB_CONFIG);
  await client.connect();
  for (const prefix of skuPrefixes) {
    // Delete variants first
    await client.query(
      "DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE sku LIKE $1)",
      [`${prefix}%`]
    );
    // Delete options
    await client.query(
      "DELETE FROM product_options WHERE product_id IN (SELECT id FROM products WHERE sku LIKE $1)",
      [`${prefix}%`]
    );
    // Delete products
    await client.query("DELETE FROM products WHERE sku LIKE $1", [`${prefix}%`]);
  }
  await client.end();
}

function buildExcelBuffer(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function importExcel(buffer, mode = 'upsert', dryRun = false) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('file', buffer, { filename: 'test.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const res = await axios.post(
    `${API_BASE}/admin/products/excel-import`,
    form,
    {
      headers: {
        ...authHeaders(),
        ...form.getHeaders(),
      },
      params: { mode, dryRun },
    },
  );
  return res.data;
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); }
function check(condition, passMsg, failMsg) {
  if (condition) pass(passMsg);
  else fail(failMsg);
}

// ─── TEST CASES ───────────────────────────────────────────────────────

async function testCase1_SimpleProducts(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 1: Import Simple Products');
  console.log('══════════════════════════════════════════════════════════');

  await cleanupTestData(['TEST-SIMPLE-']);

  const rows = [
    {
      'Loại sản phẩm (Type)': 'simple',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-SIMPLE-001',
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': 'Test Book One',
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': 50000,
      'Tồn kho (Stock)': 100,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
    {
      'Loại sản phẩm (Type)': 'simple',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-SIMPLE-002',
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': 'Test Book Two',
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': 75000,
      'Tồn kho (Stock)': 50,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
    {
      'Loại sản phẩm (Type)': 'simple',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-SIMPLE-003',
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': 'Test Book Three',
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': 120000,
      'Tồn kho (Stock)': 30,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
  ];

  // 1a) Import
  const buf = buildExcelBuffer(rows);
  const result = await importExcel(buf, 'upsert', false);
  check(result.success, `Import thành công: created=${result.created}`, `Import failed: ${JSON.stringify(result.errors)}`);
  check(result.created === 3, `Tạo đúng 3 sản phẩm`, `Số lượng sai: created=${result.created}`);

  const cnt = await countProducts('TEST-SIMPLE-');
  check(cnt === 3, `DB có đúng 3 products`, `DB có ${cnt} products`);

  // 1b) Export
  const exportRes = await axios.get(`${API_BASE}/admin/products/excel-export`, {
    headers: authHeaders(),
    responseType: 'arraybuffer',
  });
  const exportWb = XLSX.read(exportRes.data, { type: 'buffer' });
  const exportSheet = exportWb.Sheets['Products'];
  const exportRows = XLSX.utils.sheet_to_json(exportSheet);
  const testRows = exportRows.filter(r => String(r['Mã SKU (SKU)'] || '').startsWith('TEST-SIMPLE-'));
  check(testRows.length === 3, `Export chứa đúng 3 test products`, `Export chứa ${testRows.length} test products`);

  // 1c) Re-import export file -> no duplicates
  const result2 = await importExcel(exportRes.data, 'upsert', false);
  check(result2.success, `Re-import export thành công`, `Re-import failed: ${JSON.stringify(result2.errors)}`);
  check(result2.updated >= 3, `Re-import cập nhật ≥3 (updated=${result2.updated})`, `Re-import counts: created=${result2.created}, updated=${result2.updated}`);

  const cnt2 = await countProducts('TEST-SIMPLE-');
  check(cnt2 === 3, `Sau re-import vẫn 3 products (không duplicate)`, `Sau re-import có ${cnt2} products (DUPLICATE!)`);

  await cleanupTestData(['TEST-SIMPLE-']);
}

async function testCase2_VariableProducts(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 2: Import Variable Product with Variants');
  console.log('══════════════════════════════════════════════════════════');

  await cleanupTestData(['TEST-VAR-']);

  const rows = [
    {
      'Loại sản phẩm (Type)': 'variable',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-VAR-001',
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': 'Đắc Nhân Tâm - Bản Đặc Biệt',
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': 'Format',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': '',
      'Tồn kho (Stock)': '',
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
    {
      'Loại sản phẩm (Type)': 'variant',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-VAR-001-HC',
      'Mã SKU cha (Parent SKU)': 'TEST-VAR-001',
      'Tên sản phẩm (Name)': 'Hardcover',
      'Danh mục (Category)': '',
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': 'Hardcover',
      'Giá bán (Price)': 150000,
      'Tồn kho (Stock)': 20,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
    {
      'Loại sản phẩm (Type)': 'variant',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-VAR-001-PB',
      'Mã SKU cha (Parent SKU)': 'TEST-VAR-001',
      'Tên sản phẩm (Name)': 'Paperback',
      'Danh mục (Category)': '',
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': 'Paperback',
      'Giá bán (Price)': 90000,
      'Tồn kho (Stock)': 50,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
    {
      'Loại sản phẩm (Type)': 'variant',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': 'TEST-VAR-001-EB',
      'Mã SKU cha (Parent SKU)': 'TEST-VAR-001',
      'Tên sản phẩm (Name)': 'Ebook',
      'Danh mục (Category)': '',
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': 'Ebook',
      'Giá bán (Price)': 45000,
      'Tồn kho (Stock)': 999,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    },
  ];

  const buf = buildExcelBuffer(rows);
  const result = await importExcel(buf, 'upsert', false);
  check(result.success, `Import thành công: created=${result.created}`, `Import failed: ${JSON.stringify(result.errors)}`);

  // Check variants created
  const variants = await getVariantsBySku('TEST-VAR-001');
  check(variants.length === 3, `Tạo đúng 3 variants`, `Có ${variants.length} variants`);

  const hcVariant = variants.find(v => v.sku === 'TEST-VAR-001-HC');
  check(hcVariant && parseFloat(hcVariant.price) === 150000, `Hardcover price = 150000`, `Hardcover price = ${hcVariant?.price}`);

  // Check parent cache
  const parent = await getProductBySku('TEST-VAR-001');
  check(parent != null, `Sản phẩm cha tồn tại`, `Không tìm thấy sản phẩm cha`);

  if (parent) {
    const expectedMinPrice = 45000; // MIN(150000, 90000, 45000)
    const expectedTotalStock = 20 + 50 + 999; // 1069

    check(
      parseFloat(parent.price) === expectedMinPrice,
      `Parent price cache = MIN = ${expectedMinPrice}`,
      `Parent price cache SAI: expected ${expectedMinPrice}, got ${parent.price}`
    );
    check(
      parseInt(parent.stock) === expectedTotalStock,
      `Parent stock cache = SUM = ${expectedTotalStock}`,
      `Parent stock cache SAI: expected ${expectedTotalStock}, got ${parent.stock}`
    );
  }

  await cleanupTestData(['TEST-VAR-']);
}

async function testCase3_UpdateExisting(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 3: Update Existing Products');
  console.log('══════════════════════════════════════════════════════════');

  await cleanupTestData(['TEST-UPD-']);

  // Step 1: Create initial product
  const createRows = [{
    'Loại sản phẩm (Type)': 'simple',
    'ID sản phẩm (Product ID)': '',
    'Mã SKU (SKU)': 'TEST-UPD-001',
    'Mã SKU cha (Parent SKU)': '',
    'Tên sản phẩm (Name)': 'Original Name',
    'Danh mục (Category)': categoryName,
    'Tên thuộc tính (Option Name)': '',
    'Giá trị thuộc tính (Option Value)': '',
    'Giá bán (Price)': 50000,
    'Tồn kho (Stock)': 100,
    'Hình ảnh (Image URL)': 'https://old-image.jpg',
    'Kích hoạt (Is Active)': 'true',
  }];

  const buf1 = buildExcelBuffer(createRows);
  const r1 = await importExcel(buf1, 'create', false);
  check(r1.success && r1.created === 1, `Tạo sản phẩm ban đầu thành công`, `Tạo thất bại: ${JSON.stringify(r1.errors)}`);

  const beforeCount = await countProducts('TEST-UPD-');

  // Step 2: Update
  const updateRows = [{
    'Loại sản phẩm (Type)': 'simple',
    'ID sản phẩm (Product ID)': '',
    'Mã SKU (SKU)': 'TEST-UPD-001',
    'Mã SKU cha (Parent SKU)': '',
    'Tên sản phẩm (Name)': 'Updated Name',
    'Danh mục (Category)': categoryName,
    'Tên thuộc tính (Option Name)': '',
    'Giá trị thuộc tính (Option Value)': '',
    'Giá bán (Price)': 99000,
    'Tồn kho (Stock)': 200,
    'Hình ảnh (Image URL)': 'https://new-image.jpg',
    'Kích hoạt (Is Active)': 'true',
  }];

  const buf2 = buildExcelBuffer(updateRows);
  const r2 = await importExcel(buf2, 'update', false);
  check(r2.success && r2.updated === 1, `Update thành công (updated=1)`, `Update thất bại: ${JSON.stringify(r2)}`);

  const afterCount = await countProducts('TEST-UPD-');
  check(afterCount === beforeCount, `Không tạo record mới (before=${beforeCount}, after=${afterCount})`, `Tạo record mới! before=${beforeCount}, after=${afterCount}`);

  const updated = await getProductBySku('TEST-UPD-001');
  check(updated && updated.name === 'Updated Name', `Tên đã cập nhật = "Updated Name"`, `Tên chưa cập nhật: "${updated?.name}"`);
  check(updated && parseFloat(updated.price) === 99000, `Price đã cập nhật = 99000`, `Price: ${updated?.price}`);
  check(updated && parseInt(updated.stock) === 200, `Stock đã cập nhật = 200`, `Stock: ${updated?.stock}`);

  await cleanupTestData(['TEST-UPD-']);
}

async function testCase4_Rollback(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 4: Transaction Rollback on Error');
  console.log('══════════════════════════════════════════════════════════');

  await cleanupTestData(['TEST-ROLL-']);

  // 100 valid rows + 1 row with duplicate SKU at the end
  const rows = [];
  for (let i = 1; i <= 100; i++) {
    rows.push({
      'Loại sản phẩm (Type)': 'simple',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': `TEST-ROLL-${String(i).padStart(4, '0')}`,
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': `Rollback Test Book ${i}`,
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': 10000 + i * 100,
      'Tồn kho (Stock)': i,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    });
  }

  // Row 101: Duplicate SKU (same as row 1)
  rows.push({
    'Loại sản phẩm (Type)': 'simple',
    'ID sản phẩm (Product ID)': '',
    'Mã SKU (SKU)': 'TEST-ROLL-0001', // DUPLICATE!
    'Mã SKU cha (Parent SKU)': '',
    'Tên sản phẩm (Name)': 'Duplicate SKU Book',
    'Danh mục (Category)': categoryName,
    'Tên thuộc tính (Option Name)': '',
    'Giá trị thuộc tính (Option Value)': '',
    'Giá bán (Price)': 99999,
    'Tồn kho (Stock)': 1,
    'Hình ảnh (Image URL)': '',
    'Kích hoạt (Is Active)': 'true',
  });

  const buf = buildExcelBuffer(rows);
  const result = await importExcel(buf, 'create', false);

  check(!result.success, `Import trả về success=false`, `Import trả về success=true (SAI!)`);
  check(result.errors.length > 0, `Có ${result.errors.length} validation error(s)`, `Không có errors`);

  // Check DB is clean — 0 records should exist
  const cnt = await countProducts('TEST-ROLL-');
  check(cnt === 0, `DB hoàn toàn sạch: 0 records (TRANSACTION ROLLBACK OK)`, `DB có ${cnt} records!!! TRANSACTION ROLLBACK FAILED!`);

  await cleanupTestData(['TEST-ROLL-']);
}

async function testCase5_DryRun(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 5: Dry Run Mode');
  console.log('══════════════════════════════════════════════════════════');

  await cleanupTestData(['TEST-DRY-']);

  const rows = [];
  for (let i = 1; i <= 5; i++) {
    rows.push({
      'Loại sản phẩm (Type)': 'simple',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': `TEST-DRY-${String(i).padStart(4, '0')}`,
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': `Dry Run Book ${i}`,
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': 10000 * i,
      'Tồn kho (Stock)': i * 10,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    });
  }

  const buf = buildExcelBuffer(rows);
  const result = await importExcel(buf, 'upsert', true); // dryRun = true

  check(result.success, `Dry Run trả về success=true`, `Dry Run failed: ${JSON.stringify(result.errors)}`);
  check(result.created === 5, `Dry Run báo created=5`, `Dry Run báo created=${result.created}`);

  const cnt = await countProducts('TEST-DRY-');
  check(cnt === 0, `DB hoàn toàn sạch: 0 records (DRY RUN ROLLBACK OK)`, `DB có ${cnt} records!!! DRY RUN KHÔNG ROLLBACK!`);

  await cleanupTestData(['TEST-DRY-']);
}

async function testCase6_CategoryValidation(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 6: Category Strict Validation');
  console.log('══════════════════════════════════════════════════════════');

  const rows = [{
    'Loại sản phẩm (Type)': 'simple',
    'ID sản phẩm (Product ID)': '',
    'Mã SKU (SKU)': 'TEST-CAT-001',
    'Mã SKU cha (Parent SKU)': '',
    'Tên sản phẩm (Name)': 'Category Test',
    'Danh mục (Category)': 'NonExistentCategoryXYZ123',
    'Tên thuộc tính (Option Name)': '',
    'Giá trị thuộc tính (Option Value)': '',
    'Giá bán (Price)': 10000,
    'Tồn kho (Stock)': 1,
    'Hình ảnh (Image URL)': '',
    'Kích hoạt (Is Active)': 'true',
  }];

  const buf = buildExcelBuffer(rows);
  const result = await importExcel(buf, 'create', false);

  check(!result.success, `Import từ chối category không tồn tại`, `Import thành công dù category sai!`);
  check(
    result.errors.some(e => e.message.includes('không tồn tại')),
    `Error message chứa "không tồn tại"`,
    `Error message: ${JSON.stringify(result.errors)}`
  );
}

async function testCase7_LargeData(categoryName, size) {
  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`  CASE 7: Large Data Import (${size} products)`);
  console.log(`══════════════════════════════════════════════════════════`);

  await cleanupTestData(['TEST-LARGE-']);

  const rows = [];
  for (let i = 1; i <= size; i++) {
    rows.push({
      'Loại sản phẩm (Type)': 'simple',
      'ID sản phẩm (Product ID)': '',
      'Mã SKU (SKU)': `TEST-LARGE-${String(i).padStart(5, '0')}`,
      'Mã SKU cha (Parent SKU)': '',
      'Tên sản phẩm (Name)': `Large Test Book ${i}`,
      'Danh mục (Category)': categoryName,
      'Tên thuộc tính (Option Name)': '',
      'Giá trị thuộc tính (Option Value)': '',
      'Giá bán (Price)': 10000 + i,
      'Tồn kho (Stock)': i,
      'Hình ảnh (Image URL)': '',
      'Kích hoạt (Is Active)': 'true',
    });
  }

  const buf = buildExcelBuffer(rows);

  const memBefore = process.memoryUsage().heapUsed;
  const start = Date.now();

  const result = await importExcel(buf, 'upsert', false);

  const elapsed = Date.now() - start;
  const memAfter = process.memoryUsage().heapUsed;

  check(result.success, `Import ${size} products thành công`, `Import failed: ${JSON.stringify(result.errors?.slice(0, 3))}`);
  console.log(`  ⏱  Thời gian: ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`  🧠 RAM client delta: ${((memAfter - memBefore) / 1024 / 1024).toFixed(1)} MB`);

  const cnt = await countProducts('TEST-LARGE-');
  check(cnt === size, `DB có đúng ${size} products`, `DB có ${cnt} products`);

  await cleanupTestData(['TEST-LARGE-']);
}

async function testCase8_ImportModeCreate(categoryName) {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  CASE 8: Import Mode = create (Reject existing)');
  console.log('══════════════════════════════════════════════════════════');

  await cleanupTestData(['TEST-MODE-']);

  // Create first
  const rows1 = [{
    'Loại sản phẩm (Type)': 'simple',
    'ID sản phẩm (Product ID)': '',
    'Mã SKU (SKU)': 'TEST-MODE-001',
    'Mã SKU cha (Parent SKU)': '',
    'Tên sản phẩm (Name)': 'Mode Test',
    'Danh mục (Category)': categoryName,
    'Tên thuộc tính (Option Name)': '',
    'Giá trị thuộc tính (Option Value)': '',
    'Giá bán (Price)': 50000,
    'Tồn kho (Stock)': 10,
    'Hình ảnh (Image URL)': '',
    'Kích hoạt (Is Active)': 'true',
  }];
  await importExcel(buildExcelBuffer(rows1), 'create', false);

  // Try to create again with mode=create
  const r2 = await importExcel(buildExcelBuffer(rows1), 'create', false);
  check(!r2.success, `mode=create từ chối SKU đã tồn tại`, `mode=create cho phép tạo trùng!`);

  await cleanupTestData(['TEST-MODE-']);
}

// ─── MAIN ─────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  EXCEL IMPORT/EXPORT TEST SUITE                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    await getAdminToken();

    const categories = await getCategories();
    if (categories.length === 0) {
      console.error('❌ Không có category nào trong DB! Tạo ít nhất 1 category.');
      return;
    }
    const categoryName = categories[0].name;
    console.log(`  [config] Category dùng cho test: "${categoryName}" (id=${categories[0].id})`);

    // Test template download
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  CASE 0: Download Template');
    console.log('══════════════════════════════════════════════════════════');
    const tplRes = await axios.get(`${API_BASE}/admin/products/excel-template`, {
      headers: authHeaders(),
      responseType: 'arraybuffer',
    });
    const tplWb = XLSX.read(tplRes.data, { type: 'buffer' });
    check(tplWb.SheetNames.includes('Products'), `Template có sheet "Products"`, `Template thiếu sheet Products`);
    check(tplWb.SheetNames.includes('Instructions'), `Template có sheet "Instructions"`, `Template thiếu sheet Instructions`);

    await testCase1_SimpleProducts(categoryName);
    await testCase2_VariableProducts(categoryName);
    await testCase3_UpdateExisting(categoryName);
    await testCase4_Rollback(categoryName);
    await testCase5_DryRun(categoryName);
    await testCase6_CategoryValidation(categoryName);
    await testCase8_ImportModeCreate(categoryName);

    // Large data tests
    await testCase7_LargeData(categoryName, 500);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ALL TESTS COMPLETED                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');

  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err.message);
    if (err.response) {
      console.error('  Status:', err.response.status);
      console.error('  Data:', JSON.stringify(err.response.data)?.substring(0, 500));
    }
  }
}

main();

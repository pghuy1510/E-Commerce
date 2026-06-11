const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

async function main() {
  const c = new Client({host:'localhost',port:5432,user:'postgres',password:'15102004',database:'ecommerce'});
  await c.connect();
  const r = await c.query("SELECT id,username,role FROM users WHERE role='admin' LIMIT 1");
  const admin = r.rows[0];
  const token = jwt.sign(
    { sub: admin.id, username: admin.username, role: admin.role },
    'super_secret_key_123',
    { expiresIn: '1h' }
  );
  await c.end();

  const headers = { Authorization: `Bearer ${token}` };

  // Test 1: simple -> variable
  console.log('=== Test 1: simple -> variable ===');
  try {
    const res = await axios.patch(
      'http://localhost:3001/api/admin/products/1',
      {
        name: 'Atomic Habits',
        description: 'Best selling self-help book',
        price: 0,
        stock: 0,
        categoryId: 1,
        type: 'variable',
        options: [{name:'Format', values:['Hardcover','Paperback']}],
        variants: [
          {sku:'AH-HC-2', name:'Hardcover', price:25, stock:50, options:{Format:'Hardcover'}, isActive:true},
          {sku:'AH-PB-2', name:'Paperback', price:15, stock:100, options:{Format:'Paperback'}, isActive:true},
        ]
      },
      { headers }
    );
    console.log('✅ OK:', res.status);
    console.log('   Price cache:', res.data.price, '(expected: 15)');
    console.log('   Stock cache:', res.data.stock, '(expected: 150)');
    console.log('   Variants:', res.data.variants?.length, '(expected: 2)');
    console.log('   Options:', res.data.options?.length, '(expected: 1)');
  } catch (err) {
    console.log('❌ FAIL:', err.response?.status || err.code, err.response ? JSON.stringify(err.response.data).substring(0, 500) : err.message);
  }

  // Revert
  console.log('\n=== Revert to simple ===');
  try {
    await axios.patch('http://localhost:3001/api/admin/products/1',
      { name: 'Atomic Habits', description: 'Best selling self-help book', price: 15.99, stock: 100, categoryId: 1, type: 'simple' },
      { headers });
    console.log('✅ Reverted');
  } catch(e) { console.log('❌ Revert failed:', e.response?.status); }
}

main().catch(console.error);

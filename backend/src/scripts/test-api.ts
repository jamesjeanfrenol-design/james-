import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('Testing StockMaster API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch('http://localhost:3001/health');
    const health = await healthRes.json() as { status: string };
    console.log('   ✓ Health:', health.status);

    // Test 2: Login
    console.log('\n2. Testing login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@stock.com', password: 'admin' }),
    });
    
    if (!loginRes.ok) {
      const error = await loginRes.text();
      console.log('   ✗ Login failed:', error);
      return;
    }
    
    const loginData = await loginRes.json() as { user: { email: string; role: string }; token: string };
    console.log('   ✓ Login successful');
    console.log('   User:', loginData.user.email, `(${loginData.user.role})`);
    const token = loginData.token;

    // Test 3: Get products (with auth)
    console.log('\n3. Testing products endpoint...');
    const productsRes = await fetch(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = await productsRes.json() as any[];
    console.log(`   ✓ Products: ${products.length} found`);

    // Test 4: Get categories
    console.log('\n4. Testing categories endpoint...');
    const categoriesRes = await fetch(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const categories = await categoriesRes.json() as any[];
    console.log(`   ✓ Categories: ${categories.length} found`);

    // Test 5: Get units
    console.log('\n5. Testing units endpoint...');
    const unitsRes = await fetch(`${API_BASE}/units`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const units = await unitsRes.json() as any[];
    console.log(`   ✓ Units: ${units.length} found`);

    // Test 6: Get customers
    console.log('\n6. Testing customers endpoint...');
    const customersRes = await fetch(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const customers = await customersRes.json() as any[];
    console.log(`   ✓ Customers: ${customers.length} found`);

    // Test 7: Get dashboard stats
    console.log('\n7. Testing dashboard stats...');
    const statsRes = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const stats = await statsRes.json() as { todayRevenue: number; totalProducts: number; lowStockCount: number };
    console.log('   ✓ Stats:', {
      todayRevenue: stats.todayRevenue,
      totalProducts: stats.totalProducts,
      lowStockCount: stats.lowStockCount,
    });

    console.log('\n✅ All API tests passed!');
  } catch (error: any) {
    console.error('\n❌ API test failed:', error.message);
    console.error('\nMake sure the backend is running:');
    console.error('  cd backend');
    console.error('  npm run dev');
  }
}

testAPI();


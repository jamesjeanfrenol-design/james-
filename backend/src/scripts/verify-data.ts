import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Unit } from '../models/Unit';
import { Category } from '../models/Category';
import { Warehouse } from '../models/Warehouse';
import { Supplier } from '../models/Supplier';
import { Customer } from '../models/Customer';

async function verifyData() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected\n');

    const userRepository = AppDataSource.getRepository(User);
    const unitRepository = AppDataSource.getRepository(Unit);
    const categoryRepository = AppDataSource.getRepository(Category);
    const warehouseRepository = AppDataSource.getRepository(Warehouse);
    const supplierRepository = AppDataSource.getRepository(Supplier);
    const customerRepository = AppDataSource.getRepository(Customer);

    // Check users
    const users = await userRepository.find();
    console.log(`Users: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    // Check units
    const units = await unitRepository.find();
    console.log(`\nUnits: ${units.length}`);
    units.forEach(u => console.log(`  - ${u.name} (${u.shortName})`));

    // Check categories
    const categories = await categoryRepository.find();
    console.log(`\nCategories: ${categories.length}`);
    categories.forEach(c => console.log(`  - ${c.name}`));

    // Check warehouses
    const warehouses = await warehouseRepository.find();
    console.log(`\nWarehouses: ${warehouses.length}`);
    warehouses.forEach(w => console.log(`  - ${w.name} (${w.location})`));

    // Check suppliers
    const suppliers = await supplierRepository.find();
    console.log(`\nSuppliers: ${suppliers.length}`);
    suppliers.forEach(s => console.log(`  - ${s.name} (${s.contact})`));

    // Check customers
    const customers = await customerRepository.find();
    console.log(`\nCustomers: ${customers.length}`);
    customers.forEach(c => console.log(`  - ${c.name} (Balance: ${c.balance})`));

    console.log('\nVerification completed!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Verification error:', error);
    process.exit(1);
  }
}

verifyData();


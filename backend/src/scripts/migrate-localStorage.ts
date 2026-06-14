import { AppDataSource } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import {
  Unit,
  Category,
  Warehouse,
  Supplier,
  User,
  Product,
  Customer,
} from '../models';
import bcrypt from 'bcryptjs';

interface LocalStorageData {
  products?: any[];
  categories?: any[];
  units?: any[];
  customers?: any[];
  suppliers?: any[];
  warehouses?: any[];
  users?: any[];
  sales?: any[];
  movements?: any[];
  closings?: any[];
  deposits?: any[];
  audits?: any[];
  petty_cash?: any[];
}

async function migrateData() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Read JSON file exported from localStorage
    const jsonPath = process.argv[2] || path.join(__dirname, '../../migration-data.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`Migration file not found: ${jsonPath}`);
      console.log('Please export your localStorage data to a JSON file first.');
      console.log('You can do this by running in browser console:');
      console.log(`
        const data = {
          products: JSON.parse(localStorage.getItem('sm_products') || '[]'),
          categories: JSON.parse(localStorage.getItem('sm_categories') || '[]'),
          units: JSON.parse(localStorage.getItem('sm_units') || '[]'),
          customers: JSON.parse(localStorage.getItem('sm_customers') || '[]'),
          suppliers: JSON.parse(localStorage.getItem('sm_suppliers') || '[]'),
          warehouses: JSON.parse(localStorage.getItem('sm_warehouses') || '[]'),
          users: JSON.parse(localStorage.getItem('sm_users') || '[]'),
          sales: JSON.parse(localStorage.getItem('sm_sales') || '[]'),
          movements: JSON.parse(localStorage.getItem('sm_movements') || '[]'),
          closings: JSON.parse(localStorage.getItem('sm_closings') || '[]'),
          deposits: JSON.parse(localStorage.getItem('sm_deposits') || '[]'),
          audits: JSON.parse(localStorage.getItem('sm_audits') || '[]'),
          petty_cash: JSON.parse(localStorage.getItem('sm_petty_cash') || '[]'),
        };
        console.log(JSON.stringify(data, null, 2));
      `);
      process.exit(1);
    }

    const data: LocalStorageData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const unitRepository = AppDataSource.getRepository(Unit);
    const categoryRepository = AppDataSource.getRepository(Category);
    const warehouseRepository = AppDataSource.getRepository(Warehouse);
    const supplierRepository = AppDataSource.getRepository(Supplier);
    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);
    const customerRepository = AppDataSource.getRepository(Customer);

    // Migrate Units
    if (data.units && data.units.length > 0) {
      console.log(`Migrating ${data.units.length} units...`);
      for (const unit of data.units) {
        const existing = await unitRepository.findOne({ where: { id: unit.id } });
        if (!existing) {
          await unitRepository.save(unitRepository.create(unit));
        }
      }
      console.log('Units migrated');
    }

    // Migrate Categories
    if (data.categories && data.categories.length > 0) {
      console.log(`Migrating ${data.categories.length} categories...`);
      for (const category of data.categories) {
        const existing = await categoryRepository.findOne({ where: { id: category.id } });
        if (!existing) {
          await categoryRepository.save(categoryRepository.create(category));
        }
      }
      console.log('Categories migrated');
    }

    // Migrate Warehouses
    if (data.warehouses && data.warehouses.length > 0) {
      console.log(`Migrating ${data.warehouses.length} warehouses...`);
      for (const warehouse of data.warehouses) {
        const existing = await warehouseRepository.findOne({ where: { id: warehouse.id } });
        if (!existing) {
          await warehouseRepository.save(warehouseRepository.create(warehouse));
        }
      }
      console.log('Warehouses migrated');
    }

    // Migrate Suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      console.log(`Migrating ${data.suppliers.length} suppliers...`);
      for (const supplier of data.suppliers) {
        const existing = await supplierRepository.findOne({ where: { id: supplier.id } });
        if (!existing) {
          await supplierRepository.save(supplierRepository.create(supplier));
        }
      }
      console.log('Suppliers migrated');
    }

    // Migrate Users (hash passwords)
    if (data.users && data.users.length > 0) {
      console.log(`Migrating ${data.users.length} users...`);
      for (const user of data.users) {
        const existing = await userRepository.findOne({ where: { id: user.id } });
        if (!existing) {
          const hashedPassword = user.password.startsWith('$2')
            ? user.password
            : await bcrypt.hash(user.password, 10);
          await userRepository.save(
            userRepository.create({
              ...user,
              password: hashedPassword,
              createdAt: new Date(user.createdAt || new Date()),
            })
          );
        }
      }
      console.log('Users migrated');
    }

    // Migrate Customers
    if (data.customers && data.customers.length > 0) {
      console.log(`Migrating ${data.customers.length} customers...`);
      for (const customer of data.customers) {
        const existing = await customerRepository.findOne({ where: { id: customer.id } });
        if (!existing) {
          await customerRepository.save(
            customerRepository.create({
              ...customer,
              createdAt: new Date(customer.createdAt || new Date()),
            })
          );
        }
      }
      console.log('Customers migrated');
    }

    // Migrate Products
    if (data.products && data.products.length > 0) {
      console.log(`Migrating ${data.products.length} products...`);
      for (const product of data.products) {
        const existing = await productRepository.findOne({ where: { id: product.id } });
        if (!existing) {
          await productRepository.save(productRepository.create(product));
        }
      }
      console.log('Products migrated');
    }

    // Note: Sales, movements, closings, deposits, audits, petty_cash can be migrated similarly
    // but they require more complex relationships. This is a basic migration script.

    console.log('Migration completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateData();


import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { Unit } from '../models/Unit';
import { Category } from '../models/Category';
import { Warehouse } from '../models/Warehouse';
import { Supplier } from '../models/Supplier';
import { Customer } from '../models/Customer';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);
    const unitRepository = AppDataSource.getRepository(Unit);
    const categoryRepository = AppDataSource.getRepository(Category);
    const warehouseRepository = AppDataSource.getRepository(Warehouse);
    const supplierRepository = AppDataSource.getRepository(Supplier);
    const customerRepository = AppDataSource.getRepository(Customer);

    // Create default admin user if not exists
    const adminExists = await userRepository.findOne({ where: { email: 'admin@stock.com' } });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin', 10);
      const admin = userRepository.create({
        name: 'Admin Principal',
        email: 'admin@stock.com',
        password: adminPassword,
        role: UserRole.ADMIN,
        createdAt: new Date(),
      });
      await userRepository.save(admin);
      console.log('Default admin user created (admin@stock.com / admin)');
    }

    // Create default cashier user if not exists
    const cashierExists = await userRepository.findOne({ where: { email: 'caisse@stock.com' } });
    if (!cashierExists) {
      const cashierPassword = await bcrypt.hash('caisse', 10);
      const cashier = userRepository.create({
        name: 'Caissier 1',
        email: 'caisse@stock.com',
        password: cashierPassword,
        role: UserRole.CASHIER,
        createdAt: new Date(),
      });
      await userRepository.save(cashier);
      console.log('Default cashier user created (caisse@stock.com / caisse)');
    }

    // Create default units if not exist
    const units = [
      { name: 'Pièce', shortName: 'PCS' },
      { name: 'Carton', shortName: 'CTN' },
      { name: 'Paquet', shortName: 'PKT' },
      { name: 'Kilogramme', shortName: 'KG' },
    ];
    for (const unit of units) {
      const exists = await unitRepository.findOne({ where: { name: unit.name } });
      if (!exists) {
        await unitRepository.save(unitRepository.create(unit));
      }
    }
    console.log('Default units created');

    // Create default categories if not exist
    const categories = [
      { name: 'Électronique' },
      { name: 'Fournitures' },
      { name: 'Informatique' },
      { name: 'Alimentaire' },
    ];
    for (const category of categories) {
      const exists = await categoryRepository.findOne({ where: { name: category.name } });
      if (!exists) {
        await categoryRepository.save(categoryRepository.create(category));
      }
    }
    console.log('Default categories created');

    // Create default warehouses if not exist
    const warehouses = [
      { name: 'Magasin', location: 'Zone A' },
      { name: 'Principal', location: 'Zone B' },
    ];
    for (const warehouse of warehouses) {
      const exists = await warehouseRepository.findOne({ where: { name: warehouse.name } });
      if (!exists) {
        await warehouseRepository.save(warehouseRepository.create(warehouse));
      }
    }
    console.log('Default warehouses created');

    // Create default supplier if not exist
    const supplierExists = await supplierRepository.findOne({ where: { name: 'Fournisseur Alpha' } });
    if (!supplierExists) {
      await supplierRepository.save(
        supplierRepository.create({
          name: 'Fournisseur Alpha',
          contact: '0341122233',
        })
      );
      console.log('Default supplier created');
    }

    // Create default customer (cash customer) if not exist
    const cashCustomerExists = await customerRepository.findOne({ where: { name: 'Client au Comptant' } });
    if (!cashCustomerExists) {
      await customerRepository.save(
        customerRepository.create({
          name: 'Client au Comptant',
          phone: '000',
          balance: 0,
          createdAt: new Date(),
        })
      );
      console.log('Default cash customer created');
    }

    console.log('Database initialization completed!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

initDatabase();


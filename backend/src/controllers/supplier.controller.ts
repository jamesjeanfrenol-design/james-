import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Supplier } from '../models/Supplier';

export class SupplierController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const supplierRepository = AppDataSource.getRepository(Supplier);
      const suppliers = await supplierRepository.find({
        order: { name: 'ASC' },
      });
      res.json(suppliers);
    } catch (error) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const supplierRepository = AppDataSource.getRepository(Supplier);
      
      if (!req.body.name) {
        res.status(400).json({ error: 'Missing required field: name' });
        return;
      }

      const supplier = supplierRepository.create({
        ...req.body,
      });
      const savedSupplier = await supplierRepository.save(supplier);
      res.status(201).json(savedSupplier);
    } catch (error: any) {
      console.error('Create supplier error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Supplier with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const supplierRepository = AppDataSource.getRepository(Supplier);
      const supplier = await supplierRepository.findOne({ where: { id: parseInt(id) } });

      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      Object.assign(supplier, req.body);
      const updatedSupplier = await supplierRepository.save(supplier);
      res.json(updatedSupplier);
    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const supplierRepository = AppDataSource.getRepository(Supplier);
      const result = await supplierRepository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


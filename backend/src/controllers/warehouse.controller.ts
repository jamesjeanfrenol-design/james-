import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Warehouse } from '../models/Warehouse';

export class WarehouseController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      const warehouses = await warehouseRepository.find({
        order: { name: 'ASC' },
      });
      res.json(warehouses);
    } catch (error) {
      console.error('Get warehouses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      
      if (!req.body.name) {
        res.status(400).json({ error: 'Missing required field: name' });
        return;
      }

      const warehouse = warehouseRepository.create({
        ...req.body,
      });
      const savedWarehouse = await warehouseRepository.save(warehouse);
      res.status(201).json(savedWarehouse);
    } catch (error: any) {
      console.error('Create warehouse error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Warehouse with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      const warehouse = await warehouseRepository.findOne({ where: { id: parseInt(id) } });

      if (!warehouse) {
        res.status(404).json({ error: 'Warehouse not found' });
        return;
      }

      Object.assign(warehouse, req.body);
      const updatedWarehouse = await warehouseRepository.save(warehouse);
      res.json(updatedWarehouse);
    } catch (error) {
      console.error('Update warehouse error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      const result = await warehouseRepository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'Warehouse not found' });
        return;
      }

      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
      console.error('Delete warehouse error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


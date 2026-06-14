import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Unit } from '../models/Unit';

export class UnitController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const unitRepository = AppDataSource.getRepository(Unit);
      const units = await unitRepository.find({
        order: { name: 'ASC' },
      });
      res.json(units);
    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const unitRepository = AppDataSource.getRepository(Unit);
      
      if (!req.body.name || !req.body.shortName) {
        res.status(400).json({ error: 'Missing required fields: name, shortName' });
        return;
      }

      const unit = unitRepository.create({
        ...req.body,
      });
      const savedUnit = await unitRepository.save(unit);
      res.status(201).json(savedUnit);
    } catch (error: any) {
      console.error('Create unit error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Unit with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const unitRepository = AppDataSource.getRepository(Unit);
      const unit = await unitRepository.findOne({ where: { id: parseInt(id) } });

      if (!unit) {
        res.status(404).json({ error: 'Unit not found' });
        return;
      }

      Object.assign(unit, req.body);
      const updatedUnit = await unitRepository.save(unit);
      res.json(updatedUnit);
    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const unitRepository = AppDataSource.getRepository(Unit);
      const result = await unitRepository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'Unit not found' });
        return;
      }

      res.json({ message: 'Unit deleted successfully' });
    } catch (error) {
      console.error('Delete unit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


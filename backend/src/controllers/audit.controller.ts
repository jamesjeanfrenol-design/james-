import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { InventoryAudit } from '../models/InventoryAudit';

export class AuditController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const auditRepository = AppDataSource.getRepository(InventoryAudit);
      const audits = await auditRepository.find({
        relations: ['user', 'items', 'items.product'],
        order: { timestamp: 'DESC' },
      });
      res.json(audits);
    } catch (error) {
      console.error('Get audits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auditRepository = AppDataSource.getRepository(InventoryAudit);
      const audit = await auditRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['user', 'items', 'items.product'],
      });

      if (!audit) {
        res.status(404).json({ error: 'Audit not found' });
        return;
      }

      res.json(audit);
    } catch (error) {
      console.error('Get audit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


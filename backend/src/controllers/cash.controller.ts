import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { CashClosing } from '../models/CashClosing';
import { PettyCash } from '../models/PettyCash';
import { Sale } from '../models/Sale';
import { CustomerDeposit } from '../models/CustomerDeposit';
import { AuthRequest } from '../middleware/auth.middleware';

export class CashController {
  async getClosings(req: Request, res: Response): Promise<void> {
    try {
      const closingRepository = AppDataSource.getRepository(CashClosing);
      const closings = await closingRepository.find({
        relations: ['user'],
        order: { timestamp: 'DESC' },
      });
      res.json(closings);
    } catch (error) {
      console.error('Get closings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getExpectedCash(req: Request, res: Response): Promise<void> {
    try {
      const closingRepository = AppDataSource.getRepository(CashClosing);
      const saleRepository = AppDataSource.getRepository(Sale);
      const depositRepository = AppDataSource.getRepository(CustomerDeposit);
      const pettyCashRepository = AppDataSource.getRepository(PettyCash);

      const closings = await closingRepository.find({ order: { timestamp: 'DESC' }, take: 1 });
      const lastClosing = closings[0];
      const lastTimestamp = lastClosing ? new Date(lastClosing.timestamp) : new Date(0);

      const sales = await saleRepository
        .createQueryBuilder('sale')
        .where('sale.timestamp > :timestamp', { timestamp: lastTimestamp })
        .andWhere('(sale.paymentMethod = :cash OR sale.paymentMethod = :mixed)', {
          cash: 'CASH',
          mixed: 'MIXED',
        })
        .getMany();
      const cashFromSales = sales.reduce((sum, s) => sum + Number(s.paidAmount), 0);

      const deposits = await depositRepository
        .createQueryBuilder('deposit')
        .where('deposit.timestamp > :timestamp', { timestamp: lastTimestamp })
        .andWhere('deposit.type = :type', { type: 'RETURN' })
        .getMany();
      const cashFromDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

      const pettyMovements = await pettyCashRepository
        .createQueryBuilder('petty')
        .where('petty.timestamp > :timestamp', { timestamp: lastTimestamp })
        .getMany();
      const pettyTotal = pettyMovements.reduce(
        (sum, m) => sum + (m.type === 'IN' ? Number(m.amount) : -Number(m.amount)),
        0
      );

      const expectedCash = cashFromSales + cashFromDeposits + pettyTotal;
      res.json({ expectedCash });
    } catch (error) {
      console.error('Get expected cash error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createClosing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const closingRepository = AppDataSource.getRepository(CashClosing);
      
      const closing = closingRepository.create({
        ...req.body,
        userId,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });
      const savedClosing = await closingRepository.save(closing);
      res.status(201).json(savedClosing);
    } catch (error: any) {
      console.error('Create closing error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Closing with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async getPettyCash(req: Request, res: Response): Promise<void> {
    try {
      const pettyCashRepository = AppDataSource.getRepository(PettyCash);
      const movements = await pettyCashRepository.find({
        relations: ['user'],
        order: { timestamp: 'DESC' },
      });
      res.json(movements);
    } catch (error) {
      console.error('Get petty cash error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async recordPettyCash(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      if (!req.body.amount || !req.body.type || !req.body.reason) {
        res.status(400).json({ error: 'Missing required fields: amount, type, reason' });
        return;
      }

      const pettyCashRepository = AppDataSource.getRepository(PettyCash);
      
      const movement = pettyCashRepository.create({
        ...req.body,
        userId,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });
      const savedMovement = await pettyCashRepository.save(movement);
      res.status(201).json(savedMovement);
    } catch (error: any) {
      console.error('Record petty cash error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Movement with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }
}

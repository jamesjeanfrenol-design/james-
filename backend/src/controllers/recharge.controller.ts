import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { RechargeType } from '../models/RechargeType';
import { RechargeStock } from '../models/RechargeStock';
import { RechargeSale } from '../models/RechargeSale';
import { AuthRequest } from '../middleware/auth.middleware';

export class RechargeController {
  // === Types de recharge ===
  async getTypes(req: Request, res: Response): Promise<void> {
    try {
      const repository = AppDataSource.getRepository(RechargeType);
      const types = await repository.find({
        order: { name: 'ASC' },
      });
      res.json(types);
    } catch (error) {
      console.error('Get recharge types error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createType(req: Request, res: Response): Promise<void> {
    try {
      const { name, provider } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const repository = AppDataSource.getRepository(RechargeType);
      const type = repository.create({ name, provider, isActive: true });
      const saved = await repository.save(type);

      // Créer le stock initial à 0
      const stockRepository = AppDataSource.getRepository(RechargeStock);
      const stock = stockRepository.create({
        rechargeTypeId: saved.id,
        quantity: 0,
      });
      await stockRepository.save(stock);

      res.status(201).json(saved);
    } catch (error) {
      console.error('Create recharge type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, provider, isActive } = req.body;

      const repository = AppDataSource.getRepository(RechargeType);
      const type = await repository.findOne({ where: { id: parseInt(id) } });

      if (!type) {
        res.status(404).json({ error: 'Recharge type not found' });
        return;
      }

      if (name) type.name = name;
      if (provider !== undefined) type.provider = provider;
      if (isActive !== undefined) type.isActive = isActive;

      const updated = await repository.save(type);
      res.json(updated);
    } catch (error) {
      console.error('Update recharge type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const repository = AppDataSource.getRepository(RechargeType);
      const result = await repository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'Recharge type not found' });
        return;
      }

      res.json({ message: 'Recharge type deleted' });
    } catch (error) {
      console.error('Delete recharge type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // === Stock de recharge ===
  async getStocks(req: Request, res: Response): Promise<void> {
    try {
      const repository = AppDataSource.getRepository(RechargeStock);
      const stocks = await repository.find({
        relations: ['rechargeType'],
        order: { rechargeType: { name: 'ASC' } },
      });
      res.json(stocks);
    } catch (error) {
      console.error('Get recharge stocks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addStock(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { rechargeTypeId, amount } = req.body;
      const userId = req.user?.id;

      if (!rechargeTypeId || !amount || amount <= 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'rechargeTypeId and positive amount are required' });
        return;
      }

      const stockRepository = queryRunner.manager.getRepository(RechargeStock);
      let stock = await stockRepository.findOne({
        where: { rechargeTypeId: parseInt(rechargeTypeId) },
      });

      if (!stock) {
        // Créer le stock s'il n'existe pas
        stock = stockRepository.create({
          rechargeTypeId: parseInt(rechargeTypeId),
          quantity: 0,
        });
      }

      stock.quantity = parseFloat(String(stock.quantity)) + parseFloat(String(amount));
      stock.lastUpdated = new Date();
      await stockRepository.save(stock);

      await queryRunner.commitTransaction();
      res.json(stock);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Add recharge stock error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }

  // === Ventes de recharge ===
  async getSales(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const repository = AppDataSource.getRepository(RechargeSale);
      
      let query = repository.createQueryBuilder('sale')
        .leftJoinAndSelect('sale.rechargeType', 'rechargeType')
        .leftJoinAndSelect('sale.customer', 'customer')
        .leftJoinAndSelect('sale.user', 'user');
      
      if (startDate && endDate) {
        query = query.where('sale.timestamp >= :startDate', { startDate: new Date(startDate as string) })
          .andWhere('sale.timestamp <= :endDate', { endDate: new Date(endDate as string) });
      }
      
      query = query.orderBy('sale.timestamp', 'DESC');
      
      const sales = await query.getMany();
      res.json(sales);
    } catch (error) {
      console.error('Get recharge sales error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createSale(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { rechargeTypeId, amount, customerId } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!rechargeTypeId || !amount || amount <= 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'rechargeTypeId and positive amount are required' });
        return;
      }

      if (!userId) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Vérifier le stock disponible
      const stockRepository = queryRunner.manager.getRepository(RechargeStock);
      const stock = await stockRepository.findOne({
        where: { rechargeTypeId: parseInt(rechargeTypeId) },
      });

      if (!stock || parseFloat(String(stock.quantity)) < parseFloat(String(amount))) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ 
          error: 'Stock insuffisant', 
          available: stock?.quantity || 0,
          requested: amount 
        });
        return;
      }

      // Créer la vente
      const saleRepository = queryRunner.manager.getRepository(RechargeSale);
      const sale = saleRepository.create({
        rechargeTypeId: parseInt(rechargeTypeId),
        amount: parseFloat(String(amount)),
        customerId: customerId ? parseInt(customerId) : undefined,
        userId,
        timestamp: new Date(),
      });
      const savedSale = await saleRepository.save(sale);

      // Déduire du stock
      stock.quantity = parseFloat(String(stock.quantity)) - parseFloat(String(amount));
      stock.lastUpdated = new Date();
      await stockRepository.save(stock);

      await queryRunner.commitTransaction();

      // Récupérer la vente complète avec relations
      const completeSale = await saleRepository.findOne({
        where: { id: savedSale.id },
        relations: ['rechargeType', 'customer', 'user'],
      });

      res.status(201).json(completeSale);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Create recharge sale error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }
}


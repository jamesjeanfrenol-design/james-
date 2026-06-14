import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Sale } from '../models/Sale';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { Customer } from '../models/Customer';

export class DashboardController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const saleRepository = AppDataSource.getRepository(Sale);
      const productRepository = AppDataSource.getRepository(Product);
      const movementRepository = AppDataSource.getRepository(StockMovement);
      const customerRepository = AppDataSource.getRepository(Customer);

      const { startDate: startDateParam, endDate: endDateParam } = req.query;
      const hasDateRange = !!(startDateParam && endDateParam);
      let startBound: Date | null = null;
      let endBound: Date | null = null;
      if (hasDateRange) {
        startBound = new Date(String(startDateParam));
        startBound.setHours(0, 0, 0, 0);
        endBound = new Date(String(endDateParam));
        endBound.setHours(23, 59, 59, 999);
      }

      // Today's sales (ou période si filtre)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let todaySalesQuery = saleRepository
        .createQueryBuilder('sale')
        .where('sale.timestamp >= :today', { today });
      if (hasDateRange) {
        todaySalesQuery = todaySalesQuery.andWhere('sale.timestamp <= :endBound', { endBound });
      }
      const todaySales = await todaySalesQuery.getMany();
      const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);

      // Ventes (toutes ou sur la période)
      let salesQuery = saleRepository.createQueryBuilder('sale');
      if (hasDateRange) {
        salesQuery = salesQuery
          .where('sale.timestamp >= :startBound', { startBound })
          .andWhere('sale.timestamp <= :endBound', { endBound });
      }
      const periodSales = await salesQuery.getMany();
      const totalSalesRevenue = periodSales.reduce((sum, s) => sum + Number(s.total), 0);

      // Total products
      const totalProducts = await productRepository.count();

      // Low stock products
      const lowStockProducts = await productRepository
        .createQueryBuilder('product')
        .where('(product.stockMagasin + product.stockPrincipal) <= product.minStock')
        .getMany();

      // Total losses (toutes ou sur la période)
      let lossesQuery = movementRepository
        .createQueryBuilder('movement')
        .where('movement.type = :type', { type: 'ADJUSTMENT' })
        .andWhere('movement.quantity < 0');
      if (hasDateRange) {
        lossesQuery = lossesQuery
          .andWhere('movement.timestamp >= :startBound', { startBound })
          .andWhere('movement.timestamp <= :endBound', { endBound });
      }
      const losses = await lossesQuery.getMany();
      const totalLosses = losses.reduce(
        (sum, m) => sum + Math.abs(Number(m.quantity)) * Number(m.valueAtTime || 0),
        0
      );

      // Expected cash + Paiement de solde
      const { CashClosing, CustomerDeposit, PettyCash } = await import('../models');
      const closingRepository = AppDataSource.getRepository(CashClosing);
      const depositRepository = AppDataSource.getRepository(CustomerDeposit);
      const pettyCashRepository = AppDataSource.getRepository(PettyCash);

      // Paiement de solde (tous ou sur la période)
      let returnDepositsQuery = depositRepository
        .createQueryBuilder('deposit')
        .where('deposit.type = :type', { type: 'RETURN' });
      if (hasDateRange) {
        returnDepositsQuery = returnDepositsQuery
          .andWhere('deposit.timestamp >= :startBound', { startBound })
          .andWhere('deposit.timestamp <= :endBound', { endBound });
      }
      const returnDeposits = await returnDepositsQuery.getMany();
      const totalBalancePayments = returnDeposits.reduce((sum, d) => sum + Number(d.amount), 0);

      // Total customer loans (negative balances)
      const customers = await customerRepository.find();
      const totalCustomerLoans = customers
        .filter(c => c.name !== 'Client au Comptant')
        .reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(Number(c.balance)) : 0), 0);

      const closings = await closingRepository.find({ order: { timestamp: 'DESC' }, take: 1 });
      const lastClosing = closings[0];
      const lastTimestamp = lastClosing ? new Date(lastClosing.timestamp) : new Date(0);

      const cashSales = todaySales.filter(
        s => (s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED')
      );
      const cashFromSales = cashSales.reduce((sum, s) => sum + Number(s.paidAmount), 0);

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

      res.json({
        todayRevenue: hasDateRange ? totalSalesRevenue : todayRevenue,
        todaySalesCount: hasDateRange ? periodSales.length : todaySales.length,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        totalLosses,
        totalCustomerLoans,
        expectedCash,
        totalSalesRevenue,
        totalBalancePayments,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


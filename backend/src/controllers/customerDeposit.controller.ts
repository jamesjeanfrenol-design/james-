import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { CustomerDeposit } from '../models/CustomerDeposit';
import { Customer } from '../models/Customer';

export class CustomerDepositController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const depositRepository = AppDataSource.getRepository(CustomerDeposit);
      const deposits = await depositRepository.find({
        relations: ['customer'],
        order: { timestamp: 'DESC' },
      });
      res.json(deposits);
    } catch (error) {
      console.error('Get deposits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const depositData = req.body;
      
      // Validation
      if (!depositData.customerId || !depositData.amount || !depositData.type) {
        res.status(400).json({ error: 'Missing required fields: customerId, amount, type' });
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return;
      }

      const depositRepository = queryRunner.manager.getRepository(CustomerDeposit);
      const customerRepository = queryRunner.manager.getRepository(Customer);

      // Ne pas inclure l'ID - il sera généré automatiquement
      const { id, ...depositFields } = depositData;
      
      const deposit = depositRepository.create({
        ...depositFields,
        customerId: parseInt(String(depositData.customerId), 10),
        amount: parseFloat(String(depositData.amount)),
        type: depositData.type,
        reason: depositData.reason || '',
        timestamp: depositData.timestamp ? new Date(depositData.timestamp) : new Date(),
      });
      const savedDeposit = await depositRepository.save(deposit);

      // Update customer balance
      const customerId = parseInt(String(depositData.customerId), 10);
      const customer = await customerRepository.findOne({ where: { id: customerId } });
      if (customer) {
        const currentBalance = parseFloat(String(customer.balance)) || 0;
        const amount = parseFloat(String(depositData.amount)) || 0;
        
        // Pour RETURN: on ajoute le montant (réduit la dette)
        // Pour LOAN: on soustrait le montant (augmente la dette)
        const balanceChange = depositData.type === 'LOAN' ? -amount : amount;
        const newBalance = currentBalance + balanceChange;
        
        customer.balance = newBalance;
        await customerRepository.save(customer);
        
        console.log(`Customer balance updated: Customer ID ${customerId}, Type: ${depositData.type}, Amount: ${amount}, Old Balance: ${currentBalance}, New Balance: ${newBalance}`);
      } else {
        throw new Error(`Customer with id ${customerId} not found`);
      }

      await queryRunner.commitTransaction();
      res.status(201).json(savedDeposit);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Create deposit error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }
}


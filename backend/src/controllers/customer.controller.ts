import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../models/Customer';

export class CustomerController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const customerRepository = AppDataSource.getRepository(Customer);
      const customers = await customerRepository.find({
        order: { name: 'ASC' },
      });
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ where: { id: parseInt(id) } });

      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }

      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const customerRepository = AppDataSource.getRepository(Customer);
      
      // Validate required fields
      if (!req.body.name || !req.body.phone) {
        res.status(400).json({ error: 'Missing required fields: name, phone' });
        return;
      }

      const customerData = {
        ...req.body,
        balance: req.body.balance || 0,
        tags: req.body.tags || [],
        createdAt: new Date(),
      };

      const customer = customerRepository.create(customerData);
      const savedCustomer = await customerRepository.save(customer);
      res.status(201).json(savedCustomer);
    } catch (error: any) {
      console.error('Create customer error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Customer with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ where: { id: parseInt(id) } });

      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }

      Object.assign(customer, req.body);
      const updatedCustomer = await customerRepository.save(customer);
      res.json(updatedCustomer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerRepository = AppDataSource.getRepository(Customer);
      const result = await customerRepository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }

      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


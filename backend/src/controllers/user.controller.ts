import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export class UserController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({
        order: { name: 'ASC' },
      });
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      if (!req.body.name || !req.body.email || !req.body.password) {
        res.status(400).json({ error: 'Missing required fields: name, email, password' });
        return;
      }

      // Check if email already exists
      const existingUser = await userRepository.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        res.status(400).json({ error: 'User with this email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = userRepository.create({
        ...req.body,
        password: hashedPassword,
        createdAt: new Date(),
      });
      const savedUser = await userRepository.save(user) as unknown as User;
      const { password, ...userWithoutPassword } = savedUser;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'User with this ID or email already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updateData: any = { ...req.body };
      if (req.body.password) {
        updateData.password = await bcrypt.hash(req.body.password, 10);
      }

      Object.assign(user, updateData);
      const updatedUser = await userRepository.save(user);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);
      const result = await userRepository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


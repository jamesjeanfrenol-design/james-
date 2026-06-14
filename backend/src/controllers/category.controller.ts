import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../models/Category';

export class CategoryController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      const categories = await categoryRepository.find({
        order: { name: 'ASC' },
      });
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      
      if (!req.body.name) {
        res.status(400).json({ error: 'Missing required field: name' });
        return;
      }

      const category = categoryRepository.create({
        ...req.body,
      });
      const savedCategory = await categoryRepository.save(category);
      res.status(201).json(savedCategory);
    } catch (error: any) {
      console.error('Create category error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Category with this ID already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const categoryRepository = AppDataSource.getRepository(Category);
      const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      Object.assign(category, req.body);
      const updatedCategory = await categoryRepository.save(category);
      res.json(updatedCategory);
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const categoryRepository = AppDataSource.getRepository(Category);
      const result = await categoryRepository.delete(parseInt(id));

      if (result.affected === 0) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../models/Product';
import { Unit } from '../models/Unit';
import { Category } from '../models/Category';
import { ProductUnitConversion } from '../models/ProductUnitConversion';

export class ProductController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const productRepository = AppDataSource.getRepository(Product);
      const products = await productRepository.find({
        relations: ['category', 'unit', 'purchaseUnit', 'unitConversions', 'unitConversions.unit'],
      });
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const productRepository = AppDataSource.getRepository(Product);
      const product = await productRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['category', 'unit', 'purchaseUnit', 'unitConversions', 'unitConversions.unit'],
      });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getConversions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const conversionRepository = AppDataSource.getRepository(ProductUnitConversion);
      const conversions = await conversionRepository.find({
        where: { productId: parseInt(id) },
        relations: ['unit'],
        order: { conversionRatio: 'ASC' },
      });

      // S'assurer que les valeurs décimales sont bien converties en nombres
      const serializedConversions = conversions.map(conv => ({
        id: conv.id,
        productId: conv.productId,
        unitId: conv.unitId,
        conversionRatio: typeof conv.conversionRatio === 'string' 
          ? parseFloat(conv.conversionRatio) 
          : (conv.conversionRatio || 1),
        customPrice: conv.customPrice !== null && conv.customPrice !== undefined
          ? (typeof conv.customPrice === 'string' ? parseFloat(conv.customPrice) : conv.customPrice)
          : null,
        isDefault: conv.isDefault || false,
        unit: conv.unit,
      }));

      res.json(serializedConversions);
    } catch (error) {
      console.error('Get conversions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const productRepository = AppDataSource.getRepository(Product);
      
      // Parse JSON body if it's a string (from FormData)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // If parsing fails, use body as is
        }
      }
      
      // Validate required fields
      if (!body.name || !body.sku) {
        res.status(400).json({ error: 'Missing required fields: name, sku' });
        return;
      }

      // Get default values from database if not provided
      const unitRepository = AppDataSource.getRepository(Unit);
      const categoryRepository = AppDataSource.getRepository(Category);
      
      let defaultUnitId = body.unitId;
      let defaultCategoryId = body.categoryId;
      
      if (!defaultUnitId) {
        const defaultUnit = await unitRepository.findOne({});
        defaultUnitId = defaultUnit?.id || 1;
      }
      
      if (!defaultCategoryId) {
        const defaultCategory = await categoryRepository.findOne({});
        defaultCategoryId = defaultCategory?.id || 1;
      }

      // Handle image upload - only accept file uploads, not base64
      let imagePath = null;
      if (req.file) {
        imagePath = `/uploads/products/${req.file.filename}`;
      } else if (body.image && body.image.startsWith('/uploads/')) {
        // If it's already a valid path, keep it
        imagePath = body.image;
      }
      // Ignore base64 images - we only accept file uploads

      // Ensure purchaseUnitId is set (default to unitId if not provided)
      const productData = {
        ...body,
        purchaseUnitId: body.purchaseUnitId || defaultUnitId,
        unitId: defaultUnitId,
        categoryId: defaultCategoryId,
        conversionRatio: body.conversionRatio || 1,
        stockMagasin: body.stockMagasin || 0,
        stockPrincipal: body.stockPrincipal || 0,
        minStock: body.minStock || 0,
        price: body.price || 0,
        wholesalePrice: body.wholesalePrice || 0,
        wholesaleThreshold: body.wholesaleThreshold || 0,
        costPrice: body.costPrice || 0,
        barcode: body.barcode || '',
        image: imagePath,
      };

      const product = productRepository.create(productData);
      const savedProduct = await productRepository.save(product) as unknown as Product;
      
      // Gérer les conversions d'unités si fournies
      const conversionRepository = AppDataSource.getRepository(ProductUnitConversion);
      
      if (body.unitConversions && Array.isArray(body.unitConversions) && body.unitConversions.length > 0) {
        console.log('Create product - Processing unitConversions:', body.unitConversions);
        
        // Créer les conversions fournies
        for (const convData of body.unitConversions) {
          // S'assurer que les valeurs sont correctement converties
          const unitId = typeof convData.unitId === 'string' ? parseInt(convData.unitId, 10) : (convData.unitId || 0);
          const conversionRatio = typeof convData.conversionRatio === 'string' 
            ? parseFloat(convData.conversionRatio) 
            : (convData.conversionRatio || 1);
          const customPrice = convData.customPrice !== null && convData.customPrice !== undefined && convData.customPrice !== ''
            ? (typeof convData.customPrice === 'string' ? parseFloat(convData.customPrice) : convData.customPrice)
            : null;
          const isDefault = convData.isDefault === 'true' || convData.isDefault === true || convData.isDefault === 1;
          
          console.log('Create product - Creating conversion:', {
            unitId,
            conversionRatio,
            customPrice,
            isDefault
          });
          
          const conversion = conversionRepository.create({
            productId: savedProduct.id,
            unitId,
            conversionRatio,
            customPrice,
            isDefault,
          });
          await conversionRepository.save(conversion);
        }
      } else {
        // Créer automatiquement les conversions pour unit_id et purchase_unit_id si elles n'existent pas
        const conversionRepository = AppDataSource.getRepository(ProductUnitConversion);
        
        // Vérifier si des conversions existent déjà
        const existingConversions = await conversionRepository.find({
          where: { productId: savedProduct.id },
        });
        
        if (existingConversions.length === 0) {
          // Créer conversion pour l'unité principale (ratio = 1, is_default = true)
          const mainConversion = conversionRepository.create({
            productId: savedProduct.id,
            unitId: savedProduct.unitId,
            conversionRatio: 1,
            isDefault: true,
          });
          await conversionRepository.save(mainConversion);
          
          // Créer conversion pour l'unité d'achat si différente
          if (savedProduct.purchaseUnitId !== savedProduct.unitId) {
            const purchaseConversion = conversionRepository.create({
              productId: savedProduct.id,
              unitId: savedProduct.purchaseUnitId,
              conversionRatio: parseFloat(String(savedProduct.conversionRatio)) || 1,
              isDefault: false,
            });
            await conversionRepository.save(purchaseConversion);
          }
        }
      }
      
      // Fetch with relations
      const productWithRelations = await productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['category', 'unit', 'purchaseUnit', 'unitConversions', 'unitConversions.unit'],
      });
      
      if (!productWithRelations) {
        res.status(500).json({ error: 'Failed to retrieve created product' });
        return;
      }
      
      res.status(201).json(productWithRelations);
    } catch (error: any) {
      console.error('Create product error:', error);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({ error: 'Invalid category, unit, or purchaseUnit reference. Make sure they exist in the database.' });
      } else if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Product with this SKU or barcode already exists' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const productRepository = AppDataSource.getRepository(Product);
      const product = await productRepository.findOne({ where: { id: parseInt(id) } });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Le body est déjà parsé par multer et parseFormDataFields
      // Multer parse automatiquement les champs texte du FormData dans req.body
      const body = req.body;
      
      // Debug: afficher les valeurs reçues
      console.log('Update product - Received body:', {
        unitId: body.unitId,
        purchaseUnitId: body.purchaseUnitId,
        categoryId: body.categoryId,
        type_unitId: typeof body.unitId,
        type_purchaseUnitId: typeof body.purchaseUnitId,
        type_categoryId: typeof body.categoryId,
        hasFile: !!req.file,
        allKeys: Object.keys(body)
      });

      // Ensure purchaseUnitId is set if unitId is provided
      const updateData: any = { ...body };
      
      // Ne pas inclure l'ID dans updateData - il est déjà dans l'URL
      delete updateData.id;
      
      // Ne pas inclure les objets relationnels (category, unit, purchaseUnit, unitConversions)
      delete updateData.category;
      delete updateData.unit;
      delete updateData.purchaseUnit;
      delete updateData.unitConversions; // Géré séparément
      
      // Les valeurs sont déjà converties en nombres par parseFormDataFields
      // On doit juste s'assurer qu'elles sont valides et non NULL
      // Si elles sont absentes ou invalides, on garde les valeurs existantes
      if ('unitId' in updateData) {
        const unitIdValue = typeof updateData.unitId === 'number' ? updateData.unitId : parseInt(String(updateData.unitId), 10);
        if (isNaN(unitIdValue) || unitIdValue === 0 || unitIdValue === null || unitIdValue === undefined) {
          // Garder la valeur existante si la nouvelle est invalide
          delete updateData.unitId;
          console.log('Update product - Keeping existing unitId:', product.unitId);
        } else {
          updateData.unitId = unitIdValue;
          console.log('Update product - Using new unitId:', unitIdValue);
        }
      }
      
      if ('purchaseUnitId' in updateData) {
        const purchaseUnitIdValue = typeof updateData.purchaseUnitId === 'number' ? updateData.purchaseUnitId : parseInt(String(updateData.purchaseUnitId), 10);
        if (isNaN(purchaseUnitIdValue) || purchaseUnitIdValue === 0 || purchaseUnitIdValue === null || purchaseUnitIdValue === undefined) {
          // Garder la valeur existante si la nouvelle est invalide
          delete updateData.purchaseUnitId;
          console.log('Update product - Keeping existing purchaseUnitId:', product.purchaseUnitId);
        } else {
          updateData.purchaseUnitId = purchaseUnitIdValue;
          console.log('Update product - Using new purchaseUnitId:', purchaseUnitIdValue);
        }
      }
      
      if ('categoryId' in updateData) {
        const categoryIdValue = typeof updateData.categoryId === 'number' ? updateData.categoryId : parseInt(String(updateData.categoryId), 10);
        if (isNaN(categoryIdValue) || categoryIdValue === 0 || categoryIdValue === null || categoryIdValue === undefined) {
          // Garder la valeur existante si la nouvelle est invalide
          delete updateData.categoryId;
          console.log('Update product - Keeping existing categoryId:', product.categoryId);
        } else {
          updateData.categoryId = categoryIdValue;
          console.log('Update product - Using new categoryId:', categoryIdValue);
        }
      }
      
      // S'assurer que purchaseUnitId est défini si unitId est fourni
      if (updateData.unitId && !updateData.purchaseUnitId) {
        updateData.purchaseUnitId = updateData.unitId;
      }
      
      // Debug: afficher les valeurs qui seront mises à jour
      console.log('Update product - Final update data:', {
        unitId: updateData.unitId,
        purchaseUnitId: updateData.purchaseUnitId,
        categoryId: updateData.categoryId,
        existingProduct: {
          unitId: product.unitId,
          purchaseUnitId: product.purchaseUnitId,
          categoryId: product.categoryId
        },
        willUpdate: {
          unitId: 'unitId' in updateData,
          purchaseUnitId: 'purchaseUnitId' in updateData,
          categoryId: 'categoryId' in updateData
        }
      });
      
      // Handle image upload - only accept file uploads, not base64
      if (req.file) {
        updateData.image = `/uploads/products/${req.file.filename}`;
        // Supprimer l'ancienne image si elle existe
        if (product.image && product.image.startsWith('/uploads/')) {
          const fs = require('fs');
          const path = require('path');
          const oldImagePath = path.join(__dirname, '../..', product.image);
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }
        }
      } else if ('image' in body) {
        if (body.image && body.image.startsWith('/uploads/')) {
          // Si c'est un chemin valide, le garder
          updateData.image = body.image;
        } else if (!body.image || body.image === '') {
          // Si l'image est vide, la supprimer
          if (product.image && product.image.startsWith('/uploads/')) {
            const fs = require('fs');
            const path = require('path');
            const oldImagePath = path.join(__dirname, '../..', product.image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Error deleting old image:', err);
              }
            }
          }
          updateData.image = null;
        }
      }

      Object.assign(product, updateData);
      const updatedProduct = await productRepository.save(product);
      
      // Gérer les conversions d'unités si fournies
      const conversionRepository = AppDataSource.getRepository(ProductUnitConversion);
      
      if (body.unitConversions && Array.isArray(body.unitConversions) && body.unitConversions.length > 0) {
        console.log('Update product - Processing unitConversions:', body.unitConversions);
        
        // Supprimer les anciennes conversions
        await conversionRepository.delete({ productId: updatedProduct.id });
        
        // Créer les nouvelles conversions
        for (const convData of body.unitConversions) {
          // S'assurer que les valeurs sont correctement converties
          const unitId = typeof convData.unitId === 'string' ? parseInt(convData.unitId, 10) : (convData.unitId || 0);
          const conversionRatio = typeof convData.conversionRatio === 'string' 
            ? parseFloat(convData.conversionRatio) 
            : (convData.conversionRatio || 1);
          const customPrice = convData.customPrice !== null && convData.customPrice !== undefined && convData.customPrice !== ''
            ? (typeof convData.customPrice === 'string' ? parseFloat(convData.customPrice) : convData.customPrice)
            : null;
          const isDefault = convData.isDefault === 'true' || convData.isDefault === true || convData.isDefault === 1;
          
          console.log('Update product - Creating conversion:', {
            unitId,
            conversionRatio,
            customPrice,
            isDefault
          });
          
          const conversion = conversionRepository.create({
            productId: updatedProduct.id,
            unitId,
            conversionRatio,
            customPrice,
            isDefault,
          });
          await conversionRepository.save(conversion);
        }
      } else {
        // Si aucune conversion n'est fournie, ne pas supprimer les existantes
        // (pour permettre la mise à jour d'autres champs sans perdre les conversions)
        console.log('Update product - No unitConversions provided, keeping existing ones');
      }
      
      // Fetch with relations
      const productWithRelations = await productRepository.findOne({
        where: { id: updatedProduct.id },
        relations: ['category', 'unit', 'purchaseUnit', 'unitConversions', 'unitConversions.unit'],
      });
      
      res.json(productWithRelations);
    } catch (error: any) {
      console.error('Update product error:', error);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({ error: 'Invalid category, unit, or purchaseUnit reference' });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { id } = req.params;
      const productId = parseInt(id);
      const productRepository = queryRunner.manager.getRepository(Product);
      const product = await productRepository.findOne({ where: { id: productId } });

      if (!product) {
        await queryRunner.rollbackTransaction();
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Supprimer les enregistrements liés avant de supprimer le produit
      const { StockMovement } = await import('../models/StockMovement');
      const { SaleItem } = await import('../models/SaleItem');
      const { InventoryAuditItem } = await import('../models/InventoryAuditItem');
      
      const stockMovementRepository = queryRunner.manager.getRepository(StockMovement);
      const saleItemRepository = queryRunner.manager.getRepository(SaleItem);
      const inventoryAuditItemRepository = queryRunner.manager.getRepository(InventoryAuditItem);
      const conversionRepository = queryRunner.manager.getRepository(ProductUnitConversion);

      // Supprimer les mouvements de stock
      await stockMovementRepository.delete({ productId });
      
      // Supprimer les items de vente (les ventes elles-mêmes sont conservées)
      await saleItemRepository.delete({ productId });
      
      // Supprimer les items d'audit d'inventaire
      await inventoryAuditItemRepository.delete({ productId });

      // Supprimer les conversions d'unités (déjà en CASCADE, mais on le fait explicitement)
      await conversionRepository.delete({ productId });

      // Supprimer l'image associée si elle existe
      if (product.image && product.image.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '../..', product.image);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.error('Error deleting product image:', err);
          }
        }
      }

      // Supprimer le produit
      await productRepository.delete(productId);

      await queryRunner.commitTransaction();
      res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Delete product error:', error);
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        res.status(400).json({ 
          error: 'Cannot delete product: it is still referenced in other records. Please contact an administrator.',
          details: error.message
        });
      } else {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    } finally {
      await queryRunner.release();
    }
  }
}


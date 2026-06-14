import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { AuthRequest } from '../middleware/auth.middleware';

export class InventoryController {
  async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const movementRepository = AppDataSource.getRepository(StockMovement);
      const movements = await movementRepository.find({
        relations: ['product', 'user'],
        order: { timestamp: 'DESC' },
      });
      res.json(movements);
    } catch (error) {
      console.error('Get movements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async recordAdjustment(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productId, quantity, type, reason, warehouse = 'Principal' } = req.body;
      const userId = req.user?.id || req.body.userId;

      const productRepository = queryRunner.manager.getRepository(Product);
      const product = await productRepository.findOne({ where: { id: productId } });

      if (!product) {
        await queryRunner.rollbackTransaction();
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Convertir la quantité en nombre (gérer les virgules)
      const adjQty = type === 'IN' ? parseFloat(String(quantity)) : -parseFloat(String(quantity));

      // Mettre à jour le stock selon le dépôt choisi
      if (warehouse === 'Principal') {
        product.stockPrincipal += adjQty;
      } else if (warehouse === 'Magasin') {
        product.stockMagasin += adjQty;
      }

      await productRepository.save(product);

      const movementRepository = queryRunner.manager.getRepository(StockMovement);
      const movement = movementRepository.create({
        productId: product.id,
        type: 'ADJUSTMENT',
        quantity: adjQty,
        reason,
        userId,
        fromWarehouse: warehouse,
        timestamp: new Date(),
        valueAtTime: product.costPrice,
      });
      await movementRepository.save(movement);

      await queryRunner.commitTransaction();
      res.json(movement);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Record adjustment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }

  async bulkRestock(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, userId, supplierId } = req.body;

      if (!items || items.length === 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'Items are required' });
        return;
      }

      const actualUserId = req.user?.id || userId;
      if (!actualUserId) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const productRepository = queryRunner.manager.getRepository(Product);
      const movementRepository = queryRunner.manager.getRepository(StockMovement);

      for (const item of items) {
        if (!item.productId || !item.quantity) {
          continue; // Skip invalid items
        }

        const product = await productRepository.findOne({ where: { id: item.productId } });
        if (product) {
          // Convertir la quantité de l'unité d'achat vers l'unité de vente
          // La quantité reçue est dans l'unité d'achat (purchaseUnit)
          // On doit la convertir en unité de vente (unit) en utilisant conversionRatio
          const quantityInPurchaseUnit = parseFloat(String(item.quantity));
          const conversionRatio = parseFloat(String(product.conversionRatio)) || 1;
          const quantityInSaleUnit = Math.round(quantityInPurchaseUnit * conversionRatio);

          // Ajouter au stock magasin (en unité de vente)
          product.stockMagasin += quantityInSaleUnit;
          await productRepository.save(product);

          // Enregistrer le mouvement avec la quantité en unité d'achat pour traçabilité
          const movement = movementRepository.create({
            productId: product.id,
            type: 'IN',
            quantity: quantityInPurchaseUnit, // Quantité en unité d'achat pour référence
            reason: `Réception Fournisseur (Magasin) - ID: ${supplierId} - ${quantityInPurchaseUnit} (unité achat) = ${quantityInSaleUnit} (unité vente, ratio: ${conversionRatio})`,
            userId: actualUserId,
            toWarehouse: 'Magasin',
            timestamp: new Date(),
            valueAtTime: product.costPrice,
          });
          await movementRepository.save(movement);
        }
      }

      await queryRunner.commitTransaction();
      res.json({ message: 'Bulk restock completed' });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Bulk restock error:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }

  async processTransfer(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { fromWarehouseId, toWarehouseId, items, userId } = req.body;

      if (!fromWarehouseId || !toWarehouseId || !items || items.length === 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'Missing required fields: fromWarehouseId, toWarehouseId, items' });
        return;
      }

      const actualUserId = req.user?.id || userId;
      if (!actualUserId) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const productRepository = queryRunner.manager.getRepository(Product);
      const movementRepository = queryRunner.manager.getRepository(StockMovement);

      // Récupérer les dépôts pour déterminer la direction du transfert
      const { Warehouse } = await import('../models/Warehouse');
      const warehouseRepository = queryRunner.manager.getRepository(Warehouse);
      const fromWarehouseIdNum = parseInt(String(fromWarehouseId), 10);
      const toWarehouseIdNum = parseInt(String(toWarehouseId), 10);

      console.log(`Transfer request - From ID: ${fromWarehouseIdNum}, To ID: ${toWarehouseIdNum}`);

      const fromWarehouse = await warehouseRepository.findOne({ where: { id: fromWarehouseIdNum } });
      const toWarehouse = await warehouseRepository.findOne({ where: { id: toWarehouseIdNum } });

      if (!fromWarehouse || !toWarehouse) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({
          error: 'Invalid warehouse IDs',
          fromWarehouseId: fromWarehouseIdNum,
          toWarehouseId: toWarehouseIdNum,
          fromWarehouseFound: !!fromWarehouse,
          toWarehouseFound: !!toWarehouse
        });
        return;
      }

      console.log(`Warehouses found - From: ${fromWarehouse.name}, To: ${toWarehouse.name}`);

      // Déterminer la direction du transfert basée sur les noms des dépôts
      const isFromMagasin = fromWarehouse.name === 'Magasin' || fromWarehouse.name.toLowerCase().includes('magasin');
      const isToPrincipal = toWarehouse.name === 'Principal' || toWarehouse.name.toLowerCase().includes('principal');
      const isFromPrincipal = fromWarehouse.name === 'Principal' || fromWarehouse.name.toLowerCase().includes('principal');
      const isToMagasin = toWarehouse.name === 'Magasin' || toWarehouse.name.toLowerCase().includes('magasin');

      console.log(`Transfer direction - FromMagasin: ${isFromMagasin}, ToPrincipal: ${isToPrincipal}, FromPrincipal: ${isFromPrincipal}, ToMagasin: ${isToMagasin}`);

      if (!((isFromMagasin && isToPrincipal) || (isFromPrincipal && isToMagasin))) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: `Invalid transfer direction: ${fromWarehouse.name} -> ${toWarehouse.name}. Only transfers between Magasin and Principal are allowed.` });
        return;
      }

      // Vérifier le stock disponible avant de procéder au transfert
      for (const item of items) {
        const product = await productRepository.findOne({ where: { id: item.productId } });
        if (!product) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ error: `Product with id ${item.productId} not found` });
          return;
        }

        // Vérifier le stock disponible selon le dépôt source
        let availableStock = 0;
        if (isFromMagasin && isToPrincipal) {
          availableStock = parseFloat(String(product.stockMagasin)) || 0;
        } else if (isFromPrincipal && isToMagasin) {
          availableStock = parseFloat(String(product.stockPrincipal)) || 0;
        }

        const requestedQuantity = parseFloat(String(item.quantity)) || 0;

        console.log(`Transfer check - Product: ${product.name}, From: ${fromWarehouse.name}, To: ${toWarehouse.name}, Available: ${availableStock}, Requested: ${requestedQuantity}`);

        if (availableStock < requestedQuantity) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({
            error: `Stock insuffisant pour "${product.name}"`,
            productName: product.name,
            requested: requestedQuantity,
            available: availableStock,
            warehouse: fromWarehouse.name
          });
          return;
        }
      }

      // Si toutes les validations passent, procéder au transfert
      for (const item of items) {
        const product = await productRepository.findOne({ where: { id: item.productId } });
        if (product) {
          const transferQuantity = parseFloat(String(item.quantity)) || 0;
          const currentStockMagasin = parseFloat(String(product.stockMagasin)) || 0;
          const currentStockPrincipal = parseFloat(String(product.stockPrincipal)) || 0;

          if (isFromMagasin && isToPrincipal) {
            product.stockMagasin = currentStockMagasin - transferQuantity;
            product.stockPrincipal = currentStockPrincipal + transferQuantity;
          } else if (isFromPrincipal && isToMagasin) {
            product.stockPrincipal = currentStockPrincipal - transferQuantity;
            product.stockMagasin = currentStockMagasin + transferQuantity;
          }
          await productRepository.save(product);

          const movement = movementRepository.create({
            productId: product.id,
            type: 'TRANSFER',
            quantity: item.quantity,
            reason: `Transfert Interne #${req.body.id || 'TRANSFER'} - ${fromWarehouse.name} -> ${toWarehouse.name}`,
            userId: actualUserId,
            fromWarehouse: fromWarehouse.name,
            toWarehouse: toWarehouse.name,
            timestamp: new Date(),
          });
          await movementRepository.save(movement);
        }
      }

      await queryRunner.commitTransaction();
      res.json({ message: 'Transfer completed' });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Process transfer error:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }

  async syncPhysicalInventory(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { countData, warehouse = 'Principal' } = req.body;
      const rawUserId = req.user?.id ?? req.body.userId;
      const userId = typeof rawUserId === 'number' ? rawUserId : parseInt(String(rawUserId), 10);

      if (!countData || !Array.isArray(countData) || countData.length === 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'countData doit être un tableau non vide' });
        return;
      }
      if (isNaN(userId) || userId <= 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'User ID invalide. Connectez-vous puis réessayez.' });
        return;
      }
      const depot = warehouse === 'Magasin' ? 'Magasin' : 'Principal';

      const productRepository = queryRunner.manager.getRepository(Product);
      const movementRepository = queryRunner.manager.getRepository(StockMovement);
      const { InventoryAudit, InventoryAuditItem } = await import('../models');

      const auditRepository = queryRunner.manager.getRepository(InventoryAudit);
      const auditItemRepository = queryRunner.manager.getRepository(InventoryAuditItem);

      const audit = auditRepository.create({
        userId,
        timestamp: new Date(),
      });
      const savedAudit = await auditRepository.save(audit);

      const auditItems = [];

      for (const item of countData) {
        const productId = typeof item.productId === 'number' ? item.productId : parseInt(String(item.productId), 10);
        if (isNaN(productId)) continue;

        const product = await productRepository.findOne({ where: { id: productId } });
        if (product) {
          const systemQty = depot === 'Magasin'
            ? (parseFloat(String(product.stockMagasin)) || 0)
            : (parseFloat(String(product.stockPrincipal)) || 0);
          const physicalQty = parseFloat(String(item.physicalQty)) || 0;
          const diff = physicalQty - systemQty;

          const auditItem = auditItemRepository.create({
            auditId: savedAudit.id,
            productId: product.id,
            productName: product.name,
            systemQty: Math.round(systemQty),
            physicalQty: Math.round(physicalQty),
            difference: Math.round(diff),
          });
          await auditItemRepository.save(auditItem);
          auditItems.push(auditItem);

          if (diff !== 0) {
            if (depot === 'Magasin') {
              product.stockMagasin = Math.max(0, (parseFloat(String(product.stockMagasin)) || 0) + diff);
            } else {
              product.stockPrincipal = Math.max(0, (parseFloat(String(product.stockPrincipal)) || 0) + diff);
            }
            await productRepository.save(product);

            const movement = movementRepository.create({
              productId: product.id,
              type: 'ADJUSTMENT',
              quantity: diff,
              reason: `Audit Inventaire Physique (${depot})`,
              userId,
              fromWarehouse: depot,
              timestamp: new Date(),
              valueAtTime: product.costPrice,
            });
            await movementRepository.save(movement);
          }
        }
      }

      await queryRunner.commitTransaction();
      res.json({ ...savedAudit, items: auditItems });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Sync physical inventory error:', error);
      res.status(500).json({ error: error?.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }
}


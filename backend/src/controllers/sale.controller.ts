import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Sale } from '../models/Sale';
import { SaleItem } from '../models/SaleItem';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { StockMovement } from '../models/StockMovement';
import { ProductUnitConversion } from '../models/ProductUnitConversion';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateUnitPrice, convertToBaseUnit, findBaseUnit } from '../services/priceCalculation.service';

export class SaleController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const saleRepository = AppDataSource.getRepository(Sale);
      const { startDate, endDate, customerId } = req.query;

      let query = saleRepository.createQueryBuilder('sale')
        .leftJoinAndSelect('sale.user', 'user')
        .leftJoinAndSelect('sale.customer', 'customer')
        .leftJoinAndSelect('sale.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('items.saleUnit', 'saleUnit');

      const cid = customerId ? parseInt(String(customerId), 10) : NaN;
      const hasCustomer = !isNaN(cid);
      const hasDateRange = !!(startDate && endDate);

      if (hasCustomer) {
        query = query.where('sale.customerId = :customerId', { customerId: cid });
      }
      if (hasDateRange) {
        const start = new Date(String(startDate));
        start.setHours(0, 0, 0, 0);
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        if (hasCustomer) {
          query = query.andWhere('sale.timestamp >= :startDate', { startDate: start })
            .andWhere('sale.timestamp <= :endDate', { endDate: end });
        } else {
          query = query.where('sale.timestamp >= :startDate', { startDate: start })
            .andWhere('sale.timestamp <= :endDate', { endDate: end });
        }
      }

      query = query.orderBy('sale.timestamp', 'DESC');

      const sales = await query.getMany();
      res.json(sales);
    } catch (error) {
      console.error('Get sales error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const saleRepository = AppDataSource.getRepository(Sale);
      const { startDate, endDate } = req.query;

      let query = saleRepository.createQueryBuilder('sale');

      if (startDate && endDate) {
        const start = new Date(String(startDate));
        start.setHours(0, 0, 0, 0);
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        query = query.where('sale.timestamp >= :startDate', { startDate: start })
          .andWhere('sale.timestamp <= :endDate', { endDate: end });
      }

      const sales = await query.getMany();

      // Calculer les totaux par type de paiement
      const report = {
        totalSales: sales.length,
        totalAmount: 0,
        byPaymentMethod: {
          CASH: { count: 0, amount: 0 },
          CARD: { count: 0, amount: 0 },
          MOBILE: { count: 0, amount: 0 },
          BALANCE: { count: 0, amount: 0 },
          MIXED: { count: 0, amount: 0 },
        },
        sales: sales
      };

      sales.forEach(sale => {
        const amount = parseFloat(String(sale.total)) || 0;
        report.totalAmount += amount;

        const method = sale.paymentMethod as keyof typeof report.byPaymentMethod;
        if (report.byPaymentMethod[method]) {
          report.byPaymentMethod[method].count++;
          report.byPaymentMethod[method].amount += amount;
        }
      });

      res.json(report);
    } catch (error) {
      console.error('Get sales report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const saleRepository = AppDataSource.getRepository(Sale);
      const sale = await saleRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['user', 'customer', 'items', 'items.product', 'items.saleUnit'],
      });

      if (!sale) {
        res.status(404).json({ error: 'Sale not found' });
        return;
      }

      res.json(sale);
    } catch (error) {
      console.error('Get sale error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saleData = req.body;
      const userId = req.user?.id || saleData.userId;

      // Log des données reçues pour débogage
      console.log('📥 Données de vente reçues:', {
        userId,
        itemsCount: saleData.items?.length || 0,
        items: saleData.items?.map((item: any) => ({
          productId: item.productId,
          saleUnitId: item.saleUnitId,
          quantity: item.quantity,
          key: `${item.productId}-${item.saleUnitId || 'undefined'}`
        }))
      });

      if (!userId) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      if (!saleData.items || saleData.items.length === 0) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ error: 'Sale must have at least one item' });
        return;
      }

      // Extract items and other data to prevent auto-insertion via cascade
      const { items, ...saleFields } = saleData;

      // Create sale (ID will be auto-generated)
      const saleRepository = queryRunner.manager.getRepository(Sale);
      const sale = saleRepository.create({
        ...saleFields,
        userId,
        timestamp: saleData.timestamp ? new Date(saleData.timestamp) : new Date(),
      });
      const savedSale = await saleRepository.save(sale) as unknown as Sale;

      // Create sale items and update stock
      const saleItemRepository = queryRunner.manager.getRepository(SaleItem);
      const productRepository = queryRunner.manager.getRepository(Product);
      const stockMovementRepository = queryRunner.manager.getRepository(StockMovement);

      const conversionRepository = queryRunner.manager.getRepository(ProductUnitConversion);

      // Dictionnaire pour suivre les produits déjà traités (éviter les doublons)
      // Clé: "productId-saleUnitId", Valeur: { product, quantityInSaleUnit, saleItemData }
      const processedItems = new Map<string, {
        product: Product;
        quantityInSaleUnit: number;
        saleItemData: {
          quantity: number;
          price: number;
          discount: number;
          unitType: string;
          saleUnitId: number | undefined;
        };
      }>();

      // D'abord, charger tous les produits nécessaires pour éviter les rechargements multiples
      const productIds: number[] = [];
      const seenIds = new Set<number>();
      for (const item of saleData.items || []) {
        const id = parseInt(String(item.productId), 10);
        if (isNaN(id)) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ error: `Invalid product ID: ${item.productId}` });
          return;
        }
        if (!seenIds.has(id)) {
          productIds.push(id);
          seenIds.add(id);
        }
      }
      const loadedProducts = new Map<number, Product>();
      for (const productId of productIds) {
        const product = await productRepository.findOne({
          where: { id: productId },
          lock: { mode: 'pessimistic_write' }
        });
        if (!product) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ error: `Product with id ${productId} not found` });
          return;
        }
        loadedProducts.set(productId, product);
      }

      for (const itemData of saleData.items || []) {
        // Convertir productId en nombre pour s'assurer du type
        const productId = parseInt(String(itemData.productId), 10);
        if (isNaN(productId)) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ error: `Invalid product ID in item: ${itemData.productId}` });
          return;
        }

        // Déterminer l'unité utilisée pour la vente AVANT de créer la clé
        let saleUnitId: number | undefined = itemData.saleUnitId ? parseInt(String(itemData.saleUnitId), 10) : undefined;
        let unitType = itemData.unitType || 'SALE';

        // Charger le produit depuis le cache
        const product = loadedProducts.get(productId);
        if (!product) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ error: `Product with id ${productId} not found` });
          return;
        }

        // Si saleUnitId n'est pas fourni, utiliser l'unité par défaut
        if (!saleUnitId) {
          if (unitType === 'PURCHASE') {
            saleUnitId = product.purchaseUnitId;
          } else {
            saleUnitId = product.unitId;
          }
        }

        // S'assurer que saleUnitId est défini (ne devrait jamais être undefined à ce point)
        if (!saleUnitId) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ error: `Unable to determine sale unit for product ${productId}` });
          return;
        }

        // Créer la clé finale avec le saleUnitId déterminé (IMPORTANT: après avoir déterminé saleUnitId)
        const itemKey = `${productId}-${saleUnitId}`;

        // Charger les conversions d'unités
        const conversions = await conversionRepository.find({
          where: { productId: product.id },
          relations: ['unit'],
        });

        // Calculer le prix unitaire selon l'unité choisie
        let unitPrice = itemData.price;
        if (!unitPrice && saleUnitId) {
          unitPrice = await calculateUnitPrice(product, saleUnitId, conversions);
        }

        // Convertir la quantité vendue vers l'unité principale pour la déduction du stock
        // IMPORTANT: Le stock est toujours géré dans l'unité principale (product.unitId)
        let quantityInMainUnit = itemData.quantity;

        // Si l'unité de vente est différente de l'unité principale, convertir
        if (saleUnitId !== product.unitId) {
          if (conversions.length > 0) {
            // Convertir directement de l'unité de vente vers l'unité principale
            const saleConversion = conversions.find(c => c.unitId === saleUnitId);
            const mainConversion = conversions.find(c => c.unitId === product.unitId);

            if (saleConversion && mainConversion) {
              const saleRatio = parseFloat(String(saleConversion.conversionRatio)) || 1;
              const mainRatio = parseFloat(String(mainConversion.conversionRatio)) || 1;
              // Conversion directe: quantité_vendue * (ratio_vente / ratio_principal)
              // Exemple: 4 unités avec ratio 20 vendues, unité principale ratio 1
              // = 4 * (20 / 1) = 80 unités principales
              quantityInMainUnit = itemData.quantity * (saleRatio / mainRatio);
            } else {
              // Fallback: convertir via unité de base si les conversions ne sont pas trouvées
              const quantityInBaseUnit = convertToBaseUnit(itemData.quantity, saleUnitId, conversions);
              const baseUnitId = findBaseUnit(conversions) || product.unitId;
              if (baseUnitId !== product.unitId) {
                const baseConversion = conversions.find(c => c.unitId === baseUnitId);
                const mainConversion = conversions.find(c => c.unitId === product.unitId);
                if (baseConversion && mainConversion) {
                  const baseRatio = parseFloat(String(baseConversion.conversionRatio)) || 1;
                  const mainRatio = parseFloat(String(mainConversion.conversionRatio)) || 1;
                  quantityInMainUnit = (quantityInBaseUnit / baseRatio) * mainRatio;
                } else {
                  // Dernier fallback: utiliser directement la quantité de base
                  quantityInMainUnit = quantityInBaseUnit;
                }
              } else {
                quantityInMainUnit = quantityInBaseUnit;
              }
            }
          } else if (unitType === 'PURCHASE') {
            // Fallback vers l'ancien système si pas de conversions
            const conversionRatio = parseFloat(String(product.conversionRatio)) || 1;
            quantityInMainUnit = itemData.quantity * conversionRatio;
          }
          // Si pas de conversions et pas PURCHASE, on garde la quantité telle quelle
        }
        // Si saleUnitId === product.unitId, on garde itemData.quantity (déjà assigné)

        // S'assurer que quantityInMainUnit est un nombre valide et positif
        quantityInMainUnit = Math.max(0, parseFloat(String(quantityInMainUnit)) || 0);

        console.log(`🔄 Conversion stock - Produit ${product.id}: qte_vendue=${itemData.quantity}, unité_vente=${saleUnitId}, qte_principal=${quantityInMainUnit}`);

        // Accumuler les données pour ce produit/unité (gérer les doublons)
        console.log(`🔍 Traitement item: clé=${itemKey}, productId=${productId}, saleUnitId=${saleUnitId}, quantity=${itemData.quantity}`);

        if (processedItems.has(itemKey)) {
          // Si le produit/unité a déjà été traité, accumuler les quantités
          const existing = processedItems.get(itemKey)!;
          console.log(`⚠️ DOUBLON DÉTECTÉ! Clé existante: ${itemKey}, quantité existante: ${existing.saleItemData.quantity}, nouvelle quantité: ${itemData.quantity}`);
          existing.quantityInSaleUnit += quantityInMainUnit; // Accumuler en unité principale
          existing.saleItemData.quantity += itemData.quantity; // Quantité affichée (entière)
          // Garder le prix le plus récent ou moyen (on garde le dernier)
          existing.saleItemData.price = unitPrice;
          existing.saleItemData.discount = Math.max(existing.saleItemData.discount, itemData.discount || 0);
          console.log(`📦 Item dupliqué fusionné: ${itemKey}, nouvelle quantité totale: ${existing.saleItemData.quantity}, quantité stock: ${existing.quantityInSaleUnit}`);
        } else {
          // Première fois qu'on traite ce produit/unité
          processedItems.set(itemKey, {
            product,
            quantityInSaleUnit: quantityInMainUnit, // Stocker en unité principale
            saleItemData: {
              quantity: itemData.quantity,
              price: unitPrice,
              discount: itemData.discount || 0,
              unitType: unitType,
              saleUnitId: saleUnitId,
            }
          });
          console.log(`✅ Nouvel item ajouté à processedItems: ${itemKey}, quantité: ${itemData.quantity}, quantité stock: ${quantityInMainUnit}`);
        }
      }

      // Maintenant, créer un seul sale_item par produit/unité unique
      // Vérifier qu'il n'y a pas de doublons avant de créer
      console.log(`📋 Total items traités (après regroupement): ${processedItems.size}`);
      console.log(`📋 Clés des items traités:`, Array.from(processedItems.keys()));

      const createdItemKeys = new Set<string>();
      let itemsCreated = 0;
      for (const [itemKey, { saleItemData }] of processedItems.entries()) {
        // Vérifier qu'on n'a pas déjà créé un item avec cette clé
        if (createdItemKeys.has(itemKey)) {
          console.warn(`⚠️ Doublon détecté et ignoré: ${itemKey}`);
          continue;
        }

        const productId = parseInt(itemKey.split('-')[0], 10);
        const saleUnitIdFromKey = parseInt(itemKey.split('-')[1], 10);

        // S'assurer que saleUnitId est défini (utiliser celui de la clé si saleItemData.saleUnitId est undefined)
        const finalSaleUnitId = saleItemData.saleUnitId || saleUnitIdFromKey;

        console.log(`🔨 Création sale_item: clé=${itemKey}, productId=${productId}, saleUnitId=${finalSaleUnitId}, quantity=${saleItemData.quantity}`);

        const saleItem = saleItemRepository.create({
          saleId: savedSale.id,
          productId: productId,
          quantity: saleItemData.quantity, // Quantité totale (entière)
          price: saleItemData.price,
          discount: saleItemData.discount,
          unitType: saleItemData.unitType as 'SALE' | 'PURCHASE',
          saleUnitId: finalSaleUnitId,
        });
        await saleItemRepository.save(saleItem);
        createdItemKeys.add(itemKey);
        itemsCreated++;
        console.log(`✅ Sale item créé #${itemsCreated}: produit=${saleItem.productId}, unité=${saleItem.saleUnitId}, quantité=${saleItem.quantity}, id=${saleItem.id}`);
      }

      console.log(`📊 Total sale_items créés: ${itemsCreated} (devrait être égal à ${processedItems.size})`);

      // Maintenant, mettre à jour le stock pour chaque produit unique (une seule fois par produit)
      // Regrouper par productId (même si plusieurs unités différentes pour le même produit)
      const stockUpdates = new Map<number, number>();
      for (const [itemKey, { quantityInSaleUnit }] of processedItems.entries()) {
        const productId = parseInt(itemKey.split('-')[0], 10);
        const qty = parseFloat(String(quantityInSaleUnit)) || 0;
        console.log(`📦 Accumulation stock - Produit ${productId}: quantité=${qty} (unité principale)`);
        if (stockUpdates.has(productId)) {
          stockUpdates.set(productId, stockUpdates.get(productId)! + qty);
        } else {
          stockUpdates.set(productId, qty);
        }
      }

      console.log(`📊 Total produits à mettre à jour: ${stockUpdates.size}`);
      for (const [productId, totalQuantityInSaleUnit] of stockUpdates.entries()) {
        // Recharger le produit depuis la base pour avoir les dernières valeurs
        // Utiliser le repository de la transaction pour s'assurer que les changements sont dans la transaction
        const currentProduct = await productRepository.findOne({
          where: { id: productId },
          lock: { mode: 'pessimistic_write' }
        });

        if (!currentProduct) {
          console.error(`❌ Product ${productId} not found when updating stock`);
          continue;
        }

        // Stock actuel avant déduction
        const stockBefore = parseFloat(String(currentProduct.stockPrincipal)) || 0;
        const qtyToDeduct = parseFloat(String(totalQuantityInSaleUnit)) || 0;

        console.log(`🔄 Mise à jour stock - Produit ${productId}: stock avant=${stockBefore}, quantité à déduire=${qtyToDeduct}`);

        // Vérifier que la quantité à déduire est valide
        if (qtyToDeduct <= 0) {
          console.warn(`⚠️ Quantité invalide pour produit ${productId}: ${qtyToDeduct}`);
          continue;
        }

        // Calculer le nouveau stock
        const newStock = stockBefore - qtyToDeduct;
        if (newStock < 0) {
          console.warn(`⚠️ Stock insuffisant pour le produit ${productId}: stock actuel=${stockBefore}, quantité demandée=${qtyToDeduct}`);
          // Ne pas bloquer la vente, mais avertir
        }

        // Mettre à jour le stock
        const stockAfter = Math.max(0, newStock);
        currentProduct.stockPrincipal = stockAfter;
        console.log(`💾 Avant sauvegarde - Produit ${productId}: stockPrincipal=${currentProduct.stockPrincipal}`);

        const savedProduct = await productRepository.save(currentProduct);

        console.log(`✅ Stock mis à jour pour produit ${productId}: ${stockBefore} -> ${savedProduct.stockPrincipal} (déduit: ${qtyToDeduct})`);

        // Vérification après sauvegarde
        if (parseFloat(String(savedProduct.stockPrincipal)) !== stockAfter) {
          console.error(`❌ ERREUR: Le stock n'a pas été correctement sauvegardé! Attendu: ${stockAfter}, Obtenu: ${savedProduct.stockPrincipal}`);
        }

        // Enregistrer le mouvement de stock (une seule fois par produit)
        const movement = stockMovementRepository.create({
          productId: productId,
          type: 'OUT',
          quantity: qtyToDeduct,
          reason: `Vente #${savedSale.id}`,
          userId,
          fromWarehouse: 'Principal',
          timestamp: new Date(),
          valueAtTime: currentProduct.costPrice,
        });
        await stockMovementRepository.save(movement);
        console.log(`📝 Mouvement de stock enregistré pour produit ${productId}: ${qtyToDeduct}`);
      }

      // Update customer balance if credit or payment from balance
      if (saleData.customerId) {
        const customerId = parseInt(String(saleData.customerId), 10);
        if (!isNaN(customerId)) {
          const customerRepository = queryRunner.manager.getRepository(Customer);
          const customer = await customerRepository.findOne({ where: { id: customerId } });

          if (customer) {
            let balanceChange = 0;

            // Si crédit (reste à payer)
            if (saleData.creditAmount > 0) {
              balanceChange -= parseFloat(String(saleData.creditAmount));
            }

            // Si paiement depuis le solde du client
            if (saleData.paymentMethod === 'BALANCE') {
              balanceChange -= parseFloat(String(saleData.total));
            }

            // Mettre à jour le solde si nécessaire
            if (balanceChange !== 0) {
              customer.balance = parseFloat(String(customer.balance)) + balanceChange;
              await customerRepository.save(customer);
              console.log(`Customer balance updated: Customer ID ${customerId}, Change: ${balanceChange}, New Balance: ${customer.balance}`);
            }
          } else {
            console.warn(`Customer with id ${customerId} not found for balance update`);
          }
        } else {
          console.warn(`Invalid customerId: ${saleData.customerId}`);
        }
      }

      console.log(`💾 Commit de la transaction pour la vente #${savedSale.id}`);
      await queryRunner.commitTransaction();
      console.log(`✅ Transaction commitée avec succès`);

      // Fetch complete sale with relations
      const completeSale = await saleRepository.findOne({
        where: { id: savedSale.id },
        relations: ['user', 'customer', 'items', 'items.product', 'items.saleUnit'],
      });

      if (!completeSale) {
        res.status(500).json({ error: 'Failed to retrieve created sale' });
        return;
      }

      console.log(`📦 Vente complète récupérée: ${completeSale.items.length} items dans la vente`);
      console.log(`📦 Détails des items:`, completeSale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        saleUnitId: item.saleUnitId,
        quantity: item.quantity
      })));

      res.status(201).json(completeSale);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Create sale error:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      await queryRunner.release();
    }
  }
}

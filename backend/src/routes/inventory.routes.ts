import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();
const inventoryController = new InventoryController();

router.get('/movements', inventoryController.getMovements.bind(inventoryController));
router.post('/adjustments', inventoryController.recordAdjustment.bind(inventoryController));
router.post('/bulk-restock', inventoryController.bulkRestock.bind(inventoryController));
router.post('/transfer', inventoryController.processTransfer.bind(inventoryController));
router.post('/sync-physical', inventoryController.syncPhysicalInventory.bind(inventoryController));

export default router;


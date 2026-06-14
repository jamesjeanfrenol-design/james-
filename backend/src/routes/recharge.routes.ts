import { Router } from 'express';
import { RechargeController } from '../controllers/recharge.controller';

const router = Router();
const controller = new RechargeController();

// Types de recharge
router.get('/types', (req, res) => controller.getTypes(req, res));
router.post('/types', (req, res) => controller.createType(req, res));
router.put('/types/:id', (req, res) => controller.updateType(req, res));
router.delete('/types/:id', (req, res) => controller.deleteType(req, res));

// Stock
router.get('/stocks', (req, res) => controller.getStocks(req, res));
router.post('/stocks/add', (req, res) => controller.addStock(req, res));

// Ventes
router.get('/sales', (req, res) => controller.getSales(req, res));
router.post('/sales', (req, res) => controller.createSale(req, res));

export default router;


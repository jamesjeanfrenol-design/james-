import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';

const router = Router();
const saleController = new SaleController();

router.get('/report', saleController.getSalesReport.bind(saleController));
router.get('/', saleController.getAll.bind(saleController));
router.get('/:id', saleController.getById.bind(saleController));
router.post('/', saleController.create.bind(saleController));

export default router;


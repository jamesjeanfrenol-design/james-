import { Router } from 'express';
import { SupplierController } from '../controllers/supplier.controller';

const router = Router();
const supplierController = new SupplierController();

router.get('/', supplierController.getAll.bind(supplierController));
router.post('/', supplierController.create.bind(supplierController));
router.put('/:id', supplierController.update.bind(supplierController));
router.delete('/:id', supplierController.delete.bind(supplierController));

export default router;


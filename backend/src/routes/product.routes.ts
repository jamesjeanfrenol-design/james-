import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { uploadProductImage, parseFormDataFields } from '../middleware/upload.middleware';

const router = Router();
const productController = new ProductController();

router.get('/', productController.getAll.bind(productController));
router.get('/:id', productController.getById.bind(productController));
router.get('/:id/conversions', productController.getConversions.bind(productController));
router.post('/', uploadProductImage, parseFormDataFields, productController.create.bind(productController));
router.put('/:id', uploadProductImage, parseFormDataFields, productController.update.bind(productController));
router.delete('/:id', productController.delete.bind(productController));

export default router;


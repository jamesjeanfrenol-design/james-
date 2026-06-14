import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import saleRoutes from './sale.routes';
import customerRoutes from './customer.routes';
import customerDepositRoutes from './customerDeposit.routes';
import inventoryRoutes from './inventory.routes';
import categoryRoutes from './category.routes';
import unitRoutes from './unit.routes';
import supplierRoutes from './supplier.routes';
import warehouseRoutes from './warehouse.routes';
import userRoutes from './user.routes';
import cashRoutes from './cash.routes';
import auditRoutes from './audit.routes';
import dashboardRoutes from './dashboard.routes';
import rechargeRoutes from './recharge.routes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use(authMiddleware);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
// IMPORTANT: deposits doit être avant customers pour éviter les conflits de routage
router.use('/customers/deposits', customerDepositRoutes);
router.use('/customers', customerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/categories', categoryRoutes);
router.use('/units', unitRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/users', userRoutes);
router.use('/cash', cashRoutes);
router.use('/audits', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/recharge', rechargeRoutes);

export default router;


import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', dashboardController.getStats.bind(dashboardController));

export default router;


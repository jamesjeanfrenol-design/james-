import { Router } from 'express';
import { CashController } from '../controllers/cash.controller';

const router = Router();
const cashController = new CashController();

router.get('/expected', cashController.getExpectedCash.bind(cashController));
router.get('/closings', cashController.getClosings.bind(cashController));
router.post('/closings', cashController.createClosing.bind(cashController));
router.get('/petty-cash', cashController.getPettyCash.bind(cashController));
router.post('/petty-cash', cashController.recordPettyCash.bind(cashController));

export default router;


import { Router } from 'express';
import { CustomerDepositController } from '../controllers/customerDeposit.controller';

const router = Router();
const depositController = new CustomerDepositController();

router.get('/', depositController.getAll.bind(depositController));
router.post('/', depositController.create.bind(depositController));

export default router;


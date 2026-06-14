import { Router } from 'express';
import { UnitController } from '../controllers/unit.controller';

const router = Router();
const unitController = new UnitController();

router.get('/', unitController.getAll.bind(unitController));
router.post('/', unitController.create.bind(unitController));
router.put('/:id', unitController.update.bind(unitController));
router.delete('/:id', unitController.delete.bind(unitController));

export default router;


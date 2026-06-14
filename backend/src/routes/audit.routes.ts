import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';

const router = Router();
const auditController = new AuditController();

router.get('/', auditController.getAll.bind(auditController));
router.get('/:id', auditController.getById.bind(auditController));

export default router;


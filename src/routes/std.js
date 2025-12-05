import express from 'express';
import { stdController } from '../controllers/stdController.js';
import { authenticateToken, requireStudent } from '../middlewares/auth.js';

const router = express.Router();

router.post('/select/pull', authenticateToken, requireStudent, stdController.pullCard);
router.post('/select/pull/shuffle', authenticateToken, requireStudent, stdController.swapCredit);
router.post('/select/pull/steal', authenticateToken, requireStudent, stdController.stealCredit);

export default router;

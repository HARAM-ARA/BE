import express from 'express';
import { stdController } from '../controllers/stdController.js';
import { typingController } from '../controllers/typingController.js';
import { enforceController } from '../controllers/enforceController.js';
import { authenticateToken, requireStudent } from '../middlewares/auth.js';

const router = express.Router();

router.get('/account', authenticateToken, requireStudent, stdController.getAccount);
router.post('/select/pull', authenticateToken, requireStudent, stdController.pullCard);
router.post('/select/pull/shuffle', authenticateToken, requireStudent, stdController.swapCredit);
router.post('/select/pull/steal', authenticateToken, requireStudent, stdController.stealCredit);
router.post('/select/pull/anger', authenticateToken, requireStudent, stdController.angerReset);

// 타자게임
router.get('/typing/game', authenticateToken, typingController.getGame);
router.post('/typing/input', authenticateToken, requireStudent, typingController.submitInput);
router.get('/typing/time', authenticateToken, typingController.getTime);
router.get('/typing/rank', authenticateToken, typingController.getRank);

// 상점
router.post('/store', authenticateToken, requireStudent, stdController.purchaseStore);

// 강화
router.get('/enforce/data', authenticateToken, enforceController.getEnforceData);
router.post('/enforce', authenticateToken, enforceController.attemptEnforce);
router.delete('/enforce', authenticateToken, enforceController.sellAccount);
router.post('/enforce/buy', authenticateToken, enforceController.buyTier);
router.post('/enforce/credit', authenticateToken, enforceController.convertToCredit);

export default router;

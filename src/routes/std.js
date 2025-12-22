import express from 'express';
import { stdController } from '../controllers/stdController.js';
import { typingController } from '../controllers/typingController.js';
import { enforceController } from '../controllers/enforceController.js';
import { authenticateToken, requireStudent } from '../middlewares/auth.js';

const router = express.Router();


/**
 * @swagger
 * /std/account:
 *   get:
 *     summary: 내 계정 정보 조회 (학생 전용)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 계정 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     credit:
 *                       type: integer
 *       401:
 *         description: 인증 실패
 */
router.get('/account', authenticateToken, requireStudent, stdController.getAccount);

/**
 * @swagger
 * /std/select/pull:
 *   post:
 *     summary: 카드 뽑기 (학생 전용)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card
 *             properties:
 *               card:
 *                 type: integer
 *                 description: 선택한 카드 번호
 *     responses:
 *       200:
 *         description: 카드 뽑기 성공
 *       400:
 *         description: 잘못된 요청
 */
router.post('/select/pull', authenticateToken, requireStudent, stdController.pullCard);

/**
 * @swagger
 * /std/select/pull/shuffle:
 *   post:
 *     summary: 크레딧 섞기 (학생 전용)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetTeamId
 *             properties:
 *               targetTeamId:
 *                 type: integer
 *                 description: 대상 팀 ID
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/select/pull/shuffle', authenticateToken, requireStudent, stdController.swapCredit);

/**
 * @swagger
 * /std/select/pull/steal:
 *   post:
 *     summary: 크레딧 훔치기 (학생 전용)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetTeamId
 *             properties:
 *               targetTeamId:
 *                 type: integer
 *                 description: 대상 팀 ID
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/select/pull/steal', authenticateToken, requireStudent, stdController.stealCredit);

/**
 * @swagger
 * /std/select/pull/anger:
 *   post:
 *     summary: 분노 리셋 (학생 전용)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetTeamId
 *             properties:
 *               targetTeamId:
 *                 type: integer
 *                 description: 대상 팀 ID
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/select/pull/anger', authenticateToken, requireStudent, stdController.angerReset);

// 타자게임

/**
 * @swagger
 * /std/typing/game:
 *   get:
 *     summary: 현재 진행 중인 타자게임 조회
 *     tags: [Typing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 진행 중인 게임 없음
 */
router.get('/typing/game', authenticateToken, typingController.getGame);

/**
 * @swagger
 * /std/typing/input:
 *   post:
 *     summary: 타자게임 입력 제출 (학생 전용)
 *     tags: [Typing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - input
 *               - gameId
 *             properties:
 *               input:
 *                 type: string
 *               gameId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/typing/input', authenticateToken, requireStudent, typingController.submitInput);

/**
 * @swagger
 * /std/typing/time:
 *   get:
 *     summary: 서버 시간 조회
 *     tags: [Typing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/typing/time', authenticateToken, typingController.getTime);

/**
 * @swagger
 * /std/typing/rank:
 *   get:
 *     summary: 현재 게임 등수 조회
 *     tags: [Typing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/typing/rank', authenticateToken, typingController.getRank);

// 상점

/**
 * @swagger
 * /std/store:
 *   post:
 *     summary: 상점 물품 구매 (학생 전용)
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/store', authenticateToken, requireStudent, stdController.purchaseStore);

// 강화

/**
 * @swagger
 * /std/enforce/data:
 *   get:
 *     summary: 강화 데이터 조회
 *     tags: [Enforce]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/enforce/data', authenticateToken, enforceController.getEnforceData);

/**
 * @swagger
 * /std/enforce:
 *   post:
 *     summary: 강화 시도
 *     tags: [Enforce]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/enforce', authenticateToken, enforceController.attemptEnforce);

/**
 * @swagger
 * /std/enforce:
 *   delete:
 *     summary: 계정 판매 (초기화)
 *     tags: [Enforce]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.delete('/enforce', authenticateToken, enforceController.sellAccount);

/**
 * @swagger
 * /std/enforce/buy:
 *   post:
 *     summary: 티어 구매
 *     tags: [Enforce]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tier
 *             properties:
 *               tier:
 *                 type: number
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/enforce/buy', authenticateToken, enforceController.buyTier);

/**
 * @swagger
 * /std/enforce/credit:
 *   post:
 *     summary: 강화 포인트를 크레딧으로 전환
 *     tags: [Enforce]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.post('/enforce/credit', authenticateToken, enforceController.convertToCredit);

export default router;

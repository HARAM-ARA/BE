import express from 'express';
import { getTeams } from '../controllers/teamController.js';
import { storeController } from '../controllers/storeController.js';
import { getAccount } from '../controllers/tchController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /haram/account:
 *   get:
 *     summary: 모든 팀 크레딧 조회 (인증 불필요)
 *     tags: [Team]
 *     responses:
 *       200:
 *         description: 팀 크레딧 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teamName:
 *                         type: string
 *                       teamId:
 *                         type: integer
 *                       teamCredit:
 *                         type: integer
 *       404:
 *         description: 팀을 찾을 수 없음
 */
router.get('/account', getAccount);

/**
 * @swagger
 * /haram/team:
 *   get:
 *     summary: 전체 팀 목록 조회
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 팀 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teamId:
 *                         type: integer
 *                         description: 팀 ID
 *                         example: 1
 *                       teamName:
 *                         type: string
 *                         description: 팀 이름
 *                         example: 아라
 *                       teamCredit:
 *                         type: integer
 *                         description: 팀 크레딧
 *                         example: 3000
 *       400:
 *         description: 잘못된 요청입니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 잘못된 요청입니다.
 *       401:
 *         description: 토큰 누락 또는 무효
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 토큰이 누락됐습니다.
 */
router.get('/team', authenticateToken, getTeams);

/**
 * @swagger
 * /haram/store:
 *   get:
 *     summary: 상점 물품 전체 조회 (인증 불필요)
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: 물품 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId:
 *                         type: integer
 *                       itemName:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image:
 *                         type: string
 *                       price:
 *                         type: integer
 *                       quantity:
 *                         type: integer
 *                       type:
 *                         type: integer
 *       404:
 *         description: 물품이 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.get('/store', storeController.getAllItems);

/**
 * @swagger
 * /haram/store/{type}:
 *   get:
 *     summary: 타입별 상점 물품 조회 (인증 불필요)
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: 물품 타입 (1=쿠폰, 2=간식)
 *     responses:
 *       200:
 *         description: 물품 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId:
 *                         type: integer
 *                       itemName:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image:
 *                         type: string
 *                       price:
 *                         type: integer
 *                       quantity:
 *                         type: integer
 *                       type:
 *                         type: integer
 *       400:
 *         description: 타입이 잘못됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: TYPE_ERROR
 *                 message:
 *                   type: string
 *                   example: 타입이 잘못 입력되었습니다.
 *       404:
 *         description: 물품이 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: 아무런 물품이 존재하지 않습니다.
 */
router.get('/store/:type', storeController.getItemsByType);

export default router;

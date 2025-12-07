import express from 'express';
import { getTeams } from '../controllers/teamController.js';
import { storeController } from '../controllers/storeController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

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

export default router;

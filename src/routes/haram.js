import express from 'express';
import { getTeams } from '../controllers/teamController.js';
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

export default router;

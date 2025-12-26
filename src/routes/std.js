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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gameId:
 *                   type: integer
 *                   description: 게임 ID
 *                   example: 1
 *                 words:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 타자 단어 목록
 *                   example: ["apple", "banana", "cherry", "date", "elderberry"]
 *                 startTime:
 *                   type: integer
 *                   description: 게임 시작 시간 (ms timestamp)
 *                   example: 1640000000000
 *                 endTime:
 *                   type: integer
 *                   description: 게임 종료 시간 (ms timestamp)
 *                   example: 1640000600000
 *                 canJoin:
 *                   type: boolean
 *                   description: 참가 가능 여부 (팀에서 이미 참가한 경우 false)
 *                   example: true
 *       404:
 *         description: 진행 중인 게임 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: NO_ACTIVE_GAME
 *                 message:
 *                   type: string
 *                   example: 현재 진행 중인 게임이 없습니다.
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

// 팀

/**
 * @swagger
 * /std/team/leader:
 *   post:
 *     summary: 팀장 설정 (학생 전용)
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student
 *             properties:
 *               student:
 *                 type: integer
 *                 description: 팀장으로 지정할 학생의 userId (DB id)
 *                 example: 1
 *     responses:
 *       200:
 *         description: 팀장 설정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 팀장을 설정했습니다.
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: BAD_REQUEST
 *                 message:
 *                   type: string
 *                   example: 잘못된 요청입니다.
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: INVALID_TOKEN
 *                 message:
 *                   type: string
 *                   example: 토큰이 유효하지 않습니다.
 *       403:
 *         description: 권한 부족 또는 팀 미소속
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: NON_EXIST_TEAM
 *                 message:
 *                   type: string
 *                   example: 팀에 소속되어 있지 않습니다.
 *       404:
 *         description: 존재하지 않는 학생이거나 팀원이 아님
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
 *                   example: 존재하지 않는 학생입니다.
 *       409:
 *         description: 팀장이 이미 설정됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: ALREADY_EXIST
 *                 message:
 *                   type: string
 *                   example: 팀장이 이미 있습니다.
 */
router.post('/team/leader', authenticateToken, requireStudent, stdController.setTeamLeader);

export default router;

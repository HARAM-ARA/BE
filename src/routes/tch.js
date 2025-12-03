import express from 'express';
import {
  getAllStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/tchController.js';
import { authenticateToken, requireTeacher } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /tch/store:
 *   get:
 *     summary: 모든 상점 조회
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: 상점 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stores:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Store'
 */
router.get('/store', getAllStores);

/**
 * @swagger
 * /tch/store/{id}:
 *   get:
 *     summary: 특정 상점 조회
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 상점 ID
 *     responses:
 *       200:
 *         description: 상점 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     store:
 *                       $ref: '#/components/schemas/Store'
 *       404:
 *         description: 상점을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/store/:id', getStore);

/**
 * @swagger
 * /tch/store:
 *   post:
 *     summary: 상점 생성 (교사 전용)
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
 *               - name
 *               - price
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 description: 상점 이름
 *               price:
 *                 type: number
 *                 description: 가격
 *               quantity:
 *                 type: integer
 *                 description: 수량
 *               imageUrl:
 *                 type: string
 *                 description: 이미지 URL
 *     responses:
 *       201:
 *         description: 상점 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     store:
 *                       $ref: '#/components/schemas/Store'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (교사만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/store', authenticateToken, requireTeacher, createStore);

/**
 * @swagger
 * /tch/store/{id}:
 *   put:
 *     summary: 상점 수정 (교사 전용)
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 상점 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 상점 이름
 *               price:
 *                 type: number
 *                 description: 가격
 *               quantity:
 *                 type: integer
 *                 description: 수량
 *               imageUrl:
 *                 type: string
 *                 description: 이미지 URL
 *     responses:
 *       200:
 *         description: 상점 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     store:
 *                       $ref: '#/components/schemas/Store'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 상점을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/store/:id', authenticateToken, requireTeacher, updateStore);

/**
 * @swagger
 * /tch/store/{id}:
 *   delete:
 *     summary: 상점 삭제 (교사 전용)
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 상점 ID
 *     responses:
 *       200:
 *         description: 상점 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 상점을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/store/:id', authenticateToken, requireTeacher, deleteStore);

export default router;

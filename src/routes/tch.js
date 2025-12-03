import express from 'express';
import {
  getAllStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/tchController.js';
import { appendStudents, getTeam } from '../controllers/teamController.js';
import { authenticateToken, requireTeacher } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.get('/store', getAllStores);
router.get('/store/:id', getStore);
router.post('/store', authenticateToken, requireTeacher, createStore);
router.put('/store/:id', authenticateToken, requireTeacher, updateStore);
router.delete('/store/:id', authenticateToken, requireTeacher, deleteStore);

/**
 * @swagger
 * /tch/append:
 *   post:
 *     summary: 학생 팀 정보 일괄 등록 (교사 전용)
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 학생 팀 정보가 담긴 XLSX 파일 (TEAM_NUMBER, CLASS_NUMBER, NAME 컬럼 필수)
 *     responses:
 *       200:
 *         description: 학생 팀 정보 등록 성공
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
 *                       example: 학생 팀 정보가 성공적으로 등록되었습니다
 *                     sumStudent:
 *                       type: integer
 *                       description: 총 등록된 학생 수
 *                       example: 25
 *       400:
 *         description: 파일 누락 또는 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: FILE_MISSING
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
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: UNAUTHORIZED
 *       409:
 *         description: 중복된 사용자 ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: DUPLICATE_USER_ID
 *       415:
 *         description: 지원하지 않는 파일 형식
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: UNSUPPORTED_FILE_TYPE
 */
router.post('/append', authenticateToken, requireTeacher, upload.single('file'), appendStudents);

/**
 * @swagger
 * /tch/team/{id}:
 *   get:
 *     summary: 팀 정보 조회
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 팀 ID
 *     responses:
 *       200:
 *         description: 팀 정보 조회 성공
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
 *                     team:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         team_number:
 *                           type: integer
 *                         class_number:
 *                           type: integer
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           email:
 *                             type: string
 *                           name:
 *                             type: string
 *       404:
 *         description: 팀을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/team/:id', getTeam);

export default router;

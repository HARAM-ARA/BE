import express from 'express';
import {
  getAllStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/tchController.js';
import { appendStudents, getTeam, addSingleStudent, createTeam } from '../controllers/teamController.js';
import { getAllStudents } from '../controllers/userController.js';
import { authenticateToken, requireTeacher } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

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

/**
 * @swagger
 * /tch/student:
 *   get:
 *     summary: 학생 전체 조회 (교사 전용)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 학생 전체 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 학생 전체 조회 성공
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                         description: 학생 학번
 *                         example: 1201
 *                       name:
 *                         type: string
 *                         description: 학생 이름
 *                         example: 강태은
 *                       teamId:
 *                         type: integer
 *                         nullable: true
 *                         description: 팀 ID (배정되지 않은 경우 null)
 *                         example: 3
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
 *         description: 토큰이 누락됐습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 토큰이 누락됐습니다.
 *       403:
 *         description: 권한이 부족합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 권한이 부족합니다.
 */
router.get('/student', authenticateToken, requireTeacher, getAllStudents);

/**
 * @swagger
 * /tch/append:
 *   post:
 *     summary: 학생 팀 정보 일괄 등록 (교사 전용, 구글 시트)
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
 *               - sheetUrl
 *             properties:
 *               sheetUrl:
 *                 type: string
 *                 description: 학생 팀 정보가 담긴 구글 시트 URL (TEAM_NUMBER, CLASS_NUMBER, NAME 컬럼 필수, 공유 설정 필요)
 *                 example: https://docs.google.com/spreadsheets/d/1ABC123xyz/edit?usp=sharing
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
 *         description: URL 누락 또는 잘못된 요청
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
 *         description: 권한 없음 또는 구글 시트 접근 권한 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 구글 시트를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 이미 팀에 배정된 학생
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/append', authenticateToken, requireTeacher, appendStudents);

/**
 * @swagger
 * /tch/student/assign:
 *   post:
 *     summary: 단일 학생 팀 배정 (교사 전용)
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
 *               - userNumber
 *               - name
 *               - teamId
 *             properties:
 *               userNumber:
 *                 type: string
 *                 description: 학생 번호
 *                 example: "20240001"
 *               name:
 *                 type: string
 *                 description: 학생 이름
 *                 example: 홍길동
 *               teamId:
 *                 type: integer
 *                 description: 팀 ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: 학생이 성공적으로 추가되었습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 학생이 성공적으로 추가되었습니다.
 *       400:
 *         description: 요청 형식이 올바르지 않습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 요청 형식이 올바르지 않습니다.
 *       401:
 *         description: 토큰이 누락됐습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 토큰이 누락됐습니다.
 *       403:
 *         description: 권한이 부족합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 권한이 부족합니다.
 *       404:
 *         description: 해당 팀은 존재하지 않습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 해당 팀은 존재하지 않습니다.
 *       409:
 *         description: 이미 존재하는 학생입니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 이미 존재하는 학생입니다.
 */
router.post('/student/assign', authenticateToken, requireTeacher, addSingleStudent);

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

/**
 * @swagger
 * /tch/team:
 *   post:
 *     summary: 팀 단일 추가 (교사 전용)
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
 *               - teamName
 *               - students
 *             properties:
 *               teamName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: 팀 이름 (1~10자, 대소문자 구분 없이 중복 불가)
 *                 example: 하람
 *               students:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 팀에 추가할 학생들의 userId (학번) 배열
 *                 example: [1, 2, 3, 4]
 *     responses:
 *       200:
 *         description: 팀 추가에 성공했습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 팀 추가에 성공했습니다.
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
 *       403:
 *         description: 권한이 부족합니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 권한이 부족합니다.
 *       404:
 *         description: 존재하지 않는 아이디입니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 존재하지 않는 아이디입니다.
 *       409:
 *         description: 이미 존재하는 팀이름 또는 팀에 소속된 학생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 이미 존재하는 팀이름 입니다.
 */
router.post('/team', authenticateToken, requireTeacher, createTeam);

export default router;

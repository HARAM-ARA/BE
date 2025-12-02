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

router.get('/store', getAllStores);
router.get('/store/:id', getStore);
router.post('/store', authenticateToken, requireTeacher, createStore);
router.put('/store/:id', authenticateToken, requireTeacher, updateStore);
router.delete('/store/:id', authenticateToken, requireTeacher, deleteStore);

export default router;

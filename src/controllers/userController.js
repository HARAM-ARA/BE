import { userService } from '../services/userService.js';

export async function getAllStudents(req, res, next) {
  try {
    const students = userService.getAllStudents();

    res.status(200).json({
      message: '학생 전체 조회 성공',
      students,
    });
  } catch (error) {
    next(error);
  }
}

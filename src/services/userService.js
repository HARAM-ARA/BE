import { userModel } from '../models/userModel.js';

export const userService = {
  getAllStudents() {
    const students = userModel.getAllStudents();

    // Convert userId to number and ensure teamId is number or null
    return students.map(student => ({
      userId: parseInt(student.userId, 10),
      name: student.name,
      teamId: student.teamId ? parseInt(student.teamId, 10) : null,
    }));
  },
};

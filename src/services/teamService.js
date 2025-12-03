import { teamModel } from '../models/teamModel.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { parseAndValidateTeamXlsx } from '../utils/xlsx.js';

export const teamService = {
  async appendStudentsFromXlsx(buffer) {
    const students = parseAndValidateTeamXlsx(buffer);

    const teamMap = new Map();
    const studentTeamMappings = [];

    for (const student of students) {
      const { teamNumber, classNumber, studentName } = student;

      const user = userModel.findByEmail(studentName);
      if (!user) {
        throw new AppError(`학생을 찾을 수 없습니다: ${studentName}`, 404);
      }

      if (user.role !== 'student') {
        throw new AppError(`${studentName}은(는) 학생이 아닙니다`, 400);
      }

      const existingTeam = teamModel.findStudentTeam(user.id);
      if (existingTeam) {
        throw new AppError(`학생 ${studentName}은(는) 이미 팀에 배정되어 있습니다`, 409);
      }

      let teamId;
      const teamKey = `${teamNumber}-${classNumber}`;

      if (teamMap.has(teamKey)) {
        teamId = teamMap.get(teamKey);
      } else {
        let team = teamModel.findByTeamNumber(teamNumber);
        if (!team) {
          teamId = teamModel.create({ teamNumber, classNumber });
        } else {
          teamId = team.id;
        }
        teamMap.set(teamKey, teamId);
      }

      studentTeamMappings.push({
        studentId: user.id,
        teamId,
      });
    }

    teamModel.bulkAddStudentsToTeams(studentTeamMappings);

    return {
      message: '학생 팀 정보가 성공적으로 등록되었습니다',
      sumStudent: studentTeamMappings.length,
    };
  },

  getTeamInfo(teamId) {
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다', 404);
    }

    const members = teamModel.getTeamMembers(teamId);

    return {
      team,
      members,
    };
  },
};

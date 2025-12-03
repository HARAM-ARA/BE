import { teamModel } from '../models/teamModel.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { fetchGoogleSheetsData, validateRequiredColumns } from '../utils/googleSheets.js';
import { config } from '../config/index.js';

export const teamService = {
  async appendStudentsFromGoogleSheets(sheetUrl) {
    // Fetch data from Google Sheets
    const rawData = await fetchGoogleSheetsData(sheetUrl, config.googleApiKey);

    // Validate required columns
    validateRequiredColumns(rawData, ['TEAM_NUMBER', 'CLASS_NUMBER', 'NAME']);

    // Transform data to expected format
    const students = rawData
      .filter(row => row.TEAM_NUMBER && row.CLASS_NUMBER && row.NAME)
      .map(row => ({
        teamNumber: parseInt(row.TEAM_NUMBER, 10),
        classNumber: parseInt(row.CLASS_NUMBER, 10),
        studentName: row.NAME.trim(),
      }));

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
        let team = teamModel.findByTeamNumber(teamNumber, classNumber);
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

  addSingleStudent(userNumber, name, teamId) {
    // Validate inputs
    if (!userNumber || typeof userNumber !== 'string') {
      throw new AppError('유효하지 않은 학생 번호입니다', 400);
    }

    if (!name || typeof name !== 'string') {
      throw new AppError('유효하지 않은 학생 이름입니다', 400);
    }

    if (!teamId || typeof teamId !== 'number') {
      throw new AppError('유효하지 않은 팀 ID입니다', 400);
    }

    // Check if team exists
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다', 404);
    }

    // Find student by userNumber
    const student = userModel.findByUserNumber(userNumber);
    if (!student) {
      throw new AppError('학생을 찾을 수 없습니다', 404);
    }

    // Verify student role
    if (student.role !== 'student') {
      throw new AppError('학생 권한이 없는 사용자입니다', 400);
    }

    // Verify name matches
    if (student.name !== name) {
      throw new AppError('학생 이름이 일치하지 않습니다', 400);
    }

    // Check if student is already in this team
    if (teamModel.isStudentInTeam(student.id, teamId)) {
      throw new AppError('이미 해당 팀에 배정된 학생입니다', 409);
    }

    // Check if student is already in another team
    const existingTeam = teamModel.findStudentTeam(student.id);
    if (existingTeam) {
      throw new AppError('학생은 이미 다른 팀에 배정되어 있습니다', 409);
    }

    // Assign student to team
    teamModel.assignStudentToTeam(student.id, teamId);

    return {
      message: '학생이 성공적으로 추가되었습니다.',
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

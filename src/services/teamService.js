import { teamModel } from '../models/teamModel.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { fetchGoogleSheetsData, validateRequiredColumns } from '../utils/googleSheets.js';
import { config } from '../config/index.js';
import { getDatabase } from '../models/db.js';

export const teamService = {
  async appendStudentsFromGoogleSheets(teamsData) {
    // Validate teams data
    if (!teamsData || typeof teamsData !== 'object') {
      throw new AppError('잘못된 요청입니다.', 400);
    }

    const teamNumbers = Object.keys(teamsData);
    if (teamNumbers.length === 0) {
      throw new AppError('팀 데이터가 비어있습니다.', 400);
    }

    const db = getDatabase();
    const transaction = db.transaction(() => {
      let totalStudents = 0;

      for (const teamNumberStr of teamNumbers) {
        const teamNumber = parseInt(teamNumberStr, 10);
        const studentUserIds = teamsData[teamNumberStr];

        // Validate student array
        if (!Array.isArray(studentUserIds) || studentUserIds.length === 0) {
          throw new AppError(`팀 ${teamNumber}의 학생 데이터가 잘못되었습니다.`, 400);
        }

        // Validate all student IDs are numbers
        if (!studentUserIds.every(id => Number.isInteger(id))) {
          throw new AppError(`팀 ${teamNumber}의 학생 ID가 잘못되었습니다.`, 400);
        }

        // Find all students
        const students = userModel.findByUserNumbers(studentUserIds);

        // Check if all students exist
        if (students.length !== studentUserIds.length) {
          throw new AppError(`팀 ${teamNumber}에 존재하지 않는 학생이 있습니다.`, 404);
        }

        // Check if all are students
        const nonStudent = students.find(s => s.role !== 'student');
        if (nonStudent) {
          throw new AppError(`팀 ${teamNumber}에 학생이 아닌 사용자가 포함되어 있습니다.`, 400);
        }

        // Create or get team
        const teamName = `Team ${teamNumber}`;
        const teamId = teamModel.createOrUpdateTeam(teamNumber, teamName);

        // Remove existing students from this team
        teamModel.removeAllStudentsFromTeam(teamId);

        // Add new students
        const studentIds = students.map(s => s.id);
        teamModel.addStudentsToTeam(studentIds, teamId);

        totalStudents += studentIds.length;
      }

      return totalStudents;
    });

    const totalStudents = transaction();

    return {
      message: '학생 팀 정보가 성공적으로 등록되었습니다',
      sumStudent: totalStudents,
      teamCount: teamNumbers.length,
    };
  },

  addSingleStudent(userNumber, name, teamId) {
    // Check if team exists
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('해당 팀은 존재하지 않습니다.', 404);
    }

    // Find student by userNumber
    const student = userModel.findByUserNumber(userNumber);
    if (!student) {
      throw new AppError('해당 팀은 존재하지 않습니다.', 404);
    }

    // Verify student role
    if (student.role !== 'student') {
      throw new AppError('요청 형식이 올바르지 않습니다.', 400);
    }

    // Verify name matches
    if (student.name !== name) {
      throw new AppError('요청 형식이 올바르지 않습니다.', 400);
    }

    // Check if student is already in this team
    if (teamModel.isStudentInTeam(student.id, teamId)) {
      throw new AppError('이미 존재하는 학생입니다.', 409);
    }

    // Check if student is already in another team
    const existingTeam = teamModel.findStudentTeam(student.id);
    if (existingTeam) {
      throw new AppError('이미 존재하는 학생입니다.', 409);
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

  getTeams() {
    const teams = teamModel.getAllTeams();

    // Transform to response format
    return teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      teamCredit: team.team_credit,
    }));
  },

  createTeam(teamName, studentUserIds) {
    // Validate teamName length
    if (!teamName || teamName.length < 1 || teamName.length > 10) {
      throw new AppError('잘못된 요청입니다.', 400);
    }

    // Validate students array
    if (!Array.isArray(studentUserIds) || studentUserIds.length === 0) {
      throw new AppError('잘못된 요청입니다.', 400);
    }

    // Check if all elements are integers
    if (!studentUserIds.every(id => Number.isInteger(id))) {
      throw new AppError('잘못된 요청입니다.', 400);
    }

    // Check if team name already exists (case-insensitive)
    const existingTeam = teamModel.findByName(teamName);
    if (existingTeam) {
      throw new AppError('이미 존재하는 팀이름 입니다.', 409);
    }

    // Find all students by user_number
    const students = userModel.findByUserNumbers(studentUserIds);

    // Check if all students exist
    if (students.length !== studentUserIds.length) {
      throw new AppError('존재하지 않는 아이디입니다.', 404);
    }

    // Check if any student is already in a team
    const studentWithTeam = students.find(student => student.team_id !== null);
    if (studentWithTeam) {
      throw new AppError('이미 팀에 소속된 학생이 있습니다.', 409);
    }

    // Check if all users are students
    const nonStudent = students.find(student => student.role !== 'student');
    if (nonStudent) {
      throw new AppError('존재하지 않는 아이디입니다.', 404);
    }

    // Create team
    const teamId = teamModel.createTeam(teamName);

    // Add students to team
    const studentIds = students.map(s => s.id);
    teamModel.addStudentsToTeam(studentIds, teamId);

    return {
      message: '팀 추가에 성공했습니다.',
    };
  },

  getTeamStudents(teamId) {
    // Check if team exists
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('팀이 없습니다.', 404);
    }

    // Get team members
    const members = teamModel.getTeamMembers(teamId);

    // Transform to response format: { userId: user_number, name }
    // Sort by user_number (학번 순)
    const students = members
      .map(member => ({
        userId: parseInt(member.user_number || member.id),
        name: member.name
      }))
      .sort((a, b) => a.userId - b.userId);

    return students;
  },

  deleteTeam(teamId) {
    // Check if team exists
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('팀을 찾을 수 없습니다.', 404);
    }

    // Delete team
    teamModel.deleteTeam(teamId);

    return {
      message: '팀이 성공적으로 삭제되었습니다.',
    };
  },

  getStudentTeam(studentId) {
    // Find student's team
    const teamInfo = teamModel.findStudentTeam(studentId);
    if (!teamInfo) {
      throw new AppError('팀에 소속되어 있지 않습니다.', 404);
    }

    // Get team details
    const team = teamModel.findById(teamInfo.team_id);
    if (!team) {
      throw new AppError('팀 정보를 찾을 수 없습니다.', 404);
    }

    // Get team members
    const members = teamModel.getTeamMembers(teamInfo.team_id);

    return {
      team: {
        id: team.id,
        name: team.name,
        credit: team.team_credit,
        leaderId: team.leader_id,
      },
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        userNumber: member.user_number,
        isLeader: member.id === team.leader_id,
      })),
    };
  },
};

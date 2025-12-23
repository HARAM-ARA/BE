import { teamService } from '../services/teamService.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function appendStudents(req, res, next) {
  try {
    const { teams } = req.body;

    if (!teams) {
      throw new AppError('팀 데이터가 누락되었습니다.', 400);
    }

    // Validate teams is an object
    if (typeof teams !== 'object' || Array.isArray(teams)) {
      throw new AppError('팀 데이터 형식이 잘못되었습니다.', 400);
    }

    const result = await teamService.appendStudentsFromGoogleSheets(teams);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addSingleStudent(req, res, next) {
  try {
    const { userNumber, name, teamId } = req.body;

    // Validate required fields
    if (!userNumber || !name || !teamId) {
      return res.status(400).json({ error: '요청 형식이 올바르지 않습니다.' });
    }

    // Validate types
    if (typeof userNumber !== 'string' || typeof name !== 'string' || typeof teamId !== 'number') {
      return res.status(400).json({ error: '요청 형식이 올바르지 않습니다.' });
    }

    const result = teamService.addSingleStudent(userNumber, name, teamId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTeam(req, res, next) {
  try {
    const { id } = req.params;
    const result = teamService.getTeamInfo(parseInt(id, 10));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTeam(req, res, next) {
  try {
    const { teamName, students } = req.body;

    // Validate required fields
    if (!teamName || !students) {
      return res.status(400).json({ error: '잘못된 요청입니다.' });
    }

    const result = teamService.createTeam(teamName, students);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTeams(req, res, next) {
  try {
    const teams = teamService.getTeams();

    res.status(200).json({
      teams,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeamStudents(req, res, next) {
  try {
    const { id } = req.params;
    const teamId = parseInt(id, 10);

    if (isNaN(teamId)) {
      throw new AppError('잘못된 요청입니다.', 400);
    }

    const students = teamService.getTeamStudents(teamId);

    res.status(200).json({
      student: students,
    });
  } catch (error) {
    next(error);
  }
}

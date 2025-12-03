import { teamService } from '../services/teamService.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function appendStudents(req, res, next) {
  try {
    const { sheetUrl } = req.body;

    if (!sheetUrl) {
      throw new AppError('SHEET_URL_MISSING', 400);
    }

    // Validate URL format
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
      throw new AppError('INVALID_GOOGLE_SHEETS_URL', 400);
    }

    const result = await teamService.appendStudentsFromGoogleSheets(sheetUrl);

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

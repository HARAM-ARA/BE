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
      throw new AppError('필수 항목이 누락되었습니다. userNumber, name, teamId를 모두 입력해주세요.', 400);
    }

    // Validate types
    if (typeof userNumber !== 'string') {
      throw new AppError('userNumber는 문자열이어야 합니다', 400);
    }

    if (typeof name !== 'string') {
      throw new AppError('name은 문자열이어야 합니다', 400);
    }

    if (typeof teamId !== 'number') {
      throw new AppError('teamId는 숫자여야 합니다', 400);
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

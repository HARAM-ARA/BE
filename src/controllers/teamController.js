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

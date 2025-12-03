import { teamService } from '../services/teamService.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function appendStudents(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('FILE_MISSING', 400);
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx') {
      throw new AppError('UNSUPPORTED_FILE_TYPE', 415);
    }

    const result = await teamService.appendStudentsFromXlsx(req.file.buffer);

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

import xlsx from 'xlsx';
import { AppError } from '../middlewares/errorHandler.js';

export function parseXlsxFile(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new AppError('XLSX 파일에 시트가 없습니다', 400);
    }

    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('XLSX 파일 파싱 중 오류가 발생했습니다', 400);
  }
}

export function validateTeamData(data) {
  const errors = [];
  const seenIds = new Set();

  if (!Array.isArray(data) || data.length === 0) {
    throw new AppError('유효한 데이터가 없습니다', 400);
  }

  data.forEach((row, index) => {
    const rowNum = index + 2;

    if (!row.TEAM_NUMBER) {
      errors.push(`행 ${rowNum}: TEAM_NUMBER가 누락되었습니다`);
    }

    if (!row.CLASS_NUMBER) {
      errors.push(`행 ${rowNum}: CLASS_NUMBER가 누락되었습니다`);
    }

    if (!row.NAME) {
      errors.push(`행 ${rowNum}: NAME이 누락되었습니다`);
    }

    const userId = row.NAME;
    if (userId && seenIds.has(userId)) {
      throw new AppError('DUPLICATE_USER_ID', 409);
    }
    if (userId) {
      seenIds.add(userId);
    }
  });

  if (errors.length > 0) {
    throw new AppError(`데이터 검증 실패: ${errors.join(', ')}`, 400);
  }

  return data.map((row) => ({
    teamNumber: parseInt(row.TEAM_NUMBER, 10),
    classNumber: parseInt(row.CLASS_NUMBER, 10),
    studentName: row.NAME.trim(),
  }));
}

export function parseAndValidateTeamXlsx(buffer) {
  const rawData = parseXlsxFile(buffer);
  const validatedData = validateTeamData(rawData);
  return validatedData;
}

import { google } from 'googleapis';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Extract spreadsheet ID and sheet name from Google Sheets URL
 * Supports formats:
 * - https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid={sheetId}
 * - https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit?usp=sharing
 */
function parseGoogleSheetsUrl(url) {
  try {
    const urlPattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(urlPattern);

    if (!match || !match[1]) {
      throw new AppError('유효하지 않은 구글 시트 URL입니다', 400);
    }

    return {
      spreadsheetId: match[1],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('구글 시트 URL 파싱 중 오류가 발생했습니다', 400);
  }
}

/**
 * Fetch data from Google Sheets using the Sheets API
 * @param {string} url - Google Sheets URL
 * @param {string} apiKey - Google API Key
 * @returns {Array} Array of row objects with column headers as keys
 */
export async function fetchGoogleSheetsData(url, apiKey) {
  try {
    const { spreadsheetId } = parseGoogleSheetsUrl(url);

    const sheets = google.sheets({ version: 'v4', auth: apiKey });

    // Get all sheets in the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Use the first sheet
    const firstSheet = spreadsheet.data.sheets[0];
    const sheetName = firstSheet.properties.title;

    // Fetch data from the first sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      throw new AppError('구글 시트에 데이터가 없습니다', 400);
    }

    // First row is headers
    const headers = rows[0];
    const data = [];

    // Convert rows to objects using headers as keys
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowData = {};

      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      data.push(rowData);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;

    // Handle Google API errors
    if (error.code === 404) {
      throw new AppError('구글 시트를 찾을 수 없습니다. 링크 공유 권한을 확인하세요', 404);
    }
    if (error.code === 403) {
      throw new AppError('구글 시트 접근 권한이 없습니다. API 키를 확인하세요', 403);
    }

    throw new AppError(
      `구글 시트 데이터 가져오기 실패: ${error.message}`,
      500
    );
  }
}

/**
 * Validate that required columns exist in the data
 * @param {Array} data - Array of row objects
 * @param {Array} requiredColumns - Array of required column names
 */
export function validateRequiredColumns(data, requiredColumns) {
  if (!data || data.length === 0) {
    throw new AppError('데이터가 비어있습니다', 400);
  }

  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(
    (col) => !(col in firstRow)
  );

  if (missingColumns.length > 0) {
    throw new AppError(
      `필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`,
      400
    );
  }
}

import XLSX from 'xlsx';
import { teamModel } from '../models/teamModel.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../middlewares/errorHandler.js';

export const excelService = {
  /**
   * 학생 팀 정보를 엑셀 파일로 생성
   * @returns {Buffer} 엑셀 파일 버퍼
   */
  generateStudentTeamExcel() {
    try {
      // 모든 팀 조회
      const teams = teamModel.getAllTeams();
      
      const studentData = [];
      
      // 각 팀의 학생 정보 수집
      for (const team of teams) {
        const members = teamModel.getTeamMembers(team.id);
        
        for (const member of members) {
          studentData.push({
            '학생이름': member.name,
            '학생학번': member.user_number || member.id,
            '팀번호': team.id,
            '팀이름': team.name
          });
        }
      }
      
      // 팀에 소속되지 않은 학생들도 추가
      const allStudents = userModel.getAllStudents();
      const studentsInTeams = new Set(studentData.map(s => s.학생학번));
      
      for (const student of allStudents) {
        const studentId = student.user_number || student.id;
        if (!studentsInTeams.has(studentId)) {
          studentData.push({
            '학생이름': student.name,
            '학생학번': studentId,
            '팀번호': '',
            '팀이름': '미배정'
          });
        }
      }
      
      // 학번 순으로 정렬
      studentData.sort((a, b) => {
        const aNum = parseInt(a.학생학번) || 0;
        const bNum = parseInt(b.학생학번) || 0;
        return aNum - bNum;
      });
      
      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(studentData);
      
      // 컬럼 너비 설정
      worksheet['!cols'] = [
        { wch: 15 }, // 학생이름
        { wch: 12 }, // 학생학번
        { wch: 10 }, // 팀번호
        { wch: 20 }  // 팀이름
      ];
      
      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '학생팀정보');
      
      // 엑셀 파일을 버퍼로 생성
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });
      
      return excelBuffer;
      
    } catch (error) {
      console.error('엑셀 생성 오류:', error);
      throw new AppError('엑셀 파일 생성에 실패했습니다.', 500);
    }
  }
};
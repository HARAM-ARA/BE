import { noticeModel } from '../models/noticeModel.js';
import { teamModel } from '../models/teamModel.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function postNotice(req, res, next) {
  try {
    const { title, content } = req.body;
    const user = req.user;

    // 교사인 경우
    if (user.role === 'teacher') {
      // title과 content 모두 필요
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new AppError('제목이 잘못되었습니다.', 400);
      }
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new AppError('내용이 잘못되었습니다.', 400);
      }

      // 공지 생성
      noticeModel.createNotice(title.trim(), content.trim(), user.name, true);

      return res.status(200).json({
        message: '공지가 전송되었습니다.'
      });
    }

    // 학생인 경우
    if (user.role === 'student') {
      // content만 필요
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new AppError('내용이 잘못되었습니다.', 400);
      }

      // 학생의 팀 찾기
      const studentTeam = teamModel.findStudentTeam(user.id);
      if (!studentTeam) {
        throw new AppError('팀을 찾을 수 없습니다.', 404);
      }

      // 팀의 notice_count 확인
      const noticeCount = teamModel.getNoticeCount(studentTeam.team_id);
      if (noticeCount <= 0) {
        throw new AppError('접근 권한이 부족합니다.', 403);
      }

      // 팀 정보 가져오기
      const team = teamModel.findById(studentTeam.team_id);
      if (!team) {
        throw new AppError('팀을 찾을 수 없습니다.', 404);
      }

      // 공지 생성 (title은 팀 이름)
      noticeModel.createNotice(team.name, content.trim(), team.name, false);

      // notice_count 차감
      teamModel.decrementNoticeCount(studentTeam.team_id);

      return res.status(200).json({
        message: '공지가 전송되었습니다.'
      });
    }

    // 그 외의 경우
    throw new AppError('접근 권한이 부족합니다.', 403);

  } catch (error) {
    next(error);
  }
}

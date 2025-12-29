import { teamModel } from '../models/teamModel.js';
import { AppError } from '../middlewares/errorHandler.js';

export const casinoController = {
  // 카지노 플레이
  async playCasino(req, res, next) {
    try {
      const user = req.user;

      // 1. 사용자의 팀 확인
      const studentTeam = teamModel.findStudentTeam(user.id);
      if (!studentTeam) {
        throw new AppError('팀에 소속되어 있지 않습니다.', 403);
      }
      const teamId = studentTeam.team_id;

      // 2. 팀 정보 조회
      const team = teamModel.findById(teamId);
      if (!team) {
        throw new AppError('팀 정보를 찾을 수 없습니다.', 404);
      }

      // 3. 크레딧 확인 (1000 미만이면 에러)
      if (team.credit < 1000) {
        throw new AppError('크레딧이 부족합니다. 1000 크레딧이 필요합니다.', 400);
      }

      // 4. 1000 크레딧 차감
      teamModel.updateCredit(teamId, team.credit - 1000);

      // 5. 3개의 랜덤 숫자 생성 (가중치 적용)
      const slot1 = getWeightedRandomNumber();
      const slot2 = getWeightedRandomNumber();
      const slot3 = getWeightedRandomNumber();

      // 6. 결과 확인 및 보상 계산
      let reward = 0;
      if (slot1 === slot2 && slot2 === slot3) {
        // 3개 모두 일치
        switch (slot1) {
          case 1:
            reward = 1000;
            break;
          case 2:
            reward = 2000;
            break;
          case 3:
            reward = 3000;
            break;
          case 4:
            reward = 4000;
            break;
          case 5:
            reward = 5000;
            break;
        }
      }

      // 7. 보상 지급
      if (reward > 0) {
        const updatedTeam = teamModel.findById(teamId);
        teamModel.updateCredit(teamId, updatedTeam.credit + reward);
      }

      // 8. 결과 반환
      const finalTeam = teamModel.findById(teamId);
      res.json({
        message: reward > 0 ? '당첨되었습니다!' : '다음 기회에!',
        slots: [slot1, slot2, slot3],
        reward,
        credit: finalTeam.credit
      });

    } catch (error) {
      next(error);
    }
  }
};

// 가중치를 적용한 랜덤 숫자 생성 함수
// 1: 30%, 2: 25%, 3: 20%, 4: 15%, 5: 10%
function getWeightedRandomNumber() {
  const weights = [30, 25, 20, 15, 10]; // 1, 2, 3, 4, 5의 가중치
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0); // 100
  const random = Math.random() * totalWeight; // 0 ~ 100

  let cumulativeWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return i + 1; // 1~5 반환
    }
  }

  return 5; // fallback
}

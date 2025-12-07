import { enforceModel } from '../models/enforceModel.js';
import { getDatabase } from '../models/db.js';

export const enforceService = {
  // 사용자 강화 데이터 조회
  getUserEnforceData(user) {
    // 1. 사용자 진행도 조회
    let progress = enforceModel.getUserProgress(user.id);

    // 2. 진행도가 없으면 생성
    if (!progress) {
      enforceModel.createUserProgress(user.id);
      progress = enforceModel.getUserProgress(user.id);
    }

    // 3. 응답 데이터 반환
    return {
      problemId: progress.current_problem_id,
      tier: progress.tier,
      solvedProblem: progress.solved_problems
    };
  },

  // tier 값을 티어명으로 변환
  getTierName(tier) {
    const tiers = ['브론즈', '실버', '골드', '플레티넘', '다이아', '루비'];
    const tierIndex = Math.floor(tier / 5);
    const level = 5 - (tier % 5);
    return `${tiers[tierIndex]} ${level}`;
  },

  // 강화 시도
  async attemptEnforce(user) {
    // 1. 사용자 진행도 조회
    let progress = enforceModel.getUserProgress(user.id);
    if (!progress) {
      enforceModel.createUserProgress(user.id);
      progress = enforceModel.getUserProgress(user.id);
    }

    const currentTier = progress.tier;

    // 2. 최대 티어 확인 (루비 1 = tier 29)
    if (currentTier >= 29) {
      throw {
        status: 400,
        code: 'MAX_TIER_REACHED',
        message: '이미 최고 티어입니다.'
      };
    }

    // 3. 다음 티어의 랭크 정보 조회
    const nextTier = currentTier + 1;
    const db = getDatabase();
    const nextRank = db.prepare('SELECT * FROM ranks LIMIT 1 OFFSET ?').get(nextTier);

    if (!nextRank) {
      throw {
        status: 500,
        code: 'RANK_NOT_FOUND',
        message: '랭크 정보를 찾을 수 없습니다.'
      };
    }

    // 4. 성공/실패 판정 (확률 기반)
    const random = Math.random() * 100; // 0~100
    const isSuccess = random < nextRank.success_rate;

    // 5. 트랜잭션으로 처리
    const transaction = db.transaction(() => {
      if (isSuccess) {
        // 성공: tier 증가, 문제 수 추가
        const newTier = nextTier;
        const newSolvedProblems = progress.solved_problems + nextRank.problems_reward;

        enforceModel.updateUserProgress(user.id, {
          currentProblemId: progress.current_problem_id,
          tier: newTier,
          solvedProblems: newSolvedProblems,
          totalBrainPower: progress.total_brain_power + nextRank.brain_power
        });

        return {
          success: true,
          message: `티어가 올랐습니다. 현재 티어 : ${this.getTierName(newTier)}`,
          tier: newTier,
          problems: nextRank.problems_reward
        };
      } else {
        // 실패: tier만 0으로 초기화, 푼 문제 수는 유지
        enforceModel.updateUserProgress(user.id, {
          currentProblemId: progress.current_problem_id,
          tier: 0,
          solvedProblems: progress.solved_problems, // 유지
          totalBrainPower: progress.total_brain_power
        });

        return {
          success: false,
          message: '코드를 유출하다가 걸렸습니다.',
          tier: 0,
          problems: 0
        };
      }
    });

    return transaction();
  }
};

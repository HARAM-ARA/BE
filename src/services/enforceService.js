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

  // tier 0부터 특정 tier까지의 누적 문제 수 계산
  calculateAccumulatedProblems(targetTier) {
    const db = getDatabase();
    let total = 0;

    for (let i = 0; i <= targetTier; i++) {
      const rank = db.prepare('SELECT * FROM ranks LIMIT 1 OFFSET ?').get(i);
      if (rank) {
        total += rank.problems_reward;
      }
    }

    return total;
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
        // 성공: tier 증가, pending_problems에만 누적
        const newTier = nextTier;
        const newPendingProblems = progress.pending_problems + nextRank.problems_reward;

        enforceModel.updateUserProgress(user.id, {
          currentProblemId: progress.current_problem_id,
          tier: newTier,
          solvedProblems: progress.solved_problems, // 유지
          pendingProblems: newPendingProblems, // 누적
          totalBrainPower: progress.total_brain_power + nextRank.brain_power
        });

        return {
          success: true,
          message: `티어가 올랐습니다. 현재 티어 : ${this.getTierName(newTier)}`,
          tier: newTier,
          problems: nextRank.problems_reward
        };
      } else {
        // 실패: tier = 0, pending_problems = 0, solved_problems는 유지
        enforceModel.updateUserProgress(user.id, {
          currentProblemId: progress.current_problem_id,
          tier: 0,
          solvedProblems: progress.solved_problems, // 유지
          pendingProblems: 0, // 누적된 것 초기화
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
  },

  // 계정 팔기 (코드 유출)
  async sellAccount(user) {
    // 1. 사용자 진행도 조회
    let progress = enforceModel.getUserProgress(user.id);
    if (!progress) {
      enforceModel.createUserProgress(user.id);
      progress = enforceModel.getUserProgress(user.id);
    }

    const pendingProblems = progress.pending_problems;

    // 2. 누적된 문제가 없으면 에러
    if (pendingProblems === 0) {
      throw {
        status: 400,
        code: 'NO_PENDING_PROBLEMS',
        message: '유출할 코드가 없습니다.'
      };
    }

    // 3. 트랜잭션으로 처리
    const db = getDatabase();
    const transaction = db.transaction(() => {
      const newSolvedProblems = progress.solved_problems + pendingProblems;

      // pending_problems를 solved_problems에 추가하고 초기화
      enforceModel.updateUserProgress(user.id, {
        currentProblemId: progress.current_problem_id,
        tier: 0, // 티어 초기화
        solvedProblems: newSolvedProblems,
        pendingProblems: 0, // 누적 초기화
        totalBrainPower: progress.total_brain_power
      });

      return {
        message: `코드를 무사히 유출하였습니다. 푼 문제 수 : ${pendingProblems}개`,
        totalProblem: newSolvedProblems
      };
    });

    return transaction();
  },

  // 티어 구매
  async buyTier(user, purchaseTier) {
    // 1. 구매 가능한 티어 정보
    const purchasableeTiers = {
      9: { name: '실버 1', price: 400 },   // 실버 1
      13: { name: '골드 2', price: 600 },  // 골드 2
      16: { name: '플레티넘 4', price: 1000 } // 플레티넘 4
    };

    // 2. 티어 검증
    if (!purchasableeTiers[purchaseTier]) {
      throw {
        status: 400,
        code: 'WRONG_TIER',
        message: '티어가 잘못되었습니다.'
      };
    }

    // 3. 사용자 진행도 조회
    let progress = enforceModel.getUserProgress(user.id);
    if (!progress) {
      enforceModel.createUserProgress(user.id);
      progress = enforceModel.getUserProgress(user.id);
    }

    // 4. 현재 티어와 비교 (구매하려는 티어가 현재 티어보다 높아야 함)
    if (purchaseTier <= progress.tier) {
      throw {
        status: 403,
        code: 'CANT_PURCHASE',
        message: '구매할 수 없는 티어입니다.'
      };
    }

    // 5. 문제 수 확인
    const requiredProblems = purchasableeTiers[purchaseTier].price;
    if (progress.solved_problems < requiredProblems) {
      throw {
        status: 409,
        code: 'LACK_OF_PROBLEMS',
        message: '문제 수가 부족합니다.'
      };
    }

    // 6. 구매한 티어까지의 누적 문제 수 계산
    const accumulatedProblems = this.calculateAccumulatedProblems(purchaseTier);

    // 7. 트랜잭션으로 처리
    const db = getDatabase();
    const transaction = db.transaction(() => {
      const newSolvedProblems = progress.solved_problems - requiredProblems;

      enforceModel.updateUserProgress(user.id, {
        currentProblemId: progress.current_problem_id,
        tier: purchaseTier,
        solvedProblems: newSolvedProblems,
        pendingProblems: accumulatedProblems,
        totalBrainPower: progress.total_brain_power
      });

      return {
        message: `계정 구매가 완료되었습니다. 현재 티어: ${this.getTierName(purchaseTier)}`,
        tier: purchaseTier,
        totalProblem: newSolvedProblems
      };
    });

    return transaction();
  }
};

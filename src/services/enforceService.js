import { enforceModel } from '../models/enforceModel.js';

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
  }
};

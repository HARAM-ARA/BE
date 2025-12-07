import { typingService } from '../services/typingService.js';

export const typingController = {
  /**
   * GET /std/typing/game - 현재 진행 중인 타자게임 조회
   */
  async getGame(req, res, next) {
    try {
      const game = typingService.getCurrentGame();

      if (!game) {
        return res.status(404).json({
          code: 'NO_ACTIVE_GAME',
          message: '현재 진행 중인 게임이 없습니다.'
        });
      }

      res.json({
        gameId: game.gameId,
        words: game.words,
        startTime: game.startTime,
        endTime: game.endTime
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /std/typing/input - 타자게임 제출
   */
  async submitInput(req, res, next) {
    try {
      const { teamId, input, gameId } = req.body;
      const user = req.user;

      // 입력값 검증
      if (teamId === undefined || teamId === null) {
        return res.status(400).json({
          code: 'INVALID_REQUEST',
          message: '팀 ID가 필요합니다.'
        });
      }

      if (gameId === undefined || gameId === null) {
        return res.status(400).json({
          code: 'INVALID_REQUEST',
          message: '게임 ID가 필요합니다.'
        });
      }

      const result = await typingService.submitTyping(user, teamId, input, gameId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

import { boardModel } from '../models/boardModel.js';

export const haramController = {
  // 뽑기판 상태 조회
  getBoardStatus(req, res, next) {
    try {
      const cards = boardModel.getAllCards();
      const pulledCount = boardModel.getPulledCount();
      const isFull = boardModel.isBoardFull();

      res.json({
        cards: cards.map(card => card.is_pulled === 1),
        pulledCount,
        totalCards: 100,
        isFull
      });
    } catch (error) {
      next(error);
    }
  }
};

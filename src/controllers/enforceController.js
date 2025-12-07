import { enforceService } from '../services/enforceService.js';

export const enforceController = {
  async getEnforceData(req, res, next) {
    try {
      const user = req.user;
      const result = enforceService.getUserEnforceData(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async attemptEnforce(req, res, next) {
    try {
      const user = req.user;
      const result = await enforceService.attemptEnforce(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async sellAccount(req, res, next) {
    try {
      const user = req.user;
      const result = await enforceService.sellAccount(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async buyTier(req, res, next) {
    try {
      const { tier } = req.body;
      const user = req.user;

      if (!tier || typeof tier !== 'number') {
        return res.status(400).json({
          code: 'WRONG_TIER',
          message: '티어가 잘못되었습니다.'
        });
      }

      const result = await enforceService.buyTier(user, tier);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

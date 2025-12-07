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
  }
};

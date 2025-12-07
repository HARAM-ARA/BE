import { stdService } from '../services/stdService.js';
import { storeService } from '../services/storeService.js';

export const stdController = {
    async pullCard(req, res, next) {
        try {
            const { card } = req.body;
            const user = req.user;

            if (!card) {
                return res.status(400).json({ message: '카드 번호가 필요합니다.' });
            }

            const result = await stdService.pullCard(user, card);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async swapCredit(req, res, next) {
        try {
            const { targetTeamId } = req.body;
            const user = req.user;

            if (!targetTeamId) {
                return res.status(400).json({ message: '대상 팀 ID가 필요합니다.' });
            }

            const result = await stdService.swapCredit(user, targetTeamId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async stealCredit(req, res, next) {
        try {
            const { targetTeamId } = req.body;
            const user = req.user;

            if (!targetTeamId) {
                return res.status(400).json({ message: '대상 팀 ID가 필요합니다.' });
            }

            const result = await stdService.stealCredit(user, targetTeamId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async angerReset(req, res, next) {
        try {
            const { targetTeamId } = req.body;
            const user = req.user;

            if (!targetTeamId) {
                return res.status(400).json({ message: '대상 팀 ID가 필요합니다.' });
            }

            const result = await stdService.angerReset(user, targetTeamId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async getAccount(req, res, next) {
        try {
            const user = req.user;
            const result = await stdService.getAccount(user);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async purchaseStore(req, res, next) {
        try {
            const { itemId, quantity } = req.body;
            const user = req.user;

            const result = storeService.purchaseItem(user, itemId, quantity);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
};

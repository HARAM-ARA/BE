import { stdService } from '../services/stdService.js';

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
};

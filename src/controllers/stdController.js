import { stdService } from '../services/stdService.js';
import { storeService } from '../services/storeService.js';
import { teamModel } from '../models/teamModel.js';
import { userModel } from '../models/userModel.js';

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

    async setTeamLeader(req, res, next) {
        try {
            const { student } = req.body;
            const user = req.user;

            // 1. student 파라미터 검증
            if (!student || typeof student !== 'number') {
                return res.status(400).json({
                    code: 'BAD_REQUEST',
                    message: '잘못된 요청입니다.'
                });
            }

            // 2. 요청자의 팀 확인
            const requestorTeam = teamModel.findStudentTeam(user.id);
            if (!requestorTeam) {
                return res.status(403).json({
                    code: 'NON_EXIST_TEAM',
                    message: '팀에 소속되어 있지 않습니다.'
                });
            }
            const teamId = requestorTeam.team_id;

            // 3. 이미 팀장이 있는지 확인
            if (teamModel.hasLeader(teamId)) {
                return res.status(409).json({
                    code: 'ALREADY_EXIST',
                    message: '팀장이 이미 있습니다.'
                });
            }

            // 4. 선택된 학생이 존재하는지 확인
            const selectedStudent = userModel.findById(student);
            if (!selectedStudent || selectedStudent.role !== 'student') {
                return res.status(404).json({
                    code: 'NOT_FOUND',
                    message: '존재하지 않는 학생입니다.'
                });
            }

            // 5. 선택된 학생이 같은 팀인지 확인
            if (!teamModel.isStudentInTeam(student, teamId)) {
                return res.status(404).json({
                    code: 'NOT_FOUND',
                    message: '존재하지 않는 학생입니다.'
                });
            }

            // 6. 팀장 설정
            teamModel.setLeader(teamId, student);

            res.json({
                message: '팀장을 설정했습니다.'
            });
        } catch (error) {
            next(error);
        }
    },
};

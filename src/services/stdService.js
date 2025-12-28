import { boardModel } from '../models/boardModel.js';
import { teamModel } from '../models/teamModel.js';
import { getDatabase } from '../models/db.js';

export const stdService = {
    async pullCard(user, cardNumber) {
        const db = getDatabase();

        // 1. 유효성 검사
        if (cardNumber < 1 || cardNumber > 100) {
            throw { status: 400, message: '카드 번호가 잘못되었습니다', code: 'INCORRECT_CARD' };
        }

        // 학생의 팀 정보 조회
        const studentTeam = teamModel.findStudentTeam(user.id);
        if (!studentTeam) {
            throw { status: 403, message: '팀에 소속되어 있지 않습니다.' };
        }
        const teamId = studentTeam.team_id;
        const team = teamModel.findById(teamId);

        // 크레딧 확인 (1000 크레딧 이상 필요)
        if (team.team_credit < 1000) {
            throw { status: 403, message: '크레딧이 부족합니다', code: 'PAYMENT_REQUIRED' };
        }

        // 카드 상태 확인
        const card = boardModel.getCardStatus(cardNumber);
        if (card.is_pulled) {
            throw { status: 409, message: '이미 뽑힌 카드입니다', code: 'ALREADY_PROCESSED' };
        }

        // 트랜잭션 시작
        let result = null;
        const transaction = db.transaction(() => {
            // 2. 크레딧 차감
            db.prepare('UPDATE teams SET team_credit = team_credit - 1000 WHERE id = ?').run(teamId);

            // 3. 카드 뽑기 처리
            const marked = boardModel.markCardPulled(cardNumber, teamId);
            if (!marked) {
              // 이미 다른 요청이 먼저 이 카드를 뽑은 경우
                throw {
                    status: 409,
                    message: '이미 뽑힌 카드입니다',
                    code: 'ALREADY_PROCESSED',
                };
            }

            // 4. 확률 로직 실행
            const outcome = this.determineOutcome();

            // 5. 결과 적용
            result = this.applyOutcome(outcome, teamId);

            // 6. 보드 초기화 체크 (모든 카드가 뽑혔는지)
            if (boardModel.isBoardFull()) {
                boardModel.resetBoard();
            }
        });

        transaction();
        return result;
    },

    determineOutcome() {
        const rand = Math.random() * 100;
        let cumulative = 0;

        // 확률 테이블
        const probabilities = [
            { type: 'steal', chance: 1.5 },
            { type: 'double', chance: 1.4 },
            { type: 'swap', chance: 1.3 },
            { type: 'reset', chance: 1.13 },
            { type: 'anger', chance: 0.00001 },
            { type: 'boom', chance: 50.0 },
            { type: 'credit_1000', chance: 15.0 },
            { type: 'credit_2000', chance: 10.0 },
            { type: 'credit_3000', chance: 7.0 },
            { type: 'credit_4000', chance: 6.0 },
            { type: 'credit_5000', chance: 5.0 },
        ];

        for (const p of probabilities) {
            cumulative += p.chance;
            if (rand <= cumulative) {
                return p.type;
            }
        }
        return 'boom'; // 기본값 (혹시 모를 부동소수점 오차 대비)
    },

    applyOutcome(type, teamId) {
        const db = getDatabase();
        const team = teamModel.findById(teamId);
        let message = '';
        let effect = '';
        let addCredit = 0;
        let currentCredit = team.team_credit; // 차감된 상태

        switch (type) {
            case 'credit_1000':
            case 'credit_2000':
            case 'credit_3000':
            case 'credit_4000':
            case 'credit_5000':
                addCredit = parseInt(type.split('_')[1]);
                db.prepare('UPDATE teams SET team_credit = team_credit + ? WHERE id = ?').run(addCredit, teamId);
                currentCredit += addCredit;
                message = `${addCredit} 크레딧 당첨!`;
                effect = 'add';
                return { message, effect, addCredit, credit: currentCredit };

            case 'double':
                addCredit = currentCredit; // 현재 잔액만큼 추가 (2배)
                db.prepare('UPDATE teams SET team_credit = team_credit * 2 WHERE id = ?').run(teamId);
                currentCredit *= 2;
                message = '크레딧 2배 당첨!!';
                effect = 'double';
                return { message, effect, addCredit, credit: currentCredit };

            case 'swap':
                // 크레딧 교환 - 프론트엔드에서 팀 선택 필요
                teamModel.grantSwapPermission(teamId); // 권한 부여
                message = '크레딧 교환하기!!';
                effect = 'swap';
                return { message, effect };

            case 'steal':
                // 크레딧 뺏기 - 프론트엔드에서 팀 선택 필요
                { const stealPercent = this.determineStealPercent();
                teamModel.grantStealPermission(teamId, stealPercent); // 권한 부여
                message = '상대 팀 크레딧 뺏어오기!!';
                effect = 'steal';
                return { message, effect, stealPercent }; }

            case 'reset':
                db.prepare('UPDATE teams SET team_credit = 3000').run(); // 모든 팀 초기화 (기본값 3000 가정)
                message = '전체 팀 크레딧 초기화!!!!';
                effect = 'reset';
                return { message, effect };

            case 'anger':
                // 하은이의 분노 - 프론트엔드에서 팀 선택 필요
                teamModel.grantAngerPermission(teamId); // 권한 부여
                message = '하은이의 분노!!!!!!!!!';
                effect = 'anger';
                return { message, effect };

            case 'boom':
            default:
                message = '꽝!';
                effect = 'Boom';
                return { message, effect, credit: currentCredit, addCredit: 0 };
        }
    },

    getRandomTeam(excludeTeamId) {
        const db = getDatabase();
        const teams = db.prepare('SELECT * FROM teams WHERE id != ?').all(excludeTeamId);
        if (teams.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * teams.length);
        return teams[randomIndex];
    },

    determineStealPercent() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        const probabilities = [
            { percent: 10, chance: 28.57 },
            { percent: 20, chance: 23.81 },
            { percent: 30, chance: 19.05 },
            { percent: 40, chance: 14.29 },
            { percent: 50, chance: 9.52 },
            { percent: 100, chance: 4.76 },
        ];

        for (const p of probabilities) {
            cumulative += p.chance;
            if (rand <= cumulative) {
                return p.percent;
            }
        }
        return 10;
    },

    async swapCredit(user, targetTeamId) {
        // 1. 입력 유효성 검사
        if (!targetTeamId || typeof targetTeamId !== 'number') {
            throw { status: 400, message: 'ID가 잘못되었습니다', code: 'INCORRECT_TEAM' };
        }

        // 2. 학생의 팀 정보 조회
        const studentTeam = teamModel.findStudentTeam(user.id);
        if (!studentTeam) {
            throw { status: 403, message: '팀에 소속되어 있지 않습니다.' };
        }
        const myTeamId = studentTeam.team_id;

        // 3. swap 권한 확인
        if (!teamModel.hasSwapPermission(myTeamId)) {
            throw { status: 403, message: '크레딧 교환 권한이 없습니다', code: 'NO_PERMISSION' };
        }

        // 4. 자기 자신과 교환 방지
        if (myTeamId === targetTeamId) {
            throw { status: 400, message: '자기 팀과는 교환할 수 없습니다', code: 'INCORRECT_TEAM' };
        }

        // 5. 대상 팀 존재 확인
        const targetTeam = teamModel.findById(targetTeamId);
        if (!targetTeam) {
            throw { status: 404, message: '존재하지 않는 팀입니다', code: 'NON_EXIST_TEAM' };
        }

        // 6. 크레딧 교환 실행 및 권한 제거 (트랜잭션)
        const db = getDatabase();
        let result;
        const transaction = db.transaction(() => {
            result = teamModel.swapTeamCredits(myTeamId, targetTeamId);
            teamModel.revokeSwapPermission(myTeamId);
        });
        transaction();

        return {
            message: '선택한 팀과 크레딧이 교환되었습니다.',
            myTeam: {
                teamId: result.team1.id,
                credit: result.team1.credit
            },
            targetTeam: {
                teamId: result.team2.id,
                credit: result.team2.credit
            }
        };
    },

    async stealCredit(user, targetTeamId) {
        // 1. 입력 유효성 검사
        if (!targetTeamId || typeof targetTeamId !== 'number') {
            throw { status: 400, message: 'ID가 잘못되었습니다', code: 'INCORRECT_TEAM' };
        }

        // 2. 학생의 팀 정보 조회
        const studentTeam = teamModel.findStudentTeam(user.id);
        if (!studentTeam) {
            throw { status: 403, message: '팀에 소속되어 있지 않습니다.' };
        }
        const myTeamId = studentTeam.team_id;

        // 3. steal 권한 확인
        const permissionCheck = teamModel.hasStealPermission(myTeamId);
        if (!permissionCheck.hasPermission) {
            throw { status: 403, message: '크레딧 뺏기 권한이 없습니다', code: 'NO_PERMISSION' };
        }
        const stealPercent = permissionCheck.stealPercent;

        // 4. 자기 자신에게서 뺏기 방지
        if (myTeamId === targetTeamId) {
            throw { status: 400, message: '자기 팀에게서는 뺏을 수 없습니다', code: 'INCORRECT_TEAM' };
        }

        // 5. 대상 팀 존재 확인
        const targetTeam = teamModel.findById(targetTeamId);
        if (!targetTeam) {
            throw { status: 404, message: '존재하지 않는 팀입니다', code: 'NON_EXIST_TEAM' };
        }

        // 6. 크레딧 뺏기 실행 및 권한 제거 (트랜잭션)
        const db = getDatabase();
        let result;
        const transaction = db.transaction(() => {
            result = teamModel.stealCredit(myTeamId, targetTeamId, stealPercent);
            teamModel.revokeStealPermission(myTeamId);
        });
        transaction();

        return {
            message: `선택한 팀으로부터 ${stealPercent}%의 크레딧을 뺏어왔습니다!`,
            myTeam: {
                teamId: result.stealerTeam.id,
                credit: result.stealerTeam.credit
            },
            targetTeam: {
                teamId: result.victimTeam.id,
                credit: result.victimTeam.credit
            },
            stolenAmount: result.stolenAmount,
            stealPercent
        };
    },

    async angerReset(user, targetTeamId) {
        // 1. 입력 유효성 검사
        if (!targetTeamId || typeof targetTeamId !== 'number') {
            throw { status: 400, message: 'ID가 잘못되었습니다', code: 'INCORRECT_TEAM' };
        }

        // 2. 학생의 팀 정보 조회
        const studentTeam = teamModel.findStudentTeam(user.id);
        if (!studentTeam) {
            throw { status: 403, message: '팀에 소속되어 있지 않습니다.' };
        }
        const myTeamId = studentTeam.team_id;

        // 3. anger 권한 확인
        if (!teamModel.hasAngerPermission(myTeamId)) {
            throw { status: 403, message: '하은이의 분노 권한이 없습니다', code: 'NO_PERMISSION' };
        }

        // 4. 대상 팀 존재 확인
        const targetTeam = teamModel.findById(targetTeamId);
        if (!targetTeam) {
            throw { status: 404, message: '존재하지 않는 팀입니다', code: 'NON_EXIST_TEAM' };
        }

        // 5. 크레딧 초기화 실행 및 권한 제거 (트랜잭션)
        const db = getDatabase();
        const transaction = db.transaction(() => {
            teamModel.resetTeamCredit(targetTeamId);
            teamModel.revokeAngerPermission(myTeamId);
        });
        transaction();

        // 6. 최신 팀 정보 조회
        const updatedMyTeam = teamModel.findById(myTeamId);
        const updatedTargetTeam = teamModel.findById(targetTeamId);

        return {
            message: '선택한 팀의 크레딧이 초기화 되었습니다.',
            myTeam: {
                teamId: updatedMyTeam.id,
                credit: updatedMyTeam.team_credit
            },
            targetTeam: {
                teamId: updatedTargetTeam.id,
                credit: updatedTargetTeam.team_credit
            }
        };
    },

    async getAccount(user) {
        // 1. 학생의 팀 정보 조회
        const studentTeam = teamModel.findStudentTeam(user.id);
        if (!studentTeam) {
            throw { status: 404, message: '해당 팀은 존재하지 않습니다.', code: 'NON_EXIST_TEAM' };
        }

        // 2. 팀 상세 정보 조회
        const team = teamModel.findById(studentTeam.team_id);
        if (!team) {
            throw { status: 404, message: '해당 팀은 존재하지 않습니다.', code: 'NON_EXIST_TEAM' };
        }

        // 3. 팀원 정보 조회
        const members = teamModel.getTeamMembers(team.id);
        const memberList = members.map(member => ({
            id: member.id,
            name: member.name,
            userNumber: member.user_number
        }));

        return {
            teamId: team.id,
            teamName: team.name,
            credit: team.team_credit,
            members: memberList
        };
    }
};

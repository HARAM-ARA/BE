import { wordModel } from '../models/wordModel.js';
import { typingGameModel } from '../models/typingGameModel.js';
import { typingSubmissionModel } from '../models/typingSubmissionModel.js';

export const typingService = {
  /**
   * 다음 게임 시작 시간 계산 (2시간마다 짝수 시간)
   */
  calculateNextGameTime(fromTime = Date.now()) {
    const date = new Date(fromTime);
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();

    // 다음 짝수 시간 계산
    let nextHour = currentHour;
    if (currentHour % 2 === 1) {
      // 홀수 시간이면 다음 시간
      nextHour = currentHour + 1;
    } else {
      // 짝수 시간이면
      if (currentMinute >= 10) {
        // 10분이 지났으면 다음 짝수 시간
        nextHour = currentHour + 2;
      }
    }

    // 24시간 넘어가면 다음날
    if (nextHour >= 24) {
      nextHour = nextHour % 24;
      date.setDate(date.getDate() + 1);
    }

    date.setHours(nextHour, 0, 0, 0);
    return date.getTime();
  },

  /**
   * 새 게임 시작
   */
  startNewGame() {
    const startTime = Date.now();
    const endTime = startTime + 10 * 60 * 1000; // 10분 후

    // 랜덤 단어 5개 선택
    const wordObjects = wordModel.getRandomWords(5);
    if (wordObjects.length < 5) {
      throw new Error('Not enough words in database');
    }

    // 단어 문자열 배열로 변환
    const words = wordObjects.map(w => w.word);

    // 게임 생성
    const gameId = typingGameModel.createGame(startTime, endTime, words);

    // 게임 활성화
    typingGameModel.updateGameStatus(gameId, 'active');

    // 현재 게임 정보 저장
    typingGameModel.setCurrentGameId(gameId);
    typingGameModel.setCurrentGameStartTime(startTime);

    // 다음 게임 시간 설정
    const nextGameTime = this.calculateNextGameTime(endTime);
    typingGameModel.setNextGameTime(nextGameTime);

    console.log(`[TypingGame] New game started: ID=${gameId}, ends at ${new Date(endTime).toISOString()}`);
    console.log(`[TypingGame] Next game scheduled at ${new Date(nextGameTime).toISOString()}`);

    return gameId;
  },

  /**
   * 게임 종료 및 보상 지급
   */
  async endGame(gameId) {
    const updated = typingGameModel.updateGameStatus(gameId, 'ended');
    if (updated) {
      // 현재 게임 정보 초기화 (0으로 설정)
      typingGameModel.setCurrentGameId(0);
      typingGameModel.setCurrentGameStartTime(0);
      console.log(`[TypingGame] Game ended: ID=${gameId}`);

      // 보상 지급 (한 번만)
      await this.distributeRewards(gameId);
    }
    return updated;
  },

  /**
   * 게임 종료 시 보상 지급
   */
  async distributeRewards(gameId) {
    // 이미 보상을 지급했는지 확인
    if (typingGameModel.isRewardGiven(gameId)) {
      console.log(`[TypingGame] Rewards already given for game ${gameId}`);
      return;
    }

    // 제출 기록 조회 및 순위 계산
    const submissions = typingSubmissionModel.getSubmissionsByGame(gameId);
    if (submissions.length === 0) {
      console.log(`[TypingGame] No submissions for game ${gameId}`);
      typingGameModel.markRewardGiven(gameId);
      return;
    }

    // 순위별 보상 크레딧
    const rewards = {
      1: 25000,
      2: 20000,
      3: 15000,
      4: 10000,
      5: 5000
    };

    // 순위 계산 (맞춘 개수 DESC, 시간 ASC)
    const rankings = submissions
      .sort((a, b) => {
        if (b.correct_count !== a.correct_count) {
          return b.correct_count - a.correct_count;
        }
        return a.time_taken - b.time_taken;
      });

    // 상위 5팀에게 보상 지급
    const { teamModel } = await import('../models/teamModel.js');
    for (let i = 0; i < Math.min(5, rankings.length); i++) {
      const submission = rankings[i];
      const rank = i + 1;
      const credit = rewards[rank];

      if (credit) {
        const team = teamModel.findById(submission.team_id);
        if (team) {
          const newCredit = team.team_credit + credit;
          teamModel.updateTeamCredit(submission.team_id, newCredit);
          console.log(`[TypingGame] Reward given: Team ${team.name} (rank ${rank}) +${credit} credits`);
        }
      }
    }

    // 보상 지급 완료 표시
    typingGameModel.markRewardGiven(gameId);
    console.log(`[TypingGame] All rewards distributed for game ${gameId}`);
  },

  /**
   * 현재 진행 중인 게임 조회
   */
  getCurrentGame() {
    // 실시간으로 게임 시작/종료 확인
    this.checkAndUpdateGames();

    const game = typingGameModel.getCurrentGame();
    if (!game) {
      return null;
    }

    return {
      gameId: game.id,
      words: game.words,
      startTime: game.start_time,
      endTime: game.end_time,
      status: game.status
    };
  },

  /**
   * 타자게임 제출
   */
  async submitTyping(user, input, gameId) {
    // 0. 실시간으로 게임 시작/종료 확인
    this.checkAndUpdateGames();

    // 1. 사용자의 팀 조회
    const { teamModel } = await import('../models/teamModel.js');
    const studentTeam = teamModel.findStudentTeam(user.id);
    if (!studentTeam) {
      throw {
        status: 403,
        code: 'NOT_IN_TEAM',
        message: '팀에 소속되어 있지 않습니다.'
      };
    }
    const teamId = studentTeam.team_id;

    // 2. 입력값 검증
    if (!input || !Array.isArray(input) || input.length === 0) {
      throw {
        status: 400,
        code: 'INPUT_IS_NULL',
        message: '값을 입력하지 않았습니다'
      };
    }

    // 3. 입력값 타입 및 길이 검증 (각 단어 20자 제한)
    for (const word of input) {
      if (typeof word !== 'string' || word.length > 20) {
        throw {
          status: 413,
          code: 'INPUT_TOO_LONG',
          message: '값이 너무 깁니다'
        };
      }
    }

    // 3. 현재 진행 중인 게임 확인
    const currentGame = typingGameModel.getCurrentGame();
    if (!currentGame) {
      throw {
        status: 403,
        code: 'ENDED_GAME',
        message: '이미 끝난 게임입니다.'
      };
    }

    // 4. gameId 검증
    if (gameId !== currentGame.id) {
      throw {
        status: 403,
        code: 'ENDED_GAME',
        message: '이미 끝난 게임입니다.'
      };
    }

    // 5. 팀 중복 제출 확인
    const hasSubmitted = typingSubmissionModel.hasTeamSubmitted(gameId, teamId);
    if (hasSubmitted) {
      throw {
        status: 403,
        code: 'TOO_LATE',
        message: '이미 참가한 사람이 있습니다.'
      };
    }

    // 6. 정답 검증
    const correctWords = currentGame.words;
    const success = input.map((userInput, index) => {
      if (index >= correctWords.length) return false;
      return userInput === correctWords[index];
    });

    // 7. 맞춘 개수 계산
    const correctCount = success.filter(s => s).length;

    // 8. 입력 시간 계산 (게임 시작 시간부터 현재까지 ms)
    const submitTime = Date.now();
    const timeTaken = submitTime - currentGame.start_time;

    // 9. DB에 저장
    typingSubmissionModel.createSubmission(
      gameId,
      teamId,
      correctCount,
      submitTime,
      input,
      timeTaken
    );

    return {
      success,
      time: timeTaken
    };
  },

  /**
   * 스케줄러 체크 및 게임 시작/종료 처리
   */
  checkAndUpdateGames() {
    const now = Date.now();

    // 1. 종료 시간이 지난 active 게임 종료
    const activeGames = typingGameModel.getGamesByStatus('active');
    for (const game of activeGames) {
      if (now >= game.end_time) {
        this.endGame(game.id);
      }
    }

    // 2. 다음 게임 시작 확인
    const nextGameTime = typingGameModel.getNextGameTime();
    if (!nextGameTime || now >= nextGameTime) {
      // 다음 게임 시작
      this.startNewGame();
    }
  },

  /**
   * 현재 게임 등수 조회
   */
  async getCurrentGameRank(user) {
    // 사용자의 팀 조회
    const { teamModel } = await import('../models/teamModel.js');
    const studentTeam = teamModel.findStudentTeam(user.id);
    let myTeamId = null;
    if (studentTeam) {
      myTeamId = studentTeam.team_id;
    }

    // 가장 최근 게임 조회
    const allGames = typingGameModel.getAllGames();
    if (allGames.length === 0) {
      throw {
        status: 404,
        code: 'NO_GAME',
        message: '진행된 게임이 없습니다.'
      };
    }

    const currentGame = allGames[0]; // ID DESC 정렬이므로 첫 번째가 최신

    // 게임이 진행 중인지 확인
    if (currentGame.status === 'active') {
      throw {
        status: 403,
        code: 'GAME_IN_PROGRESS',
        message: '게임이 진행 중입니다.'
      };
    }

    // 게임의 모든 제출 기록 조회
    const submissions = typingSubmissionModel.getSubmissionsByGame(currentGame.id);

    if (submissions.length === 0) {
      return {
        message: '참가한 팀이 없습니다.',
        rank: null,
        winners: []
      };
    }

    // 순위 계산 (맞춘 개수 DESC, 시간 ASC)
    const rankings = submissions
      .sort((a, b) => {
        if (b.correct_count !== a.correct_count) {
          return b.correct_count - a.correct_count; // 맞춘 개수 내림차순
        }
        return a.time_taken - b.time_taken; // 시간 오름차순
      })
      .map((submission, index) => {
        const team = teamModel.findById(submission.team_id);
        return {
          teamId: submission.team_id,
          teamName: team ? team.name : '알 수 없음',
          rank: index + 1,
          correctCount: submission.correct_count,
          timeTaken: submission.time_taken
        };
      });

    // 본인 팀 순위 찾기
    const myRanking = rankings.find(r => r.teamId === myTeamId);
    const myRank = myRanking ? myRanking.rank : null;

    // 상위 5팀만 추출
    const winners = rankings.slice(0, 5).map(r => ({
      teamId: r.teamId,
      teamName: r.teamName,
      rank: r.rank
    }));

    return {
      message: myRank ? `당신 팀은 ${myRank}등입니다` : '참가하지 않았습니다',
      rank: myRank,
      winners
    };
  },

  /**
   * 초기화 (서버 시작 시)
   */
  initialize() {
    // 다음 게임 시간이 없으면 설정
    const nextGameTime = typingGameModel.getNextGameTime();
    if (!nextGameTime) {
      const calculatedTime = this.calculateNextGameTime();
      typingGameModel.setNextGameTime(calculatedTime);
      console.log(`[TypingGame] First game scheduled at ${new Date(calculatedTime).toISOString()}`);
    }

    // 현재 게임 정보가 없으면 기본값(0) 설정
    const currentGameId = typingGameModel.getCurrentGameId();
    if (currentGameId === null) {
      typingGameModel.setCurrentGameId(0);
    }

    const currentGameStartTime = typingGameModel.getCurrentGameStartTime();
    if (currentGameStartTime === null) {
      typingGameModel.setCurrentGameStartTime(0);
    }

    // 주기적 체크 시작 (1분마다)
    setInterval(() => {
      this.checkAndUpdateGames();
    }, 60 * 1000);

    // 즉시 한 번 체크
    this.checkAndUpdateGames();

    console.log('[TypingGame] Scheduler initialized');
  }
};

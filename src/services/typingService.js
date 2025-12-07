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
   * 게임 종료
   */
  endGame(gameId) {
    const updated = typingGameModel.updateGameStatus(gameId, 'ended');
    if (updated) {
      // 현재 게임 정보 초기화 (0으로 설정)
      typingGameModel.setCurrentGameId(0);
      typingGameModel.setCurrentGameStartTime(0);
      console.log(`[TypingGame] Game ended: ID=${gameId}`);
    }
    return updated;
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

    // 3. 입력값 길이 검증 (각 단어 20자 제한)
    for (const word of input) {
      if (word.length > 20) {
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

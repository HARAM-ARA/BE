import { getDatabase } from './db.js';

export const typingSubmissionModel = {
  initSubmissions() {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS typing_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        correct_count INTEGER NOT NULL,
        submit_time INTEGER NOT NULL,
        input_words TEXT NOT NULL,
        time_taken INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES typing_games(id),
        FOREIGN KEY (team_id) REFERENCES teams(id),
        UNIQUE(game_id, team_id)
      )
    `);
  },

  createSubmission(gameId, teamId, correctCount, submitTime, inputWords, timeTaken) {
    const db = getDatabase();
    try {
      const result = db.prepare(`
        INSERT INTO typing_submissions (game_id, team_id, correct_count, submit_time, input_words, time_taken)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(gameId, teamId, correctCount, submitTime, JSON.stringify(inputWords), timeTaken);
      return result.lastInsertRowid;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw {
          status: 403,
          code: 'TOO_LATE',
          message: '이미 참가한 사람이 있습니다.'
        };
      }
      throw error;
    }
  },

  getSubmissionByGameAndTeam(gameId, teamId) {
    const db = getDatabase();
    const submission = db.prepare(`
      SELECT * FROM typing_submissions WHERE game_id = ? AND team_id = ?
    `).get(gameId, teamId);

    if (submission && submission.input_words) {
      submission.input_words = JSON.parse(submission.input_words);
    }
    return submission;
  },

  getSubmissionsByGame(gameId) {
    const db = getDatabase();
    const submissions = db.prepare(`
      SELECT * FROM typing_submissions WHERE game_id = ?
      ORDER BY correct_count DESC, time_taken ASC
    `).all(gameId);

    return submissions.map(submission => {
      if (submission.input_words) {
        submission.input_words = JSON.parse(submission.input_words);
      }
      return submission;
    });
  },

  getSubmissionsByTeam(teamId) {
    const db = getDatabase();
    const submissions = db.prepare(`
      SELECT * FROM typing_submissions WHERE team_id = ?
      ORDER BY created_at DESC
    `).all(teamId);

    return submissions.map(submission => {
      if (submission.input_words) {
        submission.input_words = JSON.parse(submission.input_words);
      }
      return submission;
    });
  },

  hasTeamSubmitted(gameId, teamId) {
    const db = getDatabase();
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM typing_submissions WHERE game_id = ? AND team_id = ?
    `).get(gameId, teamId);
    return count.count > 0;
  }
};

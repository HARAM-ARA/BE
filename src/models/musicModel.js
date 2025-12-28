import { getDatabase } from './db.js';

export const musicModel = {
  // 큐에 음악 추가
  addToQueue(youtubeUrl, title, requesterName, requesterTeamName, requesterId, requesterTeamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO music_queue (youtube_url, title, requester_name, requester_team_name, requester_id, requester_team_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(youtubeUrl, title, requesterName, requesterTeamName, requesterId, requesterTeamId);
    return result.lastInsertRowid;
  },

  // 전체 큐 조회 (오래된 순서대로)
  getQueue() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, youtube_url, title, requester_name, requester_team_name, requester_id, requester_team_id, requested_at
      FROM music_queue
      ORDER BY requested_at ASC, id ASC
    `);
    return stmt.all();
  },

  // ID로 특정 음악 조회
  getById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, youtube_url, title, requester_name, requester_team_name, requester_id, requester_team_id, requested_at
      FROM music_queue
      WHERE id = ?
    `);
    return stmt.get(id);
  },

  // 큐의 맨 앞 항목 가져오기
  getFirstInQueue() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, youtube_url, title, requester_name, requester_team_name, requester_id, requester_team_id, requested_at
      FROM music_queue
      ORDER BY requested_at ASC, id ASC
      LIMIT 1
    `);
    return stmt.get();
  },

  // 큐에서 제거
  removeFromQueue(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM music_queue WHERE id = ?');
    return stmt.run(id);
  },

  // 큐 전체 삭제
  clearQueue() {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM music_queue');
    return stmt.run();
  },
};

import { musicService } from '../services/musicService.js';

export const musicController = {
  // 음악 신청 (학생)
  async requestMusic(req, res, next) {
    try {
      const { url } = req.body;
      const user = req.user;

      if (!url) {
        return res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'YouTube URL이 필요합니다.'
        });
      }

      const result = await musicService.requestMusic(user, url);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // 큐 조회 (로그인 불필요)
  getQueue(req, res, next) {
    try {
      const queue = musicService.getQueue();
      res.json({ queue });
    } catch (error) {
      next(error);
    }
  },

  // 음악 스트리밍 (선생님)
  async streamMusic(req, res, next) {
    try {
      const musicId = req.params.id ? parseInt(req.params.id) : null;

      // 큐에서 제거만 수행 (스트리밍 없음)
      const music = await musicService.getMusicForStreaming(musicId);

      // 삭제 성공 응답
      res.json({
        message: '음악이 큐에서 제거되었습니다.',
        music: {
          id: music.id,
          title: music.title,
          url: music.youtube_url,
          requesterId: music.requester_id,
          teamId: music.requester_team_id
        }
      });

    } catch (error) {
      next(error);
    }
  },
};

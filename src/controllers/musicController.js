import { musicService } from '../services/musicService.js';
import ytdl from '@distube/ytdl-core';

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

      // 스트리밍할 음악 정보 가져오기 (큐에서 제거됨)
      const music = await musicService.getMusicForStreaming(musicId);

      // 응답 헤더 설정
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(music.title)}.webm"`);
      res.setHeader('X-Music-Title', encodeURIComponent(music.title));
      res.setHeader('X-Music-Requester', encodeURIComponent(music.requester_name));
      res.setHeader('X-Music-Team', encodeURIComponent(music.requester_team_name));

      // ytdl-core를 사용해서 오디오 스트리밍
      const stream = ytdl(music.youtube_url, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });

      // 스트림을 응답으로 파이프
      stream.pipe(res);

      // 에러 처리
      stream.on('error', (error) => {
        console.error('ytdl-core stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            code: 'STREAM_ERROR',
            message: '스트리밍 중 오류가 발생했습니다.'
          });
        }
      });

      // 클라이언트가 연결을 끊으면 스트림 종료
      req.on('close', () => {
        stream.destroy();
      });

    } catch (error) {
      next(error);
    }
  },
};

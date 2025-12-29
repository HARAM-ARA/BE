import { musicService } from '../services/musicService.js';
import { spawn } from 'child_process';

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

      // yt-dlp를 사용해서 MP3로 스트리밍
      const ytdlp = spawn('yt-dlp', [
        '-f', 'bestaudio',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', '-',
        music.youtube_url
      ]);

      // 응답 헤더 설정
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(music.title)}.mp3"`);
      res.setHeader('X-Music-Title', encodeURIComponent(music.title));
      res.setHeader('X-Music-Requester', String(music.requester_id || ''));
      res.setHeader('X-Music-Team', String(music.requester_team_id || ''));

      // yt-dlp stdout을 응답으로 파이프
      ytdlp.stdout.pipe(res);

      // 에러 처리
      ytdlp.stderr.on('data', (data) => {
        console.error('yt-dlp stderr:', data.toString());
      });

      ytdlp.on('error', (error) => {
        console.error('yt-dlp process error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            code: 'STREAM_ERROR',
            message: '스트리밍 중 오류가 발생했습니다.'
          });
        }
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          console.error(`yt-dlp exited with code ${code}`);
        }
      });

      // 클라이언트가 연결을 끊으면 프로세스 종료
      req.on('close', () => {
        ytdlp.kill();
      });

    } catch (error) {
      next(error);
    }
  },
};

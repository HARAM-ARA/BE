import { exec } from 'child_process';
import { promisify } from 'util';
import { musicModel } from '../models/musicModel.js';
import { teamModel } from '../models/teamModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { broadcastNewMusic } from '../config/socket.js';

const execAsync = promisify(exec);

export const musicService = {
  // YouTube URL에서 video ID 추출 및 정리
  extractVideoId(youtubeUrl) {
    try {
      const url = new URL(youtubeUrl);
      let videoId = null;

      // youtube.com/watch?v=VIDEO_ID 형식
      if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      }
      // youtu.be/VIDEO_ID 형식
      else if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1); // '/' 제거
      }

      if (!videoId) {
        throw new Error('Video ID not found');
      }

      // 깔끔한 URL 반환
      return `https://www.youtube.com/watch?v=${videoId}`;
    } catch (error) {
      throw new AppError('올바른 YouTube URL이 아닙니다.', 400);
    }
  },

  // YouTube URL에서 제목 추출
  async getYoutubeTitle(youtubeUrl) {
    try {
      const { stdout } = await execAsync(
        `yt-dlp --get-title "${youtubeUrl}"`,
        { timeout: 10000 }
      );
      return stdout.trim();
    } catch (error) {
      console.error('Failed to get YouTube title:', error);
      throw new AppError('YouTube 영상 정보를 가져올 수 없습니다.', 400);
    }
  },

  // 음악 신청
  async requestMusic(user, youtubeUrl) {
    // 1. YouTube URL 정리 (쿼리 파라미터 제거)
    const cleanUrl = this.extractVideoId(youtubeUrl);

    // 2. 사용자의 팀 확인
    const studentTeam = teamModel.findStudentTeam(user.id);
    if (!studentTeam) {
      throw new AppError('팀에 소속되어 있지 않습니다.', 403);
    }
    const teamId = studentTeam.team_id;

    // 3. 팀 정보 조회
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('팀 정보를 찾을 수 없습니다.', 404);
    }

    // 4. 음악 신청 권한 확인
    const musicRequestCount = teamModel.getMusicRequestCount(teamId);
    if (musicRequestCount <= 0) {
      throw new AppError('음악 신청 권한이 부족합니다.', 403);
    }

    // 5. YouTube 제목 추출
    const title = await this.getYoutubeTitle(cleanUrl);

    // 6. 큐에 추가 (ID만 사용)
    const queueId = musicModel.addToQueue(
      cleanUrl,
      title,
      user.id,
      teamId
    );

    // 7. 권한 차감
    teamModel.decrementMusicRequestCount(teamId);

    const result = {
      message: '음악이 신청되었습니다.',
      queueId,
      title,
      youtubeUrl: cleanUrl,
      requesterId: user.id,
      teamId: teamId
    };

    // 8. 소켓 이벤트 발송
    broadcastNewMusic({
      queueId,
      title,
      url: cleanUrl,
      teamId: teamId
    });

    return result;
  },

  // 큐 조회 (URL, 제목, 신청팀 ID 반환)
  getQueue() {
    const queue = musicModel.getQueue();
    return queue.map(item => ({
      id: item.id,
      url: item.youtube_url,
      title: item.title,
      teamId: item.requester_team_id
    }));
  },

  // 스트리밍용 YouTube URL 가져오기 (id 지정 시 해당 곡, 없으면 맨 앞 곡)
  async getMusicForStreaming(musicId = null) {
    let music;

    if (musicId) {
      // ID로 특정 곡 조회
      music = musicModel.getById(musicId);
      if (!music) {
        throw new AppError('해당 음악을 찾을 수 없습니다.', 404);
      }
    } else {
      // 큐의 맨 앞 곡 조회
      music = musicModel.getFirstInQueue();
      if (!music) {
        throw new AppError('큐에 음악이 없습니다.', 404);
      }
    }

    // 큐에서 제거
    musicModel.removeFromQueue(music.id);

    return music;
  },
};

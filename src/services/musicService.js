import ytdl from '@distube/ytdl-core';
import { musicModel } from '../models/musicModel.js';
import { teamModel } from '../models/teamModel.js';
import { AppError } from '../middlewares/errorHandler.js';

export const musicService = {
  // YouTube URL에서 제목 추출
  async getYoutubeTitle(youtubeUrl) {
    try {
      const info = await ytdl.getInfo(youtubeUrl);
      return info.videoDetails.title;
    } catch (error) {
      console.error('Failed to get YouTube title:', error);
      throw new AppError('YouTube 영상 정보를 가져올 수 없습니다.', 400);
    }
  },

  // 음악 신청
  async requestMusic(user, youtubeUrl) {
    // 1. 사용자의 팀 확인
    const studentTeam = teamModel.findStudentTeam(user.id);
    if (!studentTeam) {
      throw new AppError('팀에 소속되어 있지 않습니다.', 403);
    }
    const teamId = studentTeam.team_id;

    // 2. 팀 정보 조회
    const team = teamModel.findById(teamId);
    if (!team) {
      throw new AppError('팀 정보를 찾을 수 없습니다.', 404);
    }

    // 3. 음악 신청 권한 확인
    const musicRequestCount = teamModel.getMusicRequestCount(teamId);
    if (musicRequestCount <= 0) {
      throw new AppError('음악 신청 권한이 부족합니다.', 403);
    }

    // 4. YouTube URL 유효성 검사 (간단한 검사)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      throw new AppError('올바른 YouTube URL이 아닙니다.', 400);
    }

    // 5. YouTube 제목 추출
    const title = await this.getYoutubeTitle(youtubeUrl);

    // 6. 큐에 추가
    const queueId = musicModel.addToQueue(
      youtubeUrl,
      title,
      user.name,
      team.name
    );

    // 7. 권한 차감
    teamModel.decrementMusicRequestCount(teamId);

    return {
      message: '음악이 신청되었습니다.',
      queueId,
      title,
      youtubeUrl,
      requester: user.name,
      team: team.name
    };
  },

  // 큐 조회 (URL, 제목, 신청팀만 반환)
  getQueue() {
    const queue = musicModel.getQueue();
    return queue.map(item => ({
      id: item.id,
      url: item.youtube_url,
      title: item.title,
      team: item.requester_team_name
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

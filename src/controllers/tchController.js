import { storeService } from '../services/storeService.js';
import { teamModel } from '../models/teamModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { config } from '../config/index.js';

export async function getAllStores(req, res, next) {
  try {
    const stores = storeService.getAllStores();

    res.json({
      success: true,
      data: { stores },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStore(req, res, next) {
  try {
    const { id } = req.params;
    const store = storeService.getStoreById(parseInt(id, 10));

    res.json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
}

export async function createStore(req, res, next) {
  try {
    const { itemName, description, image, price, quantity, type } = req.body;

    const result = storeService.createStore(
      { itemName, description, image, price, quantity, type },
      req.user.id
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateStore(req, res, next) {
  try {
    const { id } = req.params;
    const { itemName, description, image, price, quantity, type } = req.body;

    const result = storeService.updateStore(
      parseInt(id, 10),
      { itemName, description, image, price, quantity, type },
      req.user.id
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteStore(req, res, next) {
  try {
    const { id } = req.params;
    const result = storeService.deleteStore(parseInt(id, 10), req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAccount(req, res, next) {
  try {
    const teams = teamModel.getAllTeams();

    if (!teams || teams.length === 0) {
      throw { status: 404, message: '해당 팀은 존재하지 않습니다.', code: 'TEAM_NOT_FOUND' };
    }

    const formattedTeams = teams.map(team => ({
      teamName: team.name,
      teamId: team.id,
      teamCredit: team.team_credit
    }));

    res.json({
      teams: formattedTeams
    });
  } catch (error) {
    next(error);
  }
}

export async function addCredit(req, res, next) {
  try {
    const { teamId, addCredit } = req.body;

    // 1. 입력값 검증
    if (!teamId) {
      throw { status: 400, message: '팀 ID가 입력되지 않았습니다.', code: 'NOT_ENTERED' };
    }

    if (addCredit === undefined || addCredit === null) {
      throw { status: 400, message: '크레딧이 입력되지 않았습니다.', code: 'NOT_ENTERED' };
    }

    // 2. addCredit 값 검증 (숫자, 양수)
    const creditValue = Number(addCredit);
    if (isNaN(creditValue) || creditValue < 0) {
      throw { status: 400, message: '크레딧 값이 잘못되었습니다.', code: 'INVALIED_VALUE' };
    }

    // 3. 팀 존재 확인
    const team = teamModel.findById(teamId);
    if (!team) {
      throw { status: 404, message: '해당 팀은 존재하지 않습니다.', code: 'TEAM_NOT_FOUND' };
    }

    // 4. 크레딧 추가
    const newCredit = team.team_credit + creditValue;
    teamModel.updateTeamCredit(teamId, newCredit);

    res.json({
      credit: newCredit,
      message: '크레딧 추가에 성공했습니다.'
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadStoreImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 'INVALID_IMAGE',
        message: '이미지가 잘못되었습니다.'
      });
    }

    // 이미지 URL 생성
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/store-images/${req.file.filename}`;

    res.json({
      imageUrl: imageUrl,
      message: '이미지 업로드에 성공했습니다.'
    });
  } catch (error) {
    next(error);
  }
}

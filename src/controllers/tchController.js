import { storeService } from '../services/storeService.js';
import { teamModel } from '../models/teamModel.js';
import { purchaseModel } from '../models/purchaseModel.js';
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

    // ID 검증
    const itemId = parseInt(id, 10);
    if (isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({
        code: 'INVALID_ITEMID',
        message: '물품 ID가 잘못되었습니다.'
      });
    }

    const result = storeService.deleteStore(itemId, req.user.id);

    res.json(result);
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

    const crypto = await import('crypto');
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, '../../uploads/store-images');

    // 업로드된 파일의 해시 계산
    const fileBuffer = await fs.readFile(req.file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // 기존 파일들 확인
    const existingFiles = await fs.readdir(uploadsDir);

    for (const file of existingFiles) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        const existingBuffer = await fs.readFile(filePath);
        const existingHash = crypto.createHash('md5').update(existingBuffer).digest('hex');

        if (hash === existingHash) {
          // 중복 파일 발견 - 새로 업로드한 파일 삭제
          await fs.unlink(req.file.path);

          const imageUrl = `${req.protocol}://${req.get('host')}/uploads/store-images/${file}`;
          return res.json({
            imageUrl: imageUrl,
            message: '이미 존재하는 이미지입니다.'
          });
        }
      }
    }

    // 중복 없음 - 새 파일 URL 반환
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/store-images/${req.file.filename}`;

    res.json({
      imageUrl: imageUrl,
      message: '이미지 업로드에 성공했습니다.'
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchases(req, res, next) {
  try {
    const purchases = purchaseModel.getAllPurchases();

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: '구매한 물품이 없습니다.'
      });
    }

    const items = purchases.map(purchase => ({
      teamId: purchase.team_id,
      itemId: purchase.item_id,
      quantity: purchase.quantity,
      when: purchase.purchased_at.replace(' ', 'T') + 'Z'
    }));

    res.json({
      items
    });
  } catch (error) {
    next(error);
  }
}

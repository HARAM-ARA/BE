import { storeModel } from '../models/storeModel.js';
import { teamModel } from '../models/teamModel.js';
import { purchaseModel } from '../models/purchaseModel.js';
import { getDatabase } from '../models/db.js';
import { validatePrice, validateQuantity, validateString } from '../utils/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

export const storeService = {
  getAllStores() {
    return storeModel.findAll();
  },

  getStoreById(id) {
    const store = storeModel.findById(id);
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    return store;
  },

  createStore(data, teacherId) {
    // 1. itemName 검증
    if (!data.itemName || typeof data.itemName !== 'string' || data.itemName.trim().length === 0) {
      throw { status: 400, code: 'INVALID_NAME', message: '이름이 잘못되었습니다.' };
    }

    // 2. 중복 확인
    const existingStore = storeModel.findByName(data.itemName);
    if (existingStore) {
      throw { status: 409, code: 'DUPLICATE_ITEM', message: '이미 존재하는 이름의 아이템입니다.' };
    }

    // 3. price 검증 (정수, 음수 불가)
    if (typeof data.price !== 'number' || !Number.isInteger(data.price) || data.price < 0) {
      throw { status: 400, code: 'INVALID_PRICE', message: '금액이 잘못되었습니다.' };
    }

    // 4. quantity 검증 (-1은 무제한)
    if (typeof data.quantity !== 'number' || !Number.isInteger(data.quantity) || (data.quantity < -1)) {
      throw { status: 400, code: 'BAD_REQUEST', message: '잘못된 요청입니다.' };
    }

    // 5. type 검증 (1=쿠폰, 2=간식)
    if (![1, 2].includes(data.type)) {
      throw { status: 400, code: 'INVALID_TYPE', message: '타입이 잘못되었습니다.' };
    }

    const storeData = {
      name: data.itemName,
      description: data.description || null,
      price: data.price,
      quantity: data.quantity,
      imageUrl: data.image || null,
      type: data.type,
      teacherId,
    };

    const storeId = storeModel.create(storeData);
    const createdStore = storeModel.findById(storeId);

    return {
      itemId: createdStore.id,
      itemName: createdStore.name,
      message: '물품 추가에 성공했습니다.'
    };
  },

  updateStore(id, data, teacherId) {
    // 1. 상점 존재 확인
    const store = storeModel.findById(id);
    if (!store) {
      throw { status: 404, code: 'NOT_FOUND', message: '상점을 찾을 수 없습니다.' };
    }

    // 2. 권한 확인
    if (store.teacher_id !== teacherId) {
      throw { status: 403, code: 'FORBIDDEN', message: '접근 권한이 부족합니다.' };
    }

    // 3. itemName 검증 (제공된 경우)
    if (data.itemName !== undefined) {
      if (!data.itemName || typeof data.itemName !== 'string' || data.itemName.trim().length === 0) {
        throw { status: 400, code: 'INVALID_NAME', message: '이름이 잘못되었습니다.' };
      }

      // 다른 상점과 이름 중복 확인
      const existingStore = storeModel.findByName(data.itemName);
      if (existingStore && existingStore.id !== id) {
        throw { status: 409, code: 'DUPLICATE_ITEM', message: '이미 존재하는 이름의 아이템입니다.' };
      }
    }

    // 4. price 검증 (제공된 경우)
    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || !Number.isInteger(data.price) || data.price < 0) {
        throw { status: 400, code: 'INVALID_PRICE', message: '금액이 잘못되었습니다.' };
      }
    }

    // 5. quantity 검증 (제공된 경우)
    if (data.quantity !== undefined) {
      if (typeof data.quantity !== 'number' || !Number.isInteger(data.quantity) || data.quantity < -1) {
        throw { status: 400, code: 'BAD_REQUEST', message: '잘못된 요청입니다.' };
      }
    }

    // 6. type 검증 (제공된 경우)
    if (data.type !== undefined) {
      if (![1, 2].includes(data.type)) {
        throw { status: 400, code: 'INVALID_TYPE', message: '타입이 잘못되었습니다.' };
      }
    }

    const updateData = {
      name: data.itemName !== undefined ? data.itemName : store.name,
      description: data.description !== undefined ? data.description : store.description,
      price: data.price !== undefined ? data.price : store.price,
      quantity: data.quantity !== undefined ? data.quantity : store.quantity,
      imageUrl: data.image !== undefined ? data.image : store.image_url,
      type: data.type !== undefined ? data.type : store.type,
    };

    storeModel.update(id, updateData);

    return {
      itemId: id,
      message: '물품 수정에 성공했습니다.'
    };
  },

  deleteStore(id, teacherId) {
    // 삭제된 것도 포함해서 조회 (이미 삭제된 경우 처리)
    const store = storeModel.findByIdIncludingDeleted(id);

    if (!store) {
      throw { status: 404, code: 'NOT_FOUND', message: '존재하는 물품이 아닙니다.' };
    }

    if (store.deleted === 1) {
      throw { status: 404, code: 'NOT_FOUND', message: '존재하는 물품이 아닙니다.' };
    }

    if (store.teacher_id !== teacherId) {
      throw { status: 403, code: 'FORBIDDEN', message: '접근 권한이 부족합니다.' };
    }

    storeModel.delete(id);

    return {
      itemId: id,
      message: '해당 물품이 삭제되었습니다.',
      deleted: true
    };
  },

  purchaseItem(user, itemId, quantity) {
    // 1. 수량 검증
    if (!quantity || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      throw { status: 400, code: 'INVALID_QUANTITY', message: '수량 입력이 잘못되었습니다.' };
    }

    // 2. 사용자의 팀 조회
    const studentTeam = teamModel.findStudentTeam(user.id);
    if (!studentTeam) {
      throw { status: 404, code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' };
    }
    const teamId = studentTeam.team_id;

    // 3. 상품 존재 확인
    const item = storeModel.findById(itemId);
    if (!item || item.deleted === 1) {
      throw { status: 404, code: 'ITEM_NOT_FOUND', message: '상품을 찾을 수 없습니다' };
    }

    // 4. 재고 확인 (quantity가 -1이면 무제한)
    if (item.quantity !== -1 && item.quantity < quantity) {
      throw { status: 404, code: 'OUT_OF_QUANTITY', message: '상품 재고가 없습니다.' };
    }

    // 5. 총 가격 계산
    const totalPrice = item.price * quantity;

    // 6. 팀 정보 조회 및 크레딧 확인
    const team = teamModel.findById(teamId);
    if (!team) {
      throw { status: 404, code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' };
    }

    if (team.team_credit < totalPrice) {
      throw { status: 403, code: 'PAYMENT_REQUIRED', message: '크레딧이 부족합니다' };
    }

    // 7. 트랜잭션으로 처리
    const db = getDatabase();
    const transaction = db.transaction(() => {
      // 팀 크레딧 차감
      const newCredit = team.team_credit - totalPrice;
      teamModel.updateTeamCredit(teamId, newCredit);

      // 상품 재고 차감 (quantity가 -1이 아닌 경우만)
      if (item.quantity !== -1) {
        const updateStmt = db.prepare('UPDATE stores SET quantity = quantity - ? WHERE id = ?');
        updateStmt.run(quantity, itemId);
      }

      // 구매 기록 저장
      purchaseModel.createPurchase(teamId, itemId, quantity, totalPrice);

      // id가 0인 물건 구매 시 notice_count 증가
      if (itemId === 0) {
        teamModel.incrementNoticeCount(teamId);
      }

      return newCredit;
    });

    const remainingCredit = transaction();

    return {
      message: '구매가 완료되었습니다.',
      item: {
        itemId: item.id,
        price: item.price,
        name: item.name,
        quantity: quantity
      },
      remainingCredit: remainingCredit
    };
  },
};

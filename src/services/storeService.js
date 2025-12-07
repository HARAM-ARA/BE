import { storeModel } from '../models/storeModel.js';
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
};

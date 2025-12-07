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
    try {
      const store = storeModel.findById(id);
      if (!store) {
        throw new AppError('Store not found', 404);
      }

      if (store.teacher_id !== teacherId) {
        throw new AppError('Unauthorized to update this store', 403);
      }

      if (data.name) validateString(data.name, 'Store name', 1, 100);
      if (data.price !== undefined) validatePrice(data.price);
      if (data.quantity !== undefined) validateQuantity(data.quantity);

      const updateData = {
        name: data.name || store.name,
        price: data.price !== undefined ? data.price : store.price,
        quantity: data.quantity !== undefined ? data.quantity : store.quantity,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : store.image_url,
      };

      storeModel.update(id, updateData);
      return storeModel.findById(id);
    } catch (error) {
      throw new AppError(error.message, error.statusCode || 400);
    }
  },

  deleteStore(id, teacherId) {
    const store = storeModel.findById(id);
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    if (store.teacher_id !== teacherId) {
      throw new AppError('Unauthorized to delete this store', 403);
    }

    storeModel.delete(id);
    return { message: 'Store deleted successfully' };
  },
};

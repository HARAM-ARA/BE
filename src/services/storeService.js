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
    try {
      validateString(data.name, 'Store name', 1, 100);
      validatePrice(data.price);
      validateQuantity(data.quantity);

      const storeData = {
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        imageUrl: data.imageUrl || null,
        teacherId,
      };

      const storeId = storeModel.create(storeData);
      return storeModel.findById(storeId);
    } catch (error) {
      throw new AppError(error.message, 400);
    }
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

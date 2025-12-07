import { storeModel } from '../models/storeModel.js';

export const storeController = {
  async getAllItems(req, res, next) {
    try {
      const stores = storeModel.findAll();

      if (!stores || stores.length === 0) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: '아무런 물품이 존재하지 않습니다.'
        });
      }

      const items = stores.map(store => ({
        itemId: store.id,
        itemName: store.name,
        description: store.description,
        image: store.image_url,
        price: store.price,
        quantity: store.quantity,
        type: store.type
      }));

      res.json({ items });
    } catch (error) {
      next(error);
    }
  },

  async getItemsByType(req, res, next) {
    try {
      const { type } = req.params;
      const typeNum = parseInt(type, 10);

      // type 검증 (1 또는 2만 허용)
      if (![1, 2].includes(typeNum)) {
        return res.status(400).json({
          code: 'TYPE_ERROR',
          message: '타입이 잘못 입력되었습니다.'
        });
      }

      const stores = storeModel.findByType(typeNum);

      if (!stores || stores.length === 0) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: '아무런 물품이 존재하지 않습니다.'
        });
      }

      const items = stores.map(store => ({
        itemId: store.id,
        itemName: store.name,
        description: store.description,
        image: store.image_url,
        price: store.price,
        quantity: store.quantity,
        type: store.type
      }));

      res.json({ items });
    } catch (error) {
      next(error);
    }
  }
};

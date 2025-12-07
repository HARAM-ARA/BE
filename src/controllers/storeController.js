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
  }
};

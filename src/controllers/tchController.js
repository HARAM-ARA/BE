import { storeService } from '../services/storeService.js';
import { teamModel } from '../models/teamModel.js';
import { AppError } from '../middlewares/errorHandler.js';

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
    const { name, price, quantity, imageUrl } = req.body;

    if (!name || price === undefined || quantity === undefined) {
      throw new AppError('Name, price, and quantity are required', 400);
    }

    const store = storeService.createStore(
      { name, price, quantity, imageUrl },
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStore(req, res, next) {
  try {
    const { id } = req.params;
    const { name, price, quantity, imageUrl } = req.body;

    const store = storeService.updateStore(
      parseInt(id, 10),
      { name, price, quantity, imageUrl },
      req.user.id
    );

    res.json({
      success: true,
      data: { store },
    });
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

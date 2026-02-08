import type { Request, Response } from 'express';
import * as categoryGroupService from '../api/services/category-group.service.js';

export const getCategoryGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryGroups = await categoryGroupService.getCategoryGroups();
    res.json(categoryGroups);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch category groups' 
    });
  }
};
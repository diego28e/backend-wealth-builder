import type { Request, Response } from 'express';
import * as goalService from '../api/services/goal.service.js';

export const createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.body.user_id; // Assumes middleware sets this or it's passed in body for now. 
        // Ideally, auth middleware sets req.user.id, but following project pattern.
        // Looking at receipt.controller.ts, it uses req.body.user_id.

        if (!userId) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }

        const goal = await goalService.createGoal(userId, req.body);
        res.status(201).json(goal);
    } catch (error) {
        console.error('Create Goal Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create goal' });
    }
};

export const getGoals = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'userId parameter is required' });
            return;
        }

        const goals = await goalService.getGoals(userId);
        res.json(goals);
    } catch (error) {
        console.error('Get Goals Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to retrieve goals' });
    }
};

export const getGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const queryUserId = req.query.user_id as string | undefined;

        if (!queryUserId) {
            res.status(400).json({ error: 'user_id query parameter is required' });
            return;
        }

        // Explicitly cast params.id to string (Express params are strings but TS can be strict)
        const goal = await goalService.getGoalById(id as string, queryUserId);

        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        res.json(goal);
    } catch (error) {
        console.error('Get Goal Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to retrieve goal' });
    }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { user_id, ...updates } = req.body;

        if (!user_id) {
            res.status(400).json({ error: 'user_id is required in body' });
            return;
        }

        // Ensure user_id is string
        const userIdStr = String(user_id);

        const updatedGoal = await goalService.updateGoal(id as string, userIdStr, updates);
        res.json(updatedGoal);
    } catch (error) {
        console.error('Update Goal Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update goal' });
    }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const userId = (req.body.user_id || req.query.user_id) as string | undefined;

        if (!userId) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }

        await goalService.deleteGoal(id as string, userId);
        res.status(204).send();
    } catch (error) {
        console.error('Delete Goal Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete goal' });
    }
};

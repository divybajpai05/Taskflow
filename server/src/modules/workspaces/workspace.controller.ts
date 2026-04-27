// src/modules/workspaces/workspace.controller.ts
import { Request, Response, NextFunction } from "express";
import { WorkspaceService } from "./workspace.service";

const workspaceService = new WorkspaceService();

export class WorkspaceController {
  /**
   * GET /api/workspaces
   * Get all workspaces owned by the current user
   */
  async getWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const workspaces = await workspaceService.getUserWorkspaces(userId);

      res.json({
        success: true,
        data: workspaces,
        count: workspaces.length,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/workspaces/:id
   */
  async getWorkspaceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const workspace = await workspaceService.getWorkspaceById(id);

      res.json({
        success: true,
        data: workspace,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/workspaces
   * Create a new workspace (user becomes owner)
   */
  async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body;
      const ownerId = req.user!.id;

      const workspace = await workspaceService.createWorkspace(input, ownerId);

      res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        data: workspace,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/workspaces/:id
   */
  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const input = req.body;
      const userId = req.user!.id;

      const workspace = await workspaceService.updateWorkspace(
        id,
        input,
        userId,
      );

      res.json({
        success: true,
        message: "Workspace updated successfully",
        data: workspace,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/workspaces/:id
   */
  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      const result = await workspaceService.deleteWorkspace(id, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/workspaces/:id/switch
   */
  async switchWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      // Get the workspace
      const workspace = await workspaceService.getWorkspaceById(id);

      // Check if user owns this workspace
      if (workspace.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          error: "You can only switch to workspaces you own",
        });
      }

      res.json({
        success: true,
        message: `Switched to "${workspace.name}"`,
        data: {
          id: workspace.id,
          name: workspace.name,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

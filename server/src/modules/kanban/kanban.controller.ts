// src/modules/kanban/kanban.controller.ts
import { Request, Response, NextFunction } from "express";
import { KanbanService } from "./kanban.service";

const kanbanService = new KanbanService();

export class KanbanController {
  async getBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;
      const search = req.query.search as string;
      const priority = req.query.priority as string;

      const board = await kanbanService.getBoard(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
        { search, priority },
      );

      res.json({ success: true, data: board });
    } catch (error: any) {
      next(error);
    }
  }

  async moveTask(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const { taskId, newStatus } = req.body;

      if (!taskId || !newStatus) {
        return res.status(400).json({
          success: false,
          error: "taskId and newStatus are required",
        });
      }

      const result = await kanbanService.moveTask(
        taskId,
        newStatus,
        userId,
        workspaceId,
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }
}

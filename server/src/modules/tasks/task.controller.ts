// src/modules/tasks/task.controller.ts
import { Request, Response, NextFunction } from "express";
import { TaskService } from "./task.service";

const taskService = new TaskService();

export class TaskController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
       const userTeamId = req.user?.teamId || null; 

      const { search, teamId, priority, status } = req.query;

      console.log("🔵 Controller - req.user:", req.user);
      console.log("🔵 Controller - permissions:", req.user?.permissions);

      const tasks = await taskService.getTasks(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
        {
          search: search as string,
          teamId: teamId as string,
          priority: priority as string,
          status: status as string,
        },
      );

      res.json({ success: true, data: tasks, count: tasks.length });
    } catch (error: any) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const createdById = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const input = req.body;
      const result = await taskService.createTask(
        input,
        workspaceId,
        createdById,
        userPermissions,
      );
      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id as string;
            const workspaceId = req.user!.workspaceId;

      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const input = req.body;
      const result = await taskService.updateTask(
        taskId,
        input,
        userId,
        userPermissions,
        workspaceId,
      );
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.id as string;
      const userId = req.user!.id;
                  const workspaceId = req.user!.workspaceId;

      const userPermissions = req.user!.permissions || [];
      const result = await taskService.deleteTask(
        taskId,
        userId,
        userPermissions,
        workspaceId,
      );
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const teams = await taskService.getTeams(workspaceId);
      res.json({ success: true, data: teams });
    } catch (error: any) {
      next(error);
    }
  }
}

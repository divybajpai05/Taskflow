// src/modules/dashboard/dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;

      const stats = await dashboardService.getOverviewStats(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
      );
      res.json({ success: true, data: stats });
    } catch (error: any) {
      next(error);
    }
  }

  async getActiveTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;
      const limit = parseInt(req.query.limit as string) || 5;
      const offset = parseInt(req.query.offset as string) || 0;

      const data = await dashboardService.getActiveTasks(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
        limit,
        offset,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getTeamWorkload(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;

      const data = await dashboardService.getTeamWorkload(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getOverdueTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;

      const data = await dashboardService.getOverdueTasks(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  // In dashboard.controller.ts

  async getLiveActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;
      const limit = parseInt(req.query.limit as string) || 10;

      const data = await dashboardService.getLiveActivity(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
        limit,
      );

      // ✅ Return both activities array and total count
      res.json({
        success: true,
        data: data.activities,
        total: data.total,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

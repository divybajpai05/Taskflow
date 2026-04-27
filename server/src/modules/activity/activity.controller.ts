// src/modules/activity/activity.controller.ts
import { Request, Response, NextFunction } from "express";
import { ActivityService } from "./activity.service";

const activityService = new ActivityService();

export class ActivityController {
  /**
   * GET /api/activities
   * Get activity logs with filters
   */
  async getActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { search, eventType, dateFrom, dateTo, limit, offset } = req.query;

      const logs = await activityService.getActivityLogs(workspaceId, {
        search: search as string,
        eventType: eventType as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      const total = await activityService.getActivityCount(workspaceId, {
        eventType: eventType as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });

      res.json({
        success: true,
        data: logs,
        total,
        count: logs.length,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getEventTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const types = await activityService.getEventTypes(workspaceId);

      res.json({
        success: true,
        data: [{ value: "all", label: "All Events" }, ...types],
      });
    } catch (error: any) {
      next(error);
    }
  }
}

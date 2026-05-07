// src/modules/analytics/analytics.controller.ts
import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo, memberId, teamId, status, priority } =
        req.query;

      const data = await analyticsService.getKPIData(
        workspaceId,
        dateFrom as string,
        dateTo as string,
        memberId as string,
        teamId as string,
        status as string,
        priority as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo, memberId, teamId, status, priority } =
        req.query;

      const data = await analyticsService.getChartData(
        workspaceId,
        dateFrom as string,
        dateTo as string,
        memberId as string,
        teamId as string,
        status as string,
        priority as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getTeamPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo, memberId, teamId } = req.query;

      const data = await analyticsService.getTeamPerformance(
        workspaceId,
        dateFrom as string,
        dateTo as string,
        memberId as string,
        teamId as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getTaskDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo, memberId, teamId, status, priority } =
        req.query;

      const data = await analyticsService.getTaskDetails(
        workspaceId,
        dateFrom as string,
        dateTo as string,
        memberId as string,
        teamId as string,
        status as string,
        priority as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  // Add these methods to AnalyticsController:

  async getTeamWorkload(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo } = req.query;
      const data = await analyticsService.getTeamWorkload(
        workspaceId,
        dateFrom as string,
        dateTo as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getTeamCompletionRate(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo } = req.query;
      const data = await analyticsService.getTeamCompletionRate(
        workspaceId,
        dateFrom as string,
        dateTo as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getPriorityTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo } = req.query;
      const data = await analyticsService.getPriorityTrends(
        workspaceId,
        dateFrom as string,
        dateTo as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getAttendanceTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo } = req.query;
      const data = await analyticsService.getAttendanceTrend(
        workspaceId,
        dateFrom as string,
        dateTo as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getEmployeeDistribution(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const workspaceId = req.user!.workspaceId;
      const data = await analyticsService.getEmployeeDistribution(workspaceId);
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getLeaveTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { dateFrom, dateTo } = req.query;
      const data = await analyticsService.getLeaveTrends(
        workspaceId,
        dateFrom as string,
        dateTo as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }
}

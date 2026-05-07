// src/modules/hr-dashboard/hr-dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { HRDashboardService } from "./hr-dashboard.service";

const hrDashboardService = new HRDashboardService();

export class HRDashboardController {
  async getKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const department = req.query.department as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const data = await hrDashboardService.getKPIData(
        workspaceId,
        department,
        dateFrom,
        dateTo,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const department = req.query.department as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const data = await hrDashboardService.getChartData(
        workspaceId,
        department,
        dateFrom,
        dateTo,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }


  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const department = req.query.department as string;
      const memberId = req.query.memberId as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const data = await hrDashboardService.getEmployeeLists(
        workspaceId,
        department,
        memberId,
        dateFrom,
        dateTo,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }
}

// src/modules/hr-calendar/hr-calendar.controller.ts
import { Request, Response, NextFunction } from "express";
import { HRCalendarService } from "./hr-calendar.service";

const hrCalendarService = new HRCalendarService();

export class HRCalendarController {
  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;
      const month = parseInt(req.query.month as string) || undefined;
      const year = parseInt(req.query.year as string) || undefined;

      const events = await hrCalendarService.getHREvents(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
        month,
        year,
      );

      res.json({ success: true, data: events });
    } catch (error: any) {
      next(error);
    }
  }
}

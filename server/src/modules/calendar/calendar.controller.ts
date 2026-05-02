// src/modules/calendar/calendar.controller.ts
import { Request, Response, NextFunction } from "express";
import { CalendarService } from "./calendar.service";

const calendarService = new CalendarService();

export class CalendarController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;

      const tasks = await calendarService.getCalendarTasks(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
      );

      res.json({ success: true, data: tasks });
    } catch (error: any) {
      next(error);
    }
  }

  async moveTask(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const { taskId, newDueDate } = req.body;

      if (!taskId || !newDueDate) {
        return res.status(400).json({
          success: false,
          error: "taskId and newDueDate are required",
        });
      }

      const result = await calendarService.moveTaskDueDate(
        taskId,
        newDueDate,
        userId,
        workspaceId,
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }


  async getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;

      const events = await calendarService.getAllCalendarEvents(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
      );

      res.json({ success: true, data: events });
    } catch (error: any) {
      next(error);
    }
  }
}

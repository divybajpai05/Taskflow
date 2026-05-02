// src/modules/attendance/attendance.controller.ts
import { Request, Response, NextFunction } from "express";
import { AttendanceService } from "./attendance.service";

const attendanceService = new AttendanceService();

export class AttendanceController {
  /**
   * GET /api/attendance?date=YYYY-MM-DD
   * Get attendance sheet for a date
   */
  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const date =
        (req.query.date as string) || new Date().toISOString().split("T")[0];

      const attendanceSheet = await attendanceService.getAttendanceByDate(
        workspaceId,
        date,
      );

      res.json({
        success: true,
        data: attendanceSheet,
        date,
        count: attendanceSheet.length,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/stats?date=YYYY-MM-DD
   * Get attendance stats for a date
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const date =
        (req.query.date as string) || new Date().toISOString().split("T")[0];

      const stats = await attendanceService.getAttendanceStats(
        workspaceId,
        date,
      );

      res.json({ success: true, data: stats, date });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/attendance
   * Mark attendance for a user
   */
  async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const markedById = req.user!.id;
      const { userId, date, status, notes } = req.body;

      if (!userId || !date || !status) {
        return res.status(400).json({
          success: false,
          error: "userId, date, and status are required",
        });
      }

      const result = await attendanceService.markAttendance(
        workspaceId,
        userId,
        date,
        status,
        markedById,
        notes,
      );

      res.json({
        success: true,
        message: `Attendance marked as ${status}`,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/bulk
   * Bulk mark attendance
   */
  async bulkMarkAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const markedById = req.user!.id;
      const { date, status, userIds } = req.body;

      if (!date || !status || !userIds || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "date, status, and userIds are required",
        });
      }

      const result = await attendanceService.bulkMarkAttendance(
        workspaceId,
        date,
        status,
        userIds,
        markedById,
      );

      res.json({
        success: true,
        message: `Marked ${result.count} users as ${status}`,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/monthly?month=4&year=2026
   */
  async getMonthlyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const month =
        parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();

      const stats = await attendanceService.getMonthlyStats(
        workspaceId,
        month,
        year,
      );

      res.json({ success: true, data: stats });
    } catch (error: any) {
      next(error);
    }
  }


  async getCalendarMonthly(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const userTeamId = req.user?.teamId || null;
      const month =
        parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();

      const records = await attendanceService.getCalendarMonthly(
        workspaceId,
        userId,
        userPermissions,
        userTeamId,
        month,
        year,
      );

      res.json({ success: true, data: records });
    } catch (error: any) {
      next(error);
    }
  }
}

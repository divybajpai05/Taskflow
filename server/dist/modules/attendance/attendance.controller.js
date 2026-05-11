"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const attendance_service_1 = require("./attendance.service");
const attendanceService = new attendance_service_1.AttendanceService();
class AttendanceController {
    /**
     * GET /api/attendance?date=YYYY-MM-DD
     * Get attendance sheet for a date
     */
    async getAttendance(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const date = req.query.date || new Date().toISOString().split("T")[0];
            const attendanceSheet = await attendanceService.getAttendanceByDate(workspaceId, date);
            res.json({
                success: true,
                data: attendanceSheet,
                date,
                count: attendanceSheet.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/attendance/stats?date=YYYY-MM-DD
     * Get attendance stats for a date
     */
    async getStats(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const date = req.query.date || new Date().toISOString().split("T")[0];
            const stats = await attendanceService.getAttendanceStats(workspaceId, date);
            res.json({ success: true, data: stats, date });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/attendance
     * Mark attendance for a user
     */
    async markAttendance(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const markedById = req.user.id;
            const { userId, date, status, notes } = req.body;
            if (!userId || !date || !status) {
                return res.status(400).json({
                    success: false,
                    error: "userId, date, and status are required",
                });
            }
            const result = await attendanceService.markAttendance(workspaceId, userId, date, status, markedById, notes);
            res.json({
                success: true,
                message: `Attendance marked as ${status}`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/attendance/bulk
     * Bulk mark attendance
     */
    async bulkMarkAttendance(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const markedById = req.user.id;
            const { date, status, userIds } = req.body;
            if (!date || !status || !userIds || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "date, status, and userIds are required",
                });
            }
            const result = await attendanceService.bulkMarkAttendance(workspaceId, date, status, userIds, markedById);
            res.json({
                success: true,
                message: `Marked ${result.count} users as ${status}`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/attendance/monthly?month=4&year=2026
     */
    async getMonthlyStats(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const stats = await attendanceService.getMonthlyStats(workspaceId, month, year);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async getCalendarMonthly(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const month = parseInt(req.query.month) || new Date().getMonth() + 1;
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const records = await attendanceService.getCalendarMonthly(workspaceId, userId, userPermissions, userTeamId, month, year);
            res.json({ success: true, data: records });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AttendanceController = AttendanceController;

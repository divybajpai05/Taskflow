"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const calendar_service_1 = require("./calendar.service");
const calendarService = new calendar_service_1.CalendarService();
class CalendarController {
    async getTasks(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const tasks = await calendarService.getCalendarTasks(workspaceId, userId, userPermissions, userTeamId);
            res.json({ success: true, data: tasks });
        }
        catch (error) {
            next(error);
        }
    }
    async moveTask(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const { taskId, newDueDate } = req.body;
            if (!taskId || !newDueDate) {
                return res.status(400).json({
                    success: false,
                    error: "taskId and newDueDate are required",
                });
            }
            const result = await calendarService.moveTaskDueDate(taskId, newDueDate, userId, workspaceId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllEvents(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const events = await calendarService.getAllCalendarEvents(workspaceId, userId, userPermissions, userTeamId);
            res.json({ success: true, data: events });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CalendarController = CalendarController;

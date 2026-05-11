"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRCalendarController = void 0;
const hr_calendar_service_1 = require("./hr-calendar.service");
const hrCalendarService = new hr_calendar_service_1.HRCalendarService();
class HRCalendarController {
    async getEvents(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const month = parseInt(req.query.month) || undefined;
            const year = parseInt(req.query.year) || undefined;
            const events = await hrCalendarService.getHREvents(workspaceId, userId, userPermissions, userTeamId, month, year);
            res.json({ success: true, data: events });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HRCalendarController = HRCalendarController;

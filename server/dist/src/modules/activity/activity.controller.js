"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityController = void 0;
const activity_service_1 = require("./activity.service");
const activityService = new activity_service_1.ActivityService();
class ActivityController {
    /**
     * GET /api/activities
     * Get activity logs with filters
     */
    async getActivities(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { search, eventType, dateFrom, dateTo, limit, offset } = req.query;
            const logs = await activityService.getActivityLogs(workspaceId, {
                search: search,
                eventType: eventType,
                dateFrom: dateFrom,
                dateTo: dateTo,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
            });
            const total = await activityService.getActivityCount(workspaceId, {
                eventType: eventType,
                dateFrom: dateFrom,
                dateTo: dateTo,
            });
            res.json({
                success: true,
                data: logs,
                total,
                count: logs.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getEventTypes(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const types = await activityService.getEventTypes(workspaceId);
            res.json({
                success: true,
                data: [{ value: "all", label: "All Events" }, ...types],
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ActivityController = ActivityController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanController = void 0;
const kanban_service_1 = require("./kanban.service");
const kanbanService = new kanban_service_1.KanbanService();
class KanbanController {
    async getBoard(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const search = req.query.search;
            const priority = req.query.priority;
            const board = await kanbanService.getBoard(workspaceId, userId, userPermissions, userTeamId, { search, priority });
            res.json({ success: true, data: board });
        }
        catch (error) {
            next(error);
        }
    }
    async moveTask(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const { taskId, newStatus } = req.body;
            if (!taskId || !newStatus) {
                return res.status(400).json({
                    success: false,
                    error: "taskId and newStatus are required",
                });
            }
            const result = await kanbanService.moveTask(taskId, newStatus, userId, workspaceId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.KanbanController = KanbanController;

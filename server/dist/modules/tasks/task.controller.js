"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const task_service_1 = require("./task.service");
const taskService = new task_service_1.TaskService();
class TaskController {
    async getTasks(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const { search, teamId, priority, status } = req.query;
            console.log("🔵 Controller - req.user:", req.user);
            console.log("🔵 Controller - permissions:", req.user?.permissions);
            const tasks = await taskService.getTasks(workspaceId, userId, userPermissions, userTeamId, {
                search: search,
                teamId: teamId,
                priority: priority,
                status: status,
            });
            res.json({ success: true, data: tasks, count: tasks.length });
        }
        catch (error) {
            next(error);
        }
    }
    async createTask(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const createdById = req.user.id;
            const userPermissions = req.user.permissions || [];
            const input = req.body;
            const result = await taskService.createTask(input, workspaceId, createdById, userPermissions);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const input = req.body;
            const result = await taskService.updateTask(taskId, input, userId, userPermissions, workspaceId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const userId = req.user.id;
            const workspaceId = req.user.workspaceId;
            const userPermissions = req.user.permissions || [];
            const result = await taskService.deleteTask(taskId, userId, userPermissions, workspaceId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getTeams(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const teams = await taskService.getTeams(workspaceId);
            res.json({ success: true, data: teams });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TaskController = TaskController;

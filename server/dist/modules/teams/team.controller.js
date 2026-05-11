"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamController = void 0;
const team_service_1 = require("./team.service");
const teamService = new team_service_1.TeamService();
class TeamController {
    async getTeams(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const { search } = req.query;
            const teams = await teamService.getWorkspaceTeams(workspaceId, userId, userPermissions, search);
            res.json({ success: true, data: teams });
        }
        catch (error) {
            next(error);
        }
    }
    async getTeamById(req, res, next) {
        try {
            const id = req.params.id;
            const team = await teamService.getTeamById(id);
            res.json({ success: true, data: team });
        }
        catch (error) {
            next(error);
        }
    }
    async createTeam(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const input = req.body;
            const team = await teamService.createTeam(input, workspaceId);
            res.status(201).json({ success: true, data: team });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTeam(req, res, next) {
        try {
            const id = req.params.id;
            const input = req.body;
            const team = await teamService.updateTeam(id, input);
            res.json({ success: true, data: team });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTeam(req, res, next) {
        try {
            const id = req.params.id;
            const result = await teamService.deleteTeam(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            next(error);
        }
    }
    async addTeamMember(req, res, next) {
        try {
            const teamId = req.params.id;
            const { userId } = req.body;
            const team = await teamService.addTeamMember(teamId, userId);
            res.json({ success: true, data: team });
        }
        catch (error) {
            next(error);
        }
    }
    async removeTeamMember(req, res, next) {
        try {
            const teamId = req.params.id;
            const userId = req.params.userId;
            const team = await teamService.removeTeamMember(teamId, userId);
            res.json({ success: true, data: team });
        }
        catch (error) {
            next(error);
        }
    }
    async getAvailableUsers(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const users = await teamService.getAvailableUsers(workspaceId);
            res.json({ success: true, data: users });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TeamController = TeamController;

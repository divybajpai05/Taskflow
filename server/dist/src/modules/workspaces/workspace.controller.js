"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = void 0;
const workspace_service_1 = require("./workspace.service");
const schema_1 = require("../../db/schema");
const drizzle_1 = require("../../db/drizzle");
const drizzle_orm_1 = require("drizzle-orm");
const jwt_1 = require("../../utils/jwt");
const auth_service_1 = require("../auth/auth.service");
const workspaceService = new workspace_service_1.WorkspaceService();
const authService = new auth_service_1.AuthService();
class WorkspaceController {
    /**
     * GET /api/workspaces
     * Get all workspaces owned by the current user
     */
    async getWorkspaces(req, res, next) {
        try {
            const userId = req.user.id;
            const workspaces = await workspaceService.getUserWorkspaces(userId);
            res.json({
                success: true,
                data: workspaces,
                count: workspaces.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/workspaces/:id
     */
    async getWorkspaceById(req, res, next) {
        try {
            const id = req.params.id;
            const workspace = await workspaceService.getWorkspaceById(id);
            res.json({
                success: true,
                data: workspace,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/workspaces
     * Create a new workspace (user becomes owner)
     */
    async createWorkspace(req, res, next) {
        try {
            const input = req.body;
            const ownerId = req.user.id;
            const workspace = await workspaceService.createWorkspace(input, ownerId);
            res.status(201).json({
                success: true,
                message: "Workspace created successfully",
                data: workspace,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/workspaces/:id
     */
    async updateWorkspace(req, res, next) {
        try {
            const id = req.params.id;
            const input = req.body;
            const userId = req.user.id;
            const workspace = await workspaceService.updateWorkspace(id, input, userId);
            res.json({
                success: true,
                message: "Workspace updated successfully",
                data: workspace,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/workspaces/:id
     */
    async deleteWorkspace(req, res, next) {
        try {
            const id = req.params.id;
            const userId = req.user.id;
            const result = await workspaceService.deleteWorkspace(id, userId);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/workspaces/:id/switch
     */
    async switchWorkspace(req, res, next) {
        try {
            const id = req.params.id;
            const userId = req.user.id;
            const workspace = await workspaceService.getWorkspaceById(id);
            const [member] = await drizzle_1.db
                .select()
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, id)))
                .limit(1);
            if (!member) {
                return res.status(403).json({
                    success: false,
                    error: "You are not a member of this workspace",
                });
            }
            // ✅ Get user's permissions for THIS workspace
            const userWithPerms = await authService.getUserWithPermissions(userId, id);
            // Generate new token with correct permissions
            const tokens = (0, jwt_1.generateTokens)({
                userId: userId,
                email: req.user.email,
                workspaceId: workspace.id,
                roleId: member.roleId,
            });
            res.json({
                success: true,
                message: `Switched to "${workspace.name}"`,
                data: {
                    id: workspace.id,
                    name: workspace.name,
                    accessToken: tokens.accessToken,
                    permissions: userWithPerms.permissions, // ✅ Include fresh permissions
                    role: userWithPerms.role, // ✅ Include role name
                    roleId: member.roleId,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WorkspaceController = WorkspaceController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const role_service_1 = require("./role.service");
const roleService = new role_service_1.RoleService();
class RoleController {
    /**
     * GET /api/roles
     * Get all roles with permissions
     */
    async getRoles(req, res, next) {
        try {
            const roles = await roleService.getAllRoles();
            res.json({
                success: true,
                data: roles,
                count: roles.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/roles/:id
     * Get a single role
     */
    async getRoleById(req, res, next) {
        try {
            const id = req.params.id;
            const role = await roleService.getRoleById(id);
            res.json({
                success: true,
                data: role,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/roles
     * Create a new custom role
     */
    async createRole(req, res, next) {
        try {
            const input = req.body;
            const userId = req.user.id;
            const workspaceId = req.user.workspaceId;
            const role = await roleService.createRole(input, userId, workspaceId);
            res.status(201).json({
                success: true,
                message: "Role created successfully",
                data: role,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/roles/:id
     * Update a role
     */
    async updateRole(req, res, next) {
        try {
            const id = req.params.id;
            const input = req.body;
            const userId = req.user.id;
            const workspaceId = req.user.workspaceId;
            const role = await roleService.updateRole(id, input, userId, workspaceId);
            res.json({
                success: true,
                message: "Role updated successfully",
                data: role,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/roles/:id
     * Delete a custom role
     */
    async deleteRole(req, res, next) {
        try {
            const id = req.params.id;
            const userId = req.user.id; // ✅ Get from authenticated user
            const workspaceId = req.user.workspaceId;
            const result = await roleService.deleteRole(id, userId, workspaceId);
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
     * GET /api/roles/permissions/list
     * Get all available permissions
     */
    async getPermissions(req, res, next) {
        try {
            const perms = await roleService.getAllPermissions();
            res.json({
                success: true,
                data: perms,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RoleController = RoleController;

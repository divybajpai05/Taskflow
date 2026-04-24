// src/modules/roles/role.controller.ts
import { Request, Response, NextFunction } from "express";
import { RoleService } from "./role.service";

const roleService = new RoleService();

export class RoleController {
  /**
   * GET /api/roles
   * Get all roles with permissions
   */
  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.getAllRoles();

      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/roles/:id
   * Get a single role
   */
  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const role = await roleService.getRoleById(id);

      res.json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/roles
   * Create a new custom role
   */
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body;
      const role = await roleService.createRole(input);

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: role,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/roles/:id
   * Update a role
   */
  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const input = req.body;

      const role = await roleService.updateRole(id, input);

      res.json({
        success: true,
        message: "Role updated successfully",
        data: role,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/roles/:id
   * Delete a custom role
   */
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await roleService.deleteRole(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/roles/permissions/list
   * Get all available permissions
   */
  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const perms = await roleService.getAllPermissions();

      res.json({
        success: true,
        data: perms,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

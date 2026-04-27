// src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";

const userService = new UserService();

export class UserController {
  /**
   * GET /api/users
   * Get all users in the workspace
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const search = req.query.search as string | undefined;

      const users = await userService.getWorkspaceUsers(workspaceId, search);

      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Get a single user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Create a new user
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const createdById = req.user!.id;
      const input = req.body;

      const user = await userService.createUser(
        input,
        workspaceId,
        createdById,
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Update a user
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const input = req.body;
      const updatedById = req.user!.id;
      const workspaceId = req.user!.workspaceId;

      const user = await userService.updateUser(id, input, updatedById, workspaceId);

      res.json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete a user
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const deletedById = req.user!.id;
      const workspaceId = req.user!.workspaceId;

      // Prevent self-deletion
      if (id === req.user!.id) {
        return res.status(400).json({
          success: false,
          error: "You cannot delete your own account",
        });
      }

      const result = await userService.deleteUser(id, deletedById, workspaceId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id/permissions
   * Update all user permissions
   */
  async updateUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { permissions } = req.body;

      const user = await userService.updateUserPermissions(id, permissions);

      res.json({
        success: true,
        message: "Permissions updated successfully",
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/permissions
   * Add a permission override
   */
  async addUserPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { permissionId, granted } = req.body;

      const user = await userService.addUserPermission(
        id,
        permissionId,
        granted ?? true,
      );

      res.json({
        success: true,
        message: "Permission added successfully",
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id/permissions/:permissionId
   * Remove a permission override
   */
  async removeUserPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, permissionId } = req.params;

      const user = await userService.removeUserPermission(
        `${id}`,
        `${permissionId}`,
      );

      res.json({
        success: true,
        message: "Permission removed successfully",
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/roles
   * Get all available roles
   */
  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await userService.getAllRoles();

      res.json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/permissions
   * Get all available permissions
   */
  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const perms = await userService.getAllPermissions();

      res.json({
        success: true,
        data: perms,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

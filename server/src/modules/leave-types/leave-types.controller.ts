// src/modules/leave-types/leave-types.controller.ts
import { Request, Response, NextFunction } from "express";
import { LeaveTypesService } from "./leave-types.service";

const leaveTypesService = new LeaveTypesService();

export class LeaveTypesController {
  // Get all leave types for workspace
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId as string;
      const leaveTypes = await leaveTypesService.getAll(workspaceId);
      res.json({ success: true, data: leaveTypes });
    } catch (error) {
      next(error);
    }
  }

  // Get active leave types (for dropdowns)
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId as string;
      const leaveTypes = await leaveTypesService.getActive(workspaceId);
      res.json({ success: true, data: leaveTypes });
    } catch (error) {
      next(error);
    }
  }

  // Get single leave type
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId as string;
      const id = req.params.id as string; // FIXED: Cast to string

      const leaveType = await leaveTypesService.getById(workspaceId, id);
      if (!leaveType) {
        return res
          .status(404)
          .json({ success: false, error: "Leave type not found" });
      }
      res.json({ success: true, data: leaveType });
    } catch (error) {
      next(error);
    }
  }

  // Create leave type
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId as string;
      const {
        name,
        description,
        color,
        isPaid,
        defaultDays,
        requiresApproval,
      } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res
          .status(400)
          .json({ success: false, error: "Name is required" });
      }

      const leaveType = await leaveTypesService.create(workspaceId, {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#3b82f6",
        isPaid: isPaid ?? true,
        defaultDays: defaultDays || 0,
        requiresApproval: requiresApproval ?? true,
      });

      res.status(201).json({ success: true, data: leaveType });
    } catch (error: any) {
      if (error.message === "Leave type with this name already exists") {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  // Update leave type
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId as string;
      const id = req.params.id as string; // FIXED: Cast to string
      const {
        name,
        description,
        color,
        isPaid,
        defaultDays,
        requiresApproval,
        isActive,
      } = req.body;

      const leaveType = await leaveTypesService.update(workspaceId, id, {
        name: name?.trim(),
        description: description?.trim(),
        color,
        isPaid,
        defaultDays,
        requiresApproval,
        isActive,
      });

      if (!leaveType) {
        return res
          .status(404)
          .json({ success: false, error: "Leave type not found" });
      }

      res.json({ success: true, data: leaveType });
    } catch (error: any) {
      if (error.message === "Leave type with this name already exists") {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  // Delete leave type
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId as string;
      const id = req.params.id as string; // FIXED: Cast to string

      const deleted = await leaveTypesService.delete(workspaceId, id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Leave type not found" });
      }

      res.json({ success: true, message: "Leave type deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

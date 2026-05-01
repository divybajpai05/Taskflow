// src/modules/leaves/leave.controller.ts
import { Request, Response, NextFunction } from "express";
import { LeaveService } from "./leave.service";

const leaveService = new LeaveService();

export class LeaveController {
  async getLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const { status, leaveType, department, search } = req.query;

      const leaves = await leaveService.getLeaves(workspaceId, {
        status: status as string,
        leaveType: leaveType as string,
        department: department as string,
        search: search as string,
      });

      res.json({ success: true, data: leaves, count: leaves.length });
    } catch (error: any) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const stats = await leaveService.getLeaveStats(workspaceId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      next(error);
    }
  }

  async createLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const input = req.body;

      if (!input.userId) {
        return res
          .status(400)
          .json({ success: false, error: "userId is required" });
      }

      const result = await leaveService.createLeave(input, workspaceId);
      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id as string;
      const approvedById = req.user!.id;
      const { status } = req.body;

      if (!status) {
        return res
          .status(400)
          .json({ success: false, error: "status is required" });
      }

      const result = await leaveService.updateLeaveStatus(leaveId, {
        status,
        approvedById,
      });
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async deleteLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveId = req.params.id as string;
      const result = await leaveService.deleteLeave(leaveId);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}

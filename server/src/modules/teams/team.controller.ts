// src/modules/teams/team.controller.ts
import { Request, Response, NextFunction } from "express";
import { TeamService } from "./team.service";

const teamService = new TeamService();

export class TeamController {
  
  async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userPermissions = req.user!.permissions || [];
      const { search } = req.query;

      const teams = await teamService.getWorkspaceTeams(
        workspaceId,
        userId,
        userPermissions,
        search as string,
      );

      res.json({ success: true, data: teams });
    } catch (error) {
      next(error);
    }
  }

  async getTeamById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const team = await teamService.getTeamById(id);
      res.json({ success: true, data: team });
    } catch (error: any) {
      next(error);
    }
  }

  async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const input = req.body;
      const team = await teamService.createTeam(input, workspaceId);
      res.status(201).json({ success: true, data: team });
    } catch (error: any) {
      next(error);
    }
  }

  async updateTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const input = req.body;
      const team = await teamService.updateTeam(id, input);
      res.json({ success: true, data: team });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await teamService.deleteTeam(id);
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      next(error);
    }
  }

  async addTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = req.params.id as string;
      const { userId } = req.body;
      const team = await teamService.addTeamMember(teamId, userId);
      res.json({ success: true, data: team });
    } catch (error: any) {
      next(error);
    }
  }

  async removeTeamMember(req: Request, res: Response, next: NextFunction) {
    try {
      const teamId = req.params.id as string;
      const userId = req.params.userId as string;
      const team = await teamService.removeTeamMember(teamId, userId);
      res.json({ success: true, data: team });
    } catch (error: any) {
      next(error);
    }
  }

  async getAvailableUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const users = await teamService.getAvailableUsers(workspaceId);
      res.json({ success: true, data: users });
    } catch (error: any) {
      next(error);
    }
  }
}

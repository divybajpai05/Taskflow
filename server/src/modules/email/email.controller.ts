// src/modules/email/email.controller.ts
import { Request, Response, NextFunction } from "express";
import { EmailService } from "./email.service";

const emailService = new EmailService();

export class EmailController {
  // Templates
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;
      const templates = await emailService.getTemplates(
        undefined,
        category as string,
      );
      res.json({ success: true, data: templates });
    } catch (error: any) {
      next(error);
    }
  }

  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const template = await emailService.getTemplateById(id);
      res.json({ success: true, data: template });
    } catch (error: any) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body;
      const createdById = req.user!.id;
      const template = await emailService.createTemplate(input, createdById);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const input = req.body;
      const template = await emailService.updateTemplate(id, input);
      res.json({ success: true, data: template });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await emailService.deleteTemplate(id);
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      next(error);
    }
  }

  // Recipients
  async getRecipients(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const search = req.query.search as string;
      const recipients = await emailService.getRecipients(workspaceId, search);
      res.json({ success: true, data: recipients });
    } catch (error: any) {
      next(error);
    }
  }

  // Stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.user!.workspaceId;
      const stats = await emailService.getEmailStats(workspaceId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      next(error);
    }
  }

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, subject, body, isBulk, templateId, attachments } =
        req.body; 
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;

      if (!recipients || recipients.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No recipients provided" });
      }

      if (!subject) {
        return res
          .status(400)
          .json({ success: false, error: "Subject is required" });
      }

      if (!body) {
        return res
          .status(400)
          .json({ success: false, error: "Email body is required" });
      }

      const result = await emailService.sendEmail({
        recipients,
        subject,
        body,
        isBulk,
        templateId,
        workspaceId,
        userId,
        attachments, // ✅ ADD THIS
      });

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

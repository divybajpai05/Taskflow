"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const email_service_1 = require("./email.service");
const emailService = new email_service_1.EmailService();
class EmailController {
    // Templates
    async getTemplates(req, res, next) {
        try {
            const { category } = req.query;
            const templates = await emailService.getTemplates(undefined, category);
            res.json({ success: true, data: templates });
        }
        catch (error) {
            next(error);
        }
    }
    async getTemplateById(req, res, next) {
        try {
            const id = req.params.id;
            const template = await emailService.getTemplateById(id);
            res.json({ success: true, data: template });
        }
        catch (error) {
            next(error);
        }
    }
    async createTemplate(req, res, next) {
        try {
            const input = req.body;
            const createdById = req.user.id;
            const template = await emailService.createTemplate(input, createdById);
            res.status(201).json({ success: true, data: template });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTemplate(req, res, next) {
        try {
            const id = req.params.id;
            const input = req.body;
            const template = await emailService.updateTemplate(id, input);
            res.json({ success: true, data: template });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTemplate(req, res, next) {
        try {
            const id = req.params.id;
            const result = await emailService.deleteTemplate(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            next(error);
        }
    }
    // Recipients
    async getRecipients(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const search = req.query.search;
            const recipients = await emailService.getRecipients(workspaceId, search);
            res.json({ success: true, data: recipients });
        }
        catch (error) {
            next(error);
        }
    }
    // Stats
    async getStats(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const stats = await emailService.getEmailStats(workspaceId);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async sendEmail(req, res, next) {
        try {
            const { recipients, subject, body, isBulk, templateId, attachments } = req.body;
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmailController = EmailController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
// src/modules/email/email.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const email_service_1 = require("../auth/email.service");
const brevoService = new email_service_1.EmailService();
class EmailService {
    // ==================== TEMPLATES ====================
    async getTemplates(workspaceId, category) {
        return drizzle_1.db
            .select()
            .from(schema_1.emailTemplates)
            .where(category && category !== "all"
            ? (0, drizzle_orm_1.eq)(schema_1.emailTemplates.category, category)
            : undefined)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.emailTemplates.createdAt));
    }
    async getTemplateById(templateId) {
        const [template] = await drizzle_1.db
            .select()
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, templateId))
            .limit(1);
        if (!template)
            throw new Error("Template not found");
        return template;
    }
    async createTemplate(input, createdById) {
        const { name, subject, body, category } = input;
        const templateId = (0, uuid_1.v4)();
        await drizzle_1.db.insert(schema_1.emailTemplates).values({
            id: templateId,
            name,
            subject,
            body,
            category: category || "General",
            isSystem: false,
            createdById,
        });
        return this.getTemplateById(templateId);
    }
    async updateTemplate(templateId, input) {
        const [template] = await drizzle_1.db
            .select()
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, templateId))
            .limit(1);
        if (!template)
            throw new Error("Template not found");
        if (template.isSystem)
            throw new Error("Cannot edit system templates");
        const updateData = {};
        if (input.name)
            updateData.name = input.name;
        if (input.subject)
            updateData.subject = input.subject;
        if (input.body)
            updateData.body = input.body;
        if (input.category)
            updateData.category = input.category;
        await drizzle_1.db
            .update(schema_1.emailTemplates)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, templateId));
        return this.getTemplateById(templateId);
    }
    async deleteTemplate(templateId) {
        const [template] = await drizzle_1.db
            .select()
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, templateId))
            .limit(1);
        if (!template)
            throw new Error("Template not found");
        if (template.isSystem)
            throw new Error("Cannot delete system templates");
        await drizzle_1.db.delete(schema_1.emailTemplates).where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, templateId));
        return { success: true, message: "Template deleted" };
    }
    // ==================== RECIPIENTS ====================
    async getRecipients(workspaceId, search) {
        // FIXED: Get team from workspace_members + teams join instead of users.team
        return drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            team: schema_1.teams.name, // FIXED: Get team name from teams table via workspace_members
        })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where(search
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true))
            : (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true)));
    }
    // ==================== EMAIL STATS ====================
    async getEmailStats(workspaceId) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [totalSent] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId));
        const [thisMonthSent] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.emailLogs.sentAt, firstDayOfMonth)));
        const [delivered] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.emailLogs.status, "delivered")));
        const [bounced] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.emailLogs.status, "bounced")));
        const [scheduled] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.emailLogs.status, "scheduled")));
        const [thisMonthDelivered] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.emailLogs.status, "delivered"), (0, drizzle_orm_1.gte)(schema_1.emailLogs.sentAt, firstDayOfMonth)));
        const [thisMonthBounced] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.emailLogs.status, "bounced"), (0, drizzle_orm_1.gte)(schema_1.emailLogs.sentAt, firstDayOfMonth)));
        const [thisMonthScheduled] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.emailLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.emailLogs.status, "scheduled"), (0, drizzle_orm_1.gte)(schema_1.emailLogs.sentAt, firstDayOfMonth)));
        return {
            totalSent: totalSent?.count || 0,
            scheduled: scheduled?.count || 0,
            delivered: delivered?.count || 0,
            bounced: bounced?.count || 0,
            thisMonth: {
                totalSent: thisMonthSent?.count || 0,
                scheduled: thisMonthScheduled?.count || 0,
                delivered: thisMonthDelivered?.count || 0,
                bounced: thisMonthBounced?.count || 0,
            },
        };
    }
    // ==================== SEND EMAIL ====================
    async sendEmail(data) {
        const { recipients, subject, body, attachments, workspaceId, userId } = data;
        if (!recipients || recipients.length === 0) {
            throw new Error("No recipients provided");
        }
        try {
            for (const recipientEmail of recipients) {
                // FIXED: Get recipient details with team from workspace_members
                const [recipient] = await drizzle_1.db
                    .select({
                    id: schema_1.users.id,
                    name: schema_1.users.name,
                    email: schema_1.users.email,
                    team: schema_1.teams.name, // FIXED: Get team from teams table via workspace_members
                })
                    .from(schema_1.users)
                    .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
                    .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
                    .where((0, drizzle_orm_1.eq)(schema_1.users.email, recipientEmail))
                    .limit(1);
                // Replace variables in subject and body
                let personalizedSubject = subject;
                let personalizedBody = body;
                if (recipient) {
                    const variables = {
                        "{{employee_name}}": recipient.name || recipientEmail.split("@")[0],
                        "{{email}}": recipient.email,
                        "{{team}}": recipient.team || "N/A",
                        "{{department}}": recipient.team || "N/A",
                        "{{start_date}}": new Date().toLocaleDateString(),
                        "{{end_date}}": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                        "{{meeting_time}}": new Date().toLocaleTimeString(),
                        "{{manager_name}}": "Manager",
                    };
                    Object.entries(variables).forEach(([key, value]) => {
                        const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
                        personalizedSubject = personalizedSubject.replace(regex, value);
                        personalizedBody = personalizedBody.replace(regex, value);
                    });
                }
                // Send via Brevo
                await brevoService.sendCustomEmail(recipientEmail, personalizedSubject, personalizedBody, recipient?.name, attachments);
                // Log email to database
                await drizzle_1.db.insert(schema_1.emailLogs).values({
                    workspaceId: workspaceId,
                    senderId: userId,
                    recipientEmail: recipientEmail,
                    subject: personalizedSubject,
                    status: "sent",
                });
            }
            console.log(`✅ Email sent to ${recipients.length} recipient(s)`);
            return {
                success: true,
                message: `Email sent to ${recipients.length} recipient(s)`,
                sentCount: recipients.length,
            };
        }
        catch (error) {
            console.error("Failed to send email:", error);
            throw new Error("Failed to send email: " + error.message);
        }
    }
}
exports.EmailService = EmailService;

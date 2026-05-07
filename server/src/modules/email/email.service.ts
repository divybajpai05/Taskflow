// src/modules/email/email.service.ts
import { db } from "../../db/drizzle";
import {
  emailTemplates,
  users,
  workspaceMembers,
  emailLogs,
  teams,
} from "../../db/schema";
import { eq, and, desc, count, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { EmailService as BrevoEmailService } from "../auth/email.service";

export interface CreateTemplateInput {
  name: string;
  subject: string;
  body: string;
  category?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  body?: string;
  category?: string;
}

const brevoService = new BrevoEmailService();

export class EmailService {
  // ==================== TEMPLATES ====================

  async getTemplates(workspaceId?: string, category?: string) {
    return db
      .select()
      .from(emailTemplates)
      .where(
        category && category !== "all"
          ? eq(emailTemplates.category, category)
          : undefined,
      )
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getTemplateById(templateId: string) {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!template) throw new Error("Template not found");
    return template;
  }

  async createTemplate(input: CreateTemplateInput, createdById: string) {
    const { name, subject, body, category } = input;
    const templateId = uuidv4();

    await db.insert(emailTemplates).values({
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

  async updateTemplate(templateId: string, input: UpdateTemplateInput) {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!template) throw new Error("Template not found");
    if (template.isSystem) throw new Error("Cannot edit system templates");

    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.subject) updateData.subject = input.subject;
    if (input.body) updateData.body = input.body;
    if (input.category) updateData.category = input.category;

    await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, templateId));
    return this.getTemplateById(templateId);
  }

  async deleteTemplate(templateId: string) {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!template) throw new Error("Template not found");
    if (template.isSystem) throw new Error("Cannot delete system templates");

    await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));
    return { success: true, message: "Template deleted" };
  }

  // ==================== RECIPIENTS ====================

  async getRecipients(workspaceId: string, search?: string) {
    // FIXED: Get team from workspace_members + teams join instead of users.team
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        team: teams.name, // FIXED: Get team name from teams table via workspace_members
      })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        search
          ? and(
              eq(workspaceMembers.workspaceId, workspaceId),
              eq(users.isActive, true),
            )
          : and(
              eq(workspaceMembers.workspaceId, workspaceId),
              eq(users.isActive, true),
            ),
      );
  }

  // ==================== EMAIL STATS ====================

  async getEmailStats(workspaceId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSent] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(eq(emailLogs.workspaceId, workspaceId));

    const [thisMonthSent] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          gte(emailLogs.sentAt, firstDayOfMonth),
        ),
      );

    const [delivered] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          eq(emailLogs.status, "delivered"),
        ),
      );

    const [bounced] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          eq(emailLogs.status, "bounced"),
        ),
      );

    const [scheduled] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          eq(emailLogs.status, "scheduled"),
        ),
      );

    const [thisMonthDelivered] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          eq(emailLogs.status, "delivered"),
          gte(emailLogs.sentAt, firstDayOfMonth),
        ),
      );

    const [thisMonthBounced] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          eq(emailLogs.status, "bounced"),
          gte(emailLogs.sentAt, firstDayOfMonth),
        ),
      );

    const [thisMonthScheduled] = await db
      .select({ count: count() })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.workspaceId, workspaceId),
          eq(emailLogs.status, "scheduled"),
          gte(emailLogs.sentAt, firstDayOfMonth),
        ),
      );

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

  async sendEmail(data: {
    recipients: string[];
    subject: string;
    body: string;
    isBulk?: boolean;
    templateId?: string;
    workspaceId: string;
    userId: string;
    attachments?: { name: string; content: string }[];
  }) {
    const { recipients, subject, body, attachments, workspaceId, userId } =
      data;

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    try {
      for (const recipientEmail of recipients) {
        // FIXED: Get recipient details with team from workspace_members
        const [recipient] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            team: teams.name, // FIXED: Get team from teams table via workspace_members
          })
          .from(users)
          .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
          .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
          .where(eq(users.email, recipientEmail))
          .limit(1);

        // Replace variables in subject and body
        let personalizedSubject = subject;
        let personalizedBody = body;

        if (recipient) {
          const variables: Record<string, string> = {
            "{{employee_name}}": recipient.name || recipientEmail.split("@")[0],
            "{{email}}": recipient.email,
            "{{team}}": recipient.team || "N/A",
            "{{department}}": recipient.team || "N/A",
            "{{start_date}}": new Date().toLocaleDateString(),
            "{{end_date}}": new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toLocaleDateString(),
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
        await brevoService.sendCustomEmail(
          recipientEmail,
          personalizedSubject,
          personalizedBody,
          recipient?.name,
          attachments,
        );

        // Log email to database
        await db.insert(emailLogs).values({
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
    } catch (error: any) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email: " + error.message);
    }
  }
}

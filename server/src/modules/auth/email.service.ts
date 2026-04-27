import axios from "axios";
import { config } from "../../config";

export class EmailService {
  private apiKey: string;
  private sender: { email: string; name: string };
  private apiUrl = "https://api.brevo.com/v3/smtp/email";

  constructor() {
    this.apiKey = config.brevo.apiKey;
    this.sender = {
      email: config.brevo.senderEmail,
      name: config.brevo.senderName,
    };

    console.log("🔑 Brevo API Key:", this.apiKey.substring(0, 15) + "...");
    console.log("📧 Sender:", this.sender);
  }

  private async sendEmail(data: any): Promise<void> {
    try {
      const response = await axios.post(this.apiUrl, data, {
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });
      console.log("✅ Email sent successfully:", response.data);
    } catch (error: any) {
      console.error("❌ Email error details:");
      console.error("  Status:", error.response?.status);
      console.error("  Data:", error.response?.data);
      console.error("  Headers:", error.response?.headers);
      console.error("Email error:", error.response?.data || error.message);
      throw new Error("Failed to send email");
    }
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationLink = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    const emailData = {
      sender: this.sender,
      to: [{ email, name }],
      subject: "Verify your email - Taskflow",
      htmlContent: `
        <h1>Welcome, ${name}!</h1>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await this.sendEmail(emailData);
    console.log(`✅ Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    const emailData = {
      sender: this.sender,
      to: [{ email, name }],
      subject: "Reset your password - Taskflow",
      htmlContent: `
        <h1>Reset Your Password</h1>
        <p>Hi ${name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await this.sendEmail(emailData);
    console.log(`✅ Password reset email sent to ${email}`);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const loginLink = `${config.frontendUrl}/login`;

    const emailData = {
      sender: this.sender,
      to: [{ email, name }],
      subject: "Welcome to Taskflow! 🎉",
      htmlContent: `
        <h1>Welcome to Taskflow, ${name}!</h1>
        <p>Your email has been verified successfully.</p>
        <a href="${loginLink}">Go to Dashboard</a>
      `,
    };

    await this.sendEmail(emailData);
    console.log(`✅ Welcome email sent to ${email}`);
  }

  /**
   * Send onboarding email when admin creates a new user
   */
  async sendOnboardingEmail(
    email: string,
    name: string,
    tempPassword: string,
    workspaceName: string,
  ): Promise<void> {
    const loginLink = `${config.frontendUrl}/login`;

    const emailData = {
      sender: this.sender,
      to: [{ email, name }],
      subject: `🎉 Welcome to Taskflow - You've been onboarded to ${workspaceName}!`,
      htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f9fafb;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            text-align: center; 
            padding: 30px 20px; 
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 12px 12px 0 0;
          }
          .header h1 { 
            color: #ffffff; 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
          }
          .header p {
            color: #e0e7ff;
            margin: 8px 0 0 0;
            font-size: 16px;
          }
          .content { 
            background: #ffffff; 
            padding: 30px; 
            border-radius: 0 0 12px 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .welcome-text {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .credentials-box {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials-box h3 {
            color: #166534;
            margin: 0 0 12px 0;
            font-size: 16px;
          }
          .credential-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dashed #bbf7d0;
          }
          .credential-item:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-weight: 600;
            color: #15803d;
            font-size: 14px;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #166534;
            background: #ffffff;
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid #86efac;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .steps {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .steps h3 {
            color: #1e293b;
            margin: 0 0 12px 0;
            font-size: 16px;
          }
          .step-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 10px;
          }
          .step-number {
            background: #6366f1;
            color: #ffffff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .step-text {
            font-size: 14px;
            color: #475569;
          }
          .warning-box {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-box p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          }
          .footer p {
            font-size: 12px;
            color: #6b7280;
            margin: 4px 0;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to Taskflow!</h1>
            <p>You've been onboarded to ${workspaceName}</p>
          </div>
          
          <div class="content">
            <p class="welcome-text">
              Hi <strong>${name}</strong>,
            </p>
            <p>
              Great news! You've been added to the <strong>${workspaceName}</strong> workspace on Taskflow. 
              Your account has been created and you can start collaborating with your team right away.
            </p>

            <div class="credentials-box">
              <h3>🔐 Your Account Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Email</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Temporary Password</span>
                <span class="credential-value">${tempPassword}</span>
              </div>
            </div>

            <div class="warning-box">
              <p>⏰ <strong>Security Notice:</strong> This is a temporary password. Please change it immediately after your first login to keep your account secure.</p>
            </div>

            <div style="text-align: center;">
              <a href="${loginLink}" class="cta-button">
                Sign In to Taskflow
              </a>
            </div>

            <div class="steps">
              <h3>📋 Getting Started</h3>
              <div class="step-item">
                <div class="step-number">1</div>
                <div class="step-text">Click the <strong>"Sign In to Taskflow"</strong> button above</div>
              </div>
              <div class="step-item">
                <div class="step-number">2</div>
                <div class="step-text">Enter your email and temporary password</div>
              </div>
              <div class="step-item">
                <div class="step-number">3</div>
                <div class="step-text">Go to <strong>Settings</strong> and change your password</div>
              </div>
              <div class="step-item">
                <div class="step-number">4</div>
                <div class="step-text">Explore your workspace and start collaborating!</div>
              </div>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions or need assistance, please contact your workspace administrator or reach out to our support team.
            </p>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Taskflow. All rights reserved.</p>
              <p>This email was sent because an administrator created an account for you on Taskflow.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    await this.sendEmail(emailData);
  }

  /**
   * Send a custom email (for Email Center and other uses)
   */
  async sendCustomEmail(
    to: string,
    subject: string,
    htmlContent: string,
    recipientName?: string,
    attachments?: { name: string; content: string }[],
  ): Promise<void> {
    const emailData: any = {
      sender: this.sender,
      to: [{ email: to, name: recipientName || to.split("@")[0] }],
      subject: subject,
      htmlContent: htmlContent,
    };

    if (attachments && attachments.length > 0) {
      emailData.attachment = attachments.map((att) => ({
        name: att.name,
        content: att.content,
      }));

      // ✅ Debug: Check what we're sending
      console.log("📎 Attachment count:", attachments.length);
      console.log("📎 First attachment name:", attachments[0].name);
      console.log(
        "📎 First attachment content (first 50 chars):",
        attachments[0].content.substring(0, 50),
      );
    }

    // ✅ Debug: Log the full request being sent to Brevo
    console.log("📧 Sending to Brevo - Subject:", subject);
    console.log("📧 Has attachments:", !!emailData.attachment);

    await this.sendEmail(emailData);
  }
}

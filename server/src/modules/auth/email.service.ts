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
}

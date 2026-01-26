import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    void this.initialize();
  }

  private async initialize() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
    const emailFrom = process.env.EMAIL_FROM;

    // Check if email is configured
    if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
      console.warn("[EMAIL] Email service not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in .env");
      console.warn(`[EMAIL] Present -> host:${!!emailHost} port:${!!emailPort} user:${!!emailUser} pass:${emailPass ? "yes" : "no"} from:${!!emailFrom}`);
      console.warn("[EMAIL] Emails will be logged to console instead of being sent.");
      this.isConfigured = false;
      return;
    }

    try {
      const config: EmailConfig = {
        host: emailHost,
        port: parseInt(emailPort),
        secure: emailPort === "465", // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      await this.transporter.verify();
      this.isConfigured = true;
      console.log("[EMAIL] Email service configured successfully");
    } catch (error) {
      console.error("[EMAIL] Failed to configure email service:", error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const emailFrom = process.env.EMAIL_FROM || "noreply@hiringpredictor.com";

    // If not configured, log email to console
    if (!this.isConfigured || !this.transporter) {
      console.log("\n═══════════════════════════════════════════════════════════");
      console.log("📧 EMAIL (Not Sent - Development Mode)");
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`From: ${emailFrom}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("───────────────────────────────────────────────────────────");
      console.log(options.text || "See HTML content below:");
      console.log("───────────────────────────────────────────────────────────");
      console.log(options.html);
      console.log("═══════════════════════════════════════════════════════════\n");
      return false;
    }

    try {
      const mailOptions = {
        from: `"Hiring Predictor" <${emailFrom}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("[EMAIL] Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("[EMAIL] Failed to send email:", error);
      // Fallback to console logging
      console.log("\n═══════════════════════════════════════════════════════════");
      console.log("📧 EMAIL (Failed to Send - Logging Instead)");
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`From: ${emailFrom}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("───────────────────────────────────────────────────────────");
      console.log(options.text || "See HTML content below:");
      console.log("───────────────────────────────────────────────────────────");
      console.log(options.html);
      console.log("═══════════════════════════════════════════════════════════\n");
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<boolean> {
    const subject = "Reset Your Password - Hiring Predictor";
    const displayName = userName || email.split("@")[0];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <div style="width: 40px; height: 40px; background-color: rgba(255,255,255,0.2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z"/>
                    <circle cx="12" cy="15" r="1"/>
                  </svg>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Hiring Predictor</h1>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a1a1a;">Reset Your Password</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                Hi ${displayName},
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #4a4a4a;">
                We received a request to reset your password for your Hiring Predictor account. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="margin: 32px 0;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 16px; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                Or copy and paste this link into your browser:
              </p>
              <div style="padding: 12px 16px; background-color: #f5f5f5; border-radius: 6px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 14px; color: #0099ff;">
                ${resetLink}
              </div>
              
              <div style="margin-top: 32px; padding: 16px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #856404;">
                  <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour and can only be used once.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.5; color: #6b6b6b;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b6b6b; text-align: center;">
                This is an automated message from Hiring Predictor
              </p>
              <p style="margin: 0; font-size: 12px; color: #9b9b9b; text-align: center;">
                © ${new Date().getFullYear()} Hiring Predictor. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Note -->
        <table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9b9b9b;">
                Need help? Contact us at <a href="mailto:support@hiringpredictor.com" style="color: #0099ff; text-decoration: none;">support@hiringpredictor.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Hi ${displayName},

We received a request to reset your password for your Hiring Predictor account.

To reset your password, click the link below:
${resetLink}

This link will expire in 1 hour and can only be used once.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Hiring Predictor Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log("[EMAIL] Cannot test connection - email service not configured");
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("[EMAIL] Email service connection verified successfully");
      return true;
    } catch (error) {
      console.error("[EMAIL] Email service connection failed:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const emailService = new EmailService();

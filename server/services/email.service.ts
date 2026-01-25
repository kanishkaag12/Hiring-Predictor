import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@hirepulse.com";

if (!SENDGRID_API_KEY) {
  console.warn("[EMAIL SERVICE] SENDGRID_API_KEY not configured. Email sending will be disabled.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class EmailService {
  /**
   * Send a basic email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!SENDGRID_API_KEY) {
      console.warn("[EMAIL SERVICE] Skipping email send - API key not configured");
      return;
    }

    try {
      const message = {
        to: options.to,
        from: FROM_EMAIL,
        subject: options.subject,
        html: options.htmlContent,
        text: options.textContent || "Please use an HTML-compatible email client to view this message.",
      };

      await sgMail.send(message);
      console.log(`[EMAIL SERVICE] Email sent to ${options.to} - ${options.subject}`);
    } catch (error) {
      console.error("[EMAIL SERVICE] Failed to send email:", error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    userName?: string
  ): Promise<void> {
    const name = userName || email.split("@")[0];
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We received a request to reset the password for your Hiring Predictor account. If you didn't make this request, you can safely ignore this email.</p>
              
              <p>To reset your password, click the button below. This link will expire in <strong>1 hour</strong>.</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Your Password</a>
              </center>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this link with anyone. If you didn't request a password reset, your account may be at risk. Please contact our support team immediately.
              </div>
              
              <p>Need help? If you're having trouble resetting your password, please contact our support team.</p>
              
              <p>Best regards,<br>The Hiring Predictor Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hiring Predictor. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Password Reset Request

Hi ${name},

We received a request to reset the password for your Hiring Predictor account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link (expires in 1 hour):
${resetLink}

Security Notice: Never share this link with anyone. If you didn't request a password reset, your account may be at risk.

Best regards,
The Hiring Predictor Team
    `;

    await this.sendEmail({
      to: email,
      subject: "Reset Your Password - Hiring Predictor",
      htmlContent,
      textContent,
    });
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(email: string, userName?: string): Promise<void> {
    const name = userName || email.split("@")[0];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Hiring Predictor! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Welcome to Hiring Predictor! We're excited to have you on board.</p>
              
              <p>With Hiring Predictor, you can:</p>
              <ul>
                <li>Predict your career path with AI precision</li>
                <li>Get personalized job recommendations</li>
                <li>Analyze role requirements and skill gaps</li>
                <li>Make data-driven career decisions</li>
              </ul>
              
              <center>
                <a href="https://hirepulse.com/dashboard" class="button">Get Started</a>
              </center>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Happy exploring!<br>The Hiring Predictor Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Hiring Predictor. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Welcome to Hiring Predictor!

Hi ${name},

Welcome to Hiring Predictor! We're excited to have you on board.

Get started here: https://hirepulse.com/dashboard

Best regards,
The Hiring Predictor Team
    `;

    await this.sendEmail({
      to: email,
      subject: "Welcome to Hiring Predictor",
      htmlContent,
      textContent,
    });
  }
}

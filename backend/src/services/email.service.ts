import nodemailer from 'nodemailer';

export class EmailService {
  /**
   * Helper to construct the Nodemailer SMTP transporter.
   */
  private static getTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Default to Gmail settings, but allow override via host/port
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = port === 465; // true for 465, false for 587

    if (!user || !pass || user === 'your_gmail_user_here' || pass === 'your_gmail_app_password_here') {
      console.warn('[EmailService] SMTP credentials are not configured. Emails will be logged to console instead.');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000
    });
  }

  /**
   * Sends an internal notification email to the administrator when a new lead is captured.
   * 
   * @param lead - The lead object containing details and calculated score
   */
  static async sendNewLeadNotification(lead: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    source: string | null;
    score: number;
    status: string;
  }): Promise<boolean> {
    const transporter = this.getTransporter();
    const adminEmail = process.env.SMTP_USER || 'admin@leadgen.com';

    const subject = `🚀 New Lead Captured: ${lead.name || 'Anonymous'} (Score: ${lead.score}/100)`;
    const text = `
New lead details:
------------------------------------------
ID: ${lead.id}
Name: ${lead.name || 'N/A'}
Email: ${lead.email}
Phone: ${lead.phone || 'N/A'}
Company: ${lead.company || 'N/A'}
Source: ${lead.source || 'N/A'}
Score: ${lead.score}/100
Status: ${lead.status}
------------------------------------------
Manage your leads in the lead generation dashboard.
`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">🚀 New Lead Captured!</h2>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">Quality Score: <strong>${lead.score}/100</strong></p>
        </div>
        <div style="padding: 24px; color: #1f2937; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Name</td>
              <td style="padding: 8px 0; text-align: right;">${lead.name || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email</td>
              <td style="padding: 8px 0; text-align: right;"><a href="mailto:${lead.email}" style="color: #4f46e5; text-decoration: none;">${lead.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Phone</td>
              <td style="padding: 8px 0; text-align: right;">${lead.phone || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Company</td>
              <td style="padding: 8px 0; text-align: right;">${lead.company || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Source</td>
              <td style="padding: 8px 0; text-align: right;">${lead.source || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Status</td>
              <td style="padding: 8px 0; text-align: right;"><span style="background-color: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold;">${lead.status}</span></td>
            </tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="http://localhost:3000/leads" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">View in Dashboard</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          Lead Generation Platform Monorepo • Local Development Mode
        </div>
      </div>
    `;

    if (!transporter) {
      console.log('=============== MOCK EMAIL SENT ===============');
      console.log(`To:      ${adminEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text}`);
      console.log('================================================');
      return true;
    }

    try {
      const info = await transporter.sendMail({
        from: `"LeadGen Platform" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject,
        text,
        html
      });
      console.log(`[EmailService] Lead notification email sent. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error('[EmailService] Failed to send email notification:', error.message || error);
      return false;
    }
  }
}

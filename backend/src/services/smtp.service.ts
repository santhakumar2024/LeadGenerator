import nodemailer from 'nodemailer';

export const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    authMethod: 'PLAIN',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    debug: true,
    logger: true
  });
};

export const sendEmail = async (to: string, subject: string, text: string, html?: string, replayToMsgId?: string, icalEvent?: any) => {
  const transporter = getTransporter();

  const mailOptions: import('nodemailer/lib/mailer').Options = {
    from: `"QuentroNova Sales" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    icalEvent
  };

  if (replayToMsgId) {
    mailOptions.inReplyTo = replayToMsgId;
    mailOptions.references = [replayToMsgId];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
};

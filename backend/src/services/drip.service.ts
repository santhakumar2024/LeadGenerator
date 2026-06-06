import cron from 'node-cron';
import { prisma } from '../prisma';
import { sendEmail, getTransporter } from './smtp.service';

const parseTemplate = (template: string, lead: any) => {
  const placeholders: any = {
    first_name: lead.first_name || 'there',
    last_name: lead.last_name || '',
    company_name: lead.company_name || 'your company',
    job_title: lead.job_title || 'professional',
    company_type: lead.company_type || 'industry'
  };

  return template.replace(/{{(\w+)}}/g, (match, key) => {
    return placeholders[key] !== undefined ? placeholders[key] : match;
  });
};

export const initDripCampaignCron = () => {
  // Run every 24 hours at 9:00 AM (server time)
  cron.schedule('0 9 * * *', async () => {
    console.log('Running drip campaign job...');
    try {
      // Find leads that are CONTACTED
      const activeLeads = await prisma.lead.findMany({
        where: {
          status: 'CONTACTED',
          last_contacted_at: {
            // Find leads contacted more than 3 days ago
            lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        }
      });

      console.log(`Found ${activeLeads.length} leads due for follow-up.`);

      const campaigns = await prisma.campaign.findMany({
        orderBy: { step_number: 'asc' }
      });

      if (campaigns.length === 0) {
        console.log('No campaigns configured.');
        return;
      }

      for (const lead of activeLeads) {
        const nextStep = lead.step_count + 1;
        const template = campaigns.find((c: any) => c.step_number === nextStep);

        if (template) {
          const personalizedSubject = parseTemplate(template.subject, lead);
          const personalizedBody = parseTemplate(template.body, lead);

          // Send next email with threading logic
          await sendEmail(
            lead.email, 
            personalizedSubject, 
            personalizedBody, 
            lead.initial_message_id || undefined,
            lead.initial_message_id || undefined // Simple reference to initial email
          );

          // Update lead status
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              step_count: nextStep,
              last_contacted_at: new Date()
            }
          });
          console.log(`Sent step ${nextStep} to ${lead.email}`);
        } else {
          console.log(`Finished drip for Lead ${lead.email}`);
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'COMPLETED' }
          });
        }
      }

      // --- PHASE 2: The Referral Loop ---
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // We look for leads that completed the client lifecycle 7 days ago
      const referralCandidates = await prisma.lead.findMany({
        where: {
          status: 'CLIENT_COMPLETED',
          updatedAt: { lte: sevenDaysAgo }
        }
      });

      for (const client of referralCandidates) {
        // Ensure transporter is instantiated for this job
        const transporter = getTransporter();

        const mailOptions = {
          from: '"QuentroNova Admin" <admin@quentronova.com>',
          to: client.email,
          subject: 'A small thank you from QuentroNova',
          text: `Hi ${client.first_name || 'there'},\n\nIt’s been a week since we wrapped up your project. I hope the new systems are performing exactly as you'd hoped!\n\nOur business grows through working with great people like you. If you know another founder or manager who needs software consulting, please share this link: quentronova.com/refer/${client.referral_code}.\n\nAs a thank you, if they book a consultation, we’ll apply a 10% discount to your next project or maintenance month.\n\nBest,\nAdmin @ QuentroNova`,
        };

        try {
          await transporter.sendMail(mailOptions);
          // Mark them COMPLETED so we don't send the referral email again tomorrow
          await prisma.lead.update({
            where: { id: client.id },
            data: { status: 'COMPLETED', updatedAt: new Date() } // Forces real update
          });
          console.log(`🌟 Referral Loop activated for ${client.email}`);
        } catch (error) {
          console.error(`Failed to send referral email to ${client.email}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in drip campaign cron:', error);
    }
  });
  console.log('Drip campaign cron initialized.');
};

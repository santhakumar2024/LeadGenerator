import cron from 'node-cron';
import { prisma } from '../prisma';
import { sendEmail, getTransporter } from './smtp.service';
import { LeadStatus } from '@prisma/client';

const parseTemplate = (template: string, lead: any) => {
  const answers = (lead.answers as Record<string, any>) || {};
  const placeholders: any = {
    first_name: lead.name || 'there',
    last_name: '',
    company_name: lead.company || 'your company',
    job_title: answers.jobTitle || 'professional',
    company_type: answers.companyType || 'industry'
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
      // Find leads that are in NURTURE status (mapping of old CONTACTED status)
      // and whose last update was more than 3 days ago.
      const activeLeads = await prisma.lead.findMany({
        where: {
          status: LeadStatus.NURTURE,
          updatedAt: {
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
        const answers = (lead.answers as Record<string, any>) || {};
        const currentStep = Number(answers.step_count) || 0;
        const nextStep = currentStep + 1;
        const template = campaigns.find((c: any) => c.step_number === nextStep);

        if (template) {
          const personalizedSubject = parseTemplate(template.subject, lead);
          const personalizedBody = parseTemplate(template.body, lead);

          // Send next email with threading logic
          const initialMsgId = answers.initial_message_id as string | undefined;
          await sendEmail(
            lead.email, 
            personalizedSubject, 
            personalizedBody, 
            undefined, // html
            initialMsgId,
            undefined // icalEvent
          );

          // Update lead step count in JSON answers field to preserve it
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              answers: {
                ...answers,
                step_count: nextStep,
                last_contacted_at: new Date().toISOString()
              }
            }
          });
          console.log(`Sent step ${nextStep} to ${lead.email}`);
        } else {
          console.log(`Finished drip for Lead ${lead.email}`);
          // Move status to lost or keep it in nurture with finished flag
          await prisma.lead.update({
            where: { id: lead.id },
            data: { 
              status: LeadStatus.LOST,
              answers: {
                ...answers,
                drip_finished: true
              }
            }
          });
        }
      }

      // --- PHASE 2: The Referral Loop ---
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Look for leads that are CUSTOMER and last updated 7 days ago
      const referralCandidates = await prisma.lead.findMany({
        where: {
          status: LeadStatus.CUSTOMER,
          updatedAt: { lte: sevenDaysAgo }
        }
      });

      for (const client of referralCandidates) {
        const transporter = getTransporter();
        const answers = (client.answers as Record<string, any>) || {};

        if (answers.referral_sent) continue;

        const mailOptions = {
          from: '"QuentroNova Admin" <admin@quentronova.com>',
          to: client.email,
          subject: 'A small thank you from QuentroNova',
          text: `Hi ${client.name || 'there'},\n\nIt’s been a week since we wrapped up your project. I hope the new systems are performing exactly as you'd hoped!\n\nOur business grows through working with great people like you. If you know another founder or manager who needs software consulting, please share this link: quentronova.com/refer/${client.id}.\n\nAs a thank you, if they book a consultation, we’ll apply a 10% discount to your next project or maintenance month.\n\nBest,\nAdmin @ QuentroNova`,
        };

        try {
          await transporter.sendMail(mailOptions);
          // Mark referral as sent inside answers Json
          await prisma.lead.update({
            where: { id: client.id },
            data: {
              answers: {
                ...answers,
                referral_sent: true
              }
            }
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

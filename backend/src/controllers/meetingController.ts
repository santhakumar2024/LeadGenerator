import { Request, Response } from 'express';
import { prisma } from '../prisma';
import * as ics from 'ics';
import { getTransporter } from '../services/smtp.service';

export const scheduleMeeting = async (req: Request, res: Response) => {
  const transporter = getTransporter();
  try {
    const { leadId, date } = req.body;
    
    if (!leadId || !date) {
      return res.status(400).json({ error: 'leadId and date are required' });
    }

        const meetingDate = new Date(date);
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Save meeting to DB
    const meeting = await prisma.meeting.create({
      data: {
        leadId: lead.id,
        date: meetingDate,
        status: 'SCHEDULED'
      }
    });

    // Move Lead status to MEETING_SCHEDULED (using string LeadStatus)
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'OPPORTUNITY' } // Maps to valid LeadStatus enum stage
    });

    // Create ICS Event
    const event: ics.EventAttributes = {
      start: [
        meetingDate.getFullYear(),
        meetingDate.getMonth() + 1,
        meetingDate.getDate(),
        meetingDate.getHours(),
        meetingDate.getMinutes()
      ],
      duration: { minutes: 30 },
      title: `Consultation: ${lead.name || 'Client'} & QuentroNova`,
      description: 'Discovery call to discuss software automation and growth.',
      location: 'Google Meet / Zoom (Link to follow)',
      status: 'CONFIRMED',
      organizer: { name: 'QuentroNova Admin', email: 'admin@quentronova.com' },
      attendees: [
        { name: lead.name || 'Prospect', email: lead.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
      ]
    };

    ics.createEvent(event, async (error, value) => {
      if (error) {
        console.error('Error creating ICS:', error);
        return res.status(500).json({ error: 'Failed to generate calendar invite' });
      }

      // Send the email with the ICS attachment
      const mailOptions = {
        from: '"QuentroNova Admin" <admin@quentronova.com>',
        to: [lead.email, 'admin@quentronova.com'].join(','),
        subject: `Meeting Scheduled: QuentroNova & ${lead.company || lead.name || 'Prospect'}`,
        text: `Hi ${lead.name || 'there'},\n\nYour meeting is confirmed for ${meetingDate.toLocaleString()}.\nPlease find the calendar invite attached.\n\nBest,\nQuentroNova Team`,
        icalEvent: {
          filename: 'invitation.ics',
          method: 'request',
          content: value
        }
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, meeting });
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

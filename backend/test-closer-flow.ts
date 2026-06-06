/*
import 'dotenv/config'; // Loads .env first securely
import { PrismaClient } from '@prisma/client';
import * as ics from 'ics';
import { sendEmail } from './src/services/smtp.service';

const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 Starting QuentroNova Closer Flow Tests (Production Fix)...\n");

  try {
    // ------------------------------------------------------------------------
    // FIX 3: Cleanup Previous Run Artifacts
    // ------------------------------------------------------------------------
    console.log("--- CLEANING UP OLD TEST RECORDS ---");
    const oldLeads = await prisma.lead.findMany({
      where: { email: { contains: 'test' } }
    });
    
    for (const pLead of oldLeads) {
      await prisma.meeting.deleteMany({ where: { leadId: pLead.id } });
      await prisma.lead.delete({ where: { id: pLead.id } });
    }
    console.log("✅ Cleanup complete.\n");

    // ------------------------------------------------------------------------
    // TEST A: Meeting & ICS Validation via Production sendEmail
    // ------------------------------------------------------------------------
    console.log("--- TEST A: Meeting Scheduler ---");
    
    const dynamicMeetingEmail = `admin+test-${Date.now()}@quentronova.com`;
    const testLead = await prisma.lead.create({
      data: {
        email: dynamicMeetingEmail,
        first_name: 'MeetingTest',
        company_name: 'QuentroNova Test Inc',
        status: 'NEW'
      }
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const meeting = await prisma.meeting.create({
      data: { leadId: testLead.id, date: tomorrow, status: 'SCHEDULED' }
    });
    
    await prisma.lead.update({
      where: { id: testLead.id },
      data: { status: 'MEETING_SCHEDULED' }
    });

    const event: ics.EventAttributes = {
      start: [tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate(), tomorrow.getHours(), tomorrow.getMinutes()],
      duration: { minutes: 30 },
      title: `Consultation: Test Lead & QuentroNova`,
      description: 'Discovery call.',
      location: 'Google Meet',
      status: 'CONFIRMED',
      organizer: { name: 'QuentroNova Admin', email: 'admin@quentronova.com' },
      attendees: [{ name: 'Prospect', email: testLead.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }]
    };

    ics.createEvent(event, async (error, value) => {
      if (!error && value) {
        try {
          // Using production sendEmail mapping directly 
          const icalEventObj = { filename: 'invitation.ics', method: 'request', content: value };
          const res = await sendEmail(testLead.email, 'Meeting Scheduled', 'Hi Test, your meeting is confirmed.', undefined, undefined, icalEventObj);
          
          if (res.success) {
             console.log("✅ Email sent successfully (Meeting)");
          } else {
             console.log(`❌ STEP FAILED: Central SMTP failed. Code: ${(res.error as any)?.code}, Command: ${(res.error as any)?.command}`);
          }
        } catch (err: any) {
          console.log(`❌ CRITICAL: ${err.message}`);
        }
      }
    });
    
    // ------------------------------------------------------------------------
    // TEST B: Referral Loop "Time Travel"
    // ------------------------------------------------------------------------
    console.log("\n--- TEST B: Referral Engine ---");

    const dynamicReferralEmail = `test-referral-${Date.now()}@example.com`;
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const referralLead = await prisma.lead.create({
      data: { email: dynamicReferralEmail, first_name: 'Referral', status: 'CLIENT_COMPLETED' }
    });
    await prisma.$executeRaw`UPDATE "Lead" SET "updatedAt" = ${eightDaysAgo} WHERE "id" = ${referralLead.id}`;

    const candidates = await prisma.lead.findMany({
      where: { status: 'CLIENT_COMPLETED', updatedAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });

    const client = candidates.find(c => c.id === referralLead.id);
    if (client) {
      try {
        const res = await sendEmail(
           client.email, 
           'A small thank you from QuentroNova', 
           'Our business grows through working with great people...'
        );
        
        if (res.success) {
           console.log("✅ Email sent successfully (Referral)");
        } else {
           console.log(`❌ STEP FAILED: Code: ${(res.error as any)?.code}, Msg: ${(res.error as any)?.response}`);
        }
      } catch (err: any) {
         console.log(`❌ STEP FAILED: ${err.message}`);
      }
    }

    console.log("\n🎉 END-TO-END CLOSER TESTS COMPLETE.");
    
  } catch (error) {
    console.error("Critical Test Failure:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
*/

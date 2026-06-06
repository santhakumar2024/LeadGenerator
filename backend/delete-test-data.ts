/*
import { prisma } from './src/prisma';

async function deleteTestData() {
  console.log('Cleaning up test data from the database...');
  
  try {
    // Note: Due to foreign key constraints, we delete from tables in the correct order.
    // Meetings are dependent on Leads.
    const deletedMeetings = await prisma.meeting.deleteMany({});
    console.log(`- Deleted ${deletedMeetings.count} meetings.`);
    
    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`- Deleted ${deletedLeads.count} leads.`);
    
    console.log('Database cleanup successful!');
  } catch (err) {
    console.error('Database cleanup failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestData();
*/

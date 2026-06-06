/*
import { runNow } from './src/services/scheduler.service';
import { prisma } from './src/prisma';

async function testScheduler() {
    console.log('Testing Lead Generation Scheduler (Manual Trigger)...');
    
    try {
        const result = await runNow();
        console.log('Test Result:', {
            success: result.success,
            queriesProcessed: 1,
            addedCount: result.addedCount,
            newLeads: result.newLeads.map(l => l.company_name)
        });
    } catch (err) {
        console.error('Scheduler Test Failed:', err);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

testScheduler();
*/

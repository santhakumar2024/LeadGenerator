/*
import { scrapeGoogleMaps } from './src/services/gmaps-scraper.service';
import { prisma } from './src/prisma';

async function generateRealLeads() {
    const targetQueries = [
        "pet grooming near me",
        "small gyms in Miami",
        "aquariums in Miami",
        "local plumbers Miami"
    ];

    console.log('Starting generation of REAL LEADS for categories: Solar, HVAC, Legal, Remodeling...');
    
    for (const query of targetQueries) {
        console.log(`\n--- Processing Query: "${query}" ---`);
        try {
            const result = await scrapeGoogleMaps(query);
            console.log(`Result for "${query}":`);
            console.log(`- Added: ${result.addedCount} new leads`);
            if (result.newLeads.length > 0) {
                console.log(`- Sample Leads: ${result.newLeads.slice(0, 2).map(l => l.company_name).join(', ')}`);
            }
        } catch (err: any) {
            console.error(`Error processing "${query}":`, err.message);
        }
        // Small delay between categories
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log('\nReal Lead Generation Task Completed!');
    await prisma.$disconnect();
    process.exit(0);
}

generateRealLeads();
*/

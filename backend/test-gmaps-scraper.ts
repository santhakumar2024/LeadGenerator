/*
import { scrapeGoogleMaps } from './src/services/gmaps-scraper.service';
import { prisma } from './src/prisma';

async function testGmapsScraper() {
    const query = process.argv[2] || 'plumbers in small town';
    console.log(`Testing Google Maps Scraper...`);
    console.log(`Searching for "${query}"`);
    
    try {
        const result = await scrapeGoogleMaps(query);
        console.log('Scraper Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testGmapsScraper();
*/

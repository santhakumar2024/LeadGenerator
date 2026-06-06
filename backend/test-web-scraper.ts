/*
import { scrapeWebsite } from './src/services/scraper.service';
import { prisma } from './src/prisma';

async function testWebScraper() {
    const targetUrl = process.argv[2] || 'https://www.w3.org/Consortium/contact';
    console.log(`Testing Website Scraper on: ${targetUrl}`);
    
    try {
        const result = await scrapeWebsite(targetUrl);
        console.log('Result:', result);
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testWebScraper();
*/

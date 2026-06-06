import cron from 'node-cron';
import { TARGET_CATEGORIES } from '../config/targets';
import { scrapeGoogleMaps } from './gmaps-scraper.service';

export const initScheduler = () => {
    console.log('--- Lead Generation Scheduler Initialized ---');
    
    // Schedule a daily run at 9:00 AM
    // Pattern: minute hour dayOfMonth month dayOfWeek
    cron.schedule('0 9 * * *', async () => {
        console.log(`[${new Date().toISOString()}] Starting daily automated lead generation...`);
        
        // Flatten all queries from all categories
        const allQueries = TARGET_CATEGORIES.flatMap(cat => cat.queries);
        
        // We pick one random query each day or rotate through them
        // For now, let's pick 3 random ones to avoid overwhelming the system/bot detection
        const selectedQueries = [];
        for(let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * allQueries.length);
            selectedQueries.push(allQueries[randomIndex]);
        }

        console.log(`Selected queries for today: ${selectedQueries.join(', ')}`);

        for (const query of selectedQueries) {
            try {
                console.log(`Running automated scrape for: "${query}"`);
                const result = await scrapeGoogleMaps(query);
                console.log(`Result for "${query}": Added ${result.addedCount} new leads.`);
                // Wait 1 minute between scrapes to be safe
                await new Promise(r => setTimeout(r, 60000));
            } catch (err: any) {
                console.error(`Error in automated scrape for "${query}":`, err.message);
            }
        }
        
        console.log(`[${new Date().toISOString()}] Daily automated lead generation completed.`);
    });
};

// For testing purposes: Helper to run a scrape now
export const runNow = async (count = 1) => {
    const allQueries = TARGET_CATEGORIES.flatMap(cat => cat.queries);
    const query = allQueries[Math.floor(Math.random() * allQueries.length)];
    console.log(`Manually triggering scrape for: "${query}"`);
    return await scrapeGoogleMaps(query);
};

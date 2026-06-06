import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../prisma';

export const scrapeWebsite = async (url: string) => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract text from body
    const bodyText = $('body').text();
    
    // Find emails using the specified RegEx hook
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = bodyText.match(emailRegex) || [];
    
    // Deduplicate emails found on the page
    const uniqueEmails = [...new Set(foundEmails.map(e => e.toLowerCase()))];
    
    const hostname = new URL(url).hostname.replace('www.', '');
    let addedCount = 0;

    for (const email of uniqueEmails) {
      // Check if it exists in DB
      const existing = await prisma.lead.findUnique({ where: { email } });
      
      if (!existing) {
        await prisma.lead.create({
          data: {
            email,
            company: hostname,
            source: 'web_scraper',
            status: 'NEW'
          }
        });
        addedCount++;
      }
    }
    
    return { success: true, emailsFound: uniqueEmails.length, newLeadsAdded: addedCount };
  } catch (error: any) {
    console.error('Scraper error:', error.message);
    return { success: false, error: error.message };
  }
};

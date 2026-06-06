import puppeteer from 'puppeteer';
import { prisma } from '../prisma';

export const scrapeGoogleMaps = async (searchQuery: string) => {
  let addedCount = 0;
  let emailsFoundCount = 0;
  const newLeads = [];

  const browser = await puppeteer.launch({
    headless: false, // Useful to see it running initially, can be set to "new" or true for production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Go to Google Maps
    await page.goto('https://www.google.com/maps', { waitUntil: 'networkidle2' });
    
    // Type the search query
    const searchSelector = 'input#searchboxinput, input[name="q"], input[aria-label="Search Google Maps"]';
    await page.waitForSelector(searchSelector, { timeout: 15000 });
    
    const inputElement = await page.$(searchSelector);
    if (inputElement) {
        await inputElement.type(searchQuery);
        await page.keyboard.press('Enter');
    } else {
        throw new Error('Search box not found');
    }
    
    // Wait for the results to load
    const feedSelector = 'div[role="feed"], div[aria-label^="Results for"]';
    await page.waitForSelector(feedSelector, { timeout: 15000 }).catch(() => null);
    
    // Quick scroll to load a few results
    for(let i = 0; i < 3; i++) {
        await page.evaluate((sel) => {
            const feed = document.querySelector(sel);
            if(feed) feed.scrollBy(0, 1000);
        }, feedSelector);
        await new Promise(r => setTimeout(r, 1000));
    }
    
    // Get all the listings currently loaded
    const listSelector = 'a.hfpxzc, div[role="feed"] > div > div > a, div[role="article"] a';
    const initialListings = await page.$$(listSelector);
    const totalToProcess = initialListings.length;
    console.log(`Found ${totalToProcess} potential listings for "${searchQuery}"`);
    
    for (let i = 0; i < totalToProcess; i++) {
      try {
        const currentListings = await page.$$(listSelector);
        if (i >= currentListings.length) {
            console.log(`List shrunk or item ${i} not found. Searching again...`);
            await new Promise(r => setTimeout(r, 1000));
            const retryListings = await page.$$(listSelector);
            if (i >= retryListings.length) continue;
        }
        
        const listing = (await page.$$(listSelector))[i];
        await listing.click();
        await new Promise(r => setTimeout(r, 2000)); // wait for details to load
        
        // Extract Business Name
        const titleSelector = 'h1.DUwDvf, div[role="main"] h1, h1';
        let company_name = 'Unknown';
        try {
            await page.waitForSelector(titleSelector, { timeout: 5000 });
            company_name = await page.evaluate((sel) => {
                const h1 = document.querySelector(sel);
                return h1 ? h1.textContent?.trim() : 'Unknown';
            }, titleSelector);
        } catch (e) { console.log('Error extracting name'); }

        // Extract Company Type (Category)
        let company_type = null;
        try {
            const categorySelector = 'button[jsaction="pane.rating.category"]';
            company_type = await page.evaluate(sel => document.querySelector(sel)?.textContent?.trim(), categorySelector);
        } catch (e) { console.log('Error extracting category'); }

        // Extract Phone Number
        const phoneElement = await page.$('button[data-item-id^="phone:tel:"]');
        const phone = phoneElement ? await page.evaluate(el => el.getAttribute('data-item-id')?.replace('phone:tel:', ''), phoneElement) : null;
        
        // Extract Website and Check Security
        let website = null;
        let security_note = null;
        const websiteButton = await page.$('a[data-item-id="authority"]');
        if (websiteButton) {
            website = await page.evaluate(el => el.getAttribute('href'), websiteButton);
            
            if (website) {
                // Security Check
                if (!website.startsWith('https://')) {
                    security_note = `Caution: Website is using insecure HTTP protocol. Link: ${website}`;
                } else {
                    try {
                        const checkPage = await browser.newPage();
                        await checkPage.goto(website, { waitUntil: 'networkidle0', timeout: 8000 });
                        await checkPage.close();
                    } catch (err: any) {
                        security_note = `Potential SSL/Security Issue: ${err.message}. Link: ${website}`;
                    }
                }
            }
        }

        // Try to find emails in the detail pane or on the page
        const allText = await page.evaluate(() => {
            const mainContent = document.querySelector('div[role="main"]');
            return mainContent ? (mainContent as HTMLElement).innerText : document.body.innerText;
        });
        
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = allText.match(emailRegex) || [];
        const validEmails = foundEmails.filter(e => 
            !e.includes('.png') && !e.includes('.jpg') && !e.includes('@2x') && !e.includes('sentry')
        );
        
        const email = validEmails.length > 0 ? validEmails[0].toLowerCase() : `no-email-${Date.now()}@placeholder.com`;

        // Check for duplicate lead by email (which is unique)
        const existing = await prisma.lead.findUnique({
            where: { email }
        });

        if (!existing) {
            const newLead = await prisma.lead.create({
              data: {
                email,
                company: company_name || null,
                phone: phone || null,
                source: 'gmaps_scraper',
                status: 'NEW',
                answers: {
                  company_type,
                  website,
                  security_note,
                  owner: 'Search Pending'
                }
              }
            });
            addedCount++;
            if(validEmails.length > 0) emailsFoundCount++;
            newLeads.push(newLead);
        }
        
      } catch (err: any) {
         console.log('Error processing listing:', err.message);
      }
    }
    
    await browser.close();
    return { success: true, processedCount: totalToProcess, addedCount, emailsFoundCount, newLeads };
    
  } catch (error: any) {
    if(browser) await browser.close();
    console.error('Scraper error:', error.message);
    return { success: false, error: error.message };
  }
};

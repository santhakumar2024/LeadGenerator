import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { scrapeGoogleMaps } from '../services/gmaps-scraper.service';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const startScrape = async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // We run this asynchronously to not block the request
    // In a real app, this should be a background job (Queue)
    scrapeGoogleMaps(query).then(result => {
        console.log('Scrape finished:', result);
    }).catch(err => {
        console.error('Scrape failed:', err);
    });

    res.json({ message: 'Scraping started in background', query });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

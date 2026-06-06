import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { scrapeWebsite } from '../services/scraper.service';
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

export const inboundForm = async (req: Request, res: Response) => {
  try {
    const { email, first_name, job_title, company_name, ai_icebreaker } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const lead = await prisma.lead.upsert({
      where: { email },
      update: { status: 'NEW', first_name, job_title, company_name, ai_icebreaker },
      create: { email, first_name, job_title, company_name, source: 'email_inbound', status: 'NEW', ai_icebreaker }
    });
    
    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const socialWebhook = async (req: Request, res: Response) => {
  try {
    if (req.query['hub.verify_token']) {
      if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
        return res.send(req.query['hub.challenge']);
      }
      return res.status(403).json({ error: 'Invalid verify token' });
    }

    const payload = req.body;
    const leadEmail = payload?.entry?.[0]?.changes?.[0]?.value?.email || payload.email;
    const leadName = payload?.entry?.[0]?.changes?.[0]?.value?.full_name || payload.name;
    
    if (!leadEmail) {
      return res.status(400).json({ error: 'No email found in webhook payload' });
    }

    // Upsert since social leads might click again
    const lead = await prisma.lead.upsert({
      where: { email: leadEmail },
      update: { status: 'NEW' },
      create: {
        email: leadEmail,
        first_name: leadName || 'Social Lead',
        source: 'social_ads',
        status: 'NEW'
      }
    });

    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const triggerGmapsScraper = async (req: Request, res: Response) => {
  try {
    const query = req.body.query || req.body.searchQuery;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Non-blocking
    scrapeGoogleMaps(query).then(result => {
        console.log('GMaps Scrape finished:', result);
    }).catch(err => {
        console.error('GMaps Scrape failed:', err);
    });

    res.json({ message: 'Scraping started in background', query });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

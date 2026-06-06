import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { scrapeGoogleMaps } from '../services/gmaps-scraper.service';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, follow_up_at } = req.body;
    
    // Setup update payload
    let updateData: any = { status };
    if (follow_up_at) updateData.follow_up_at = new Date(follow_up_at);
    if (status === 'CONTACTED' || status === 'FOLLOW_UP_CALL' || status === 'QUALIFIED') {
       updateData.last_contacted_at = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const scrapeGmaps = async (req: Request, res: Response): Promise<any> => {
  try {
    const { searchQuery } = req.body;
    if (!searchQuery) return res.status(400).json({ error: 'Search query required' });
    const result = await scrapeGoogleMaps(searchQuery);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape Google Maps' });
  }
};

export const deleteLeads = async (req: Request, res: Response) => {
  try {
    // Correct order: Meetings first, then Leads
    await prisma.meeting.deleteMany({});
    const deleted = await prisma.lead.deleteMany({});
    res.json({ success: true, count: deleted.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear database' });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { calculateLeadScore } from '../utils/scoring';
import { EnrichmentService } from '../services/enrichment.service';
import { EmailService } from '../services/email.service';
import { LeadStatus } from '@prisma/client';
import { scrapeGoogleMaps } from '../services/gmaps-scraper.service';
import { scrapeWebsite } from '../services/scraper.service';

// Zod schema for validating lead creation request payload
const createLeadSchema = z.object({
  name: z.string().trim().nullable().optional(),
  email: z.string().trim().email('Invalid email address format'),
  phone: z.string().trim().nullable().optional(),
  company: z.string().trim().nullable().optional(),
  source: z.string().trim().nullable().optional(),
  utmParams: z.record(z.string(), z.any()).optional().default({}),
  answers: z.record(z.string(), z.any()).optional().default({}),
  consent: z.boolean().optional().default(false)
});

/**
 * POST /api/leads
 * Creates a new lead, runs initial scoring, saves to database, and triggers background enrichment and notifications.
 */
export const createLead = async (req: Request, res: Response): Promise<any> => {
  try {
    const validationResult = createLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.flatten().fieldErrors
      });
    }

    const { name, email, phone, company, source, utmParams, answers, consent } = validationResult.data;

    const existingLead = await prisma.lead.findUnique({
      where: { email }
    });

    if (existingLead) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A lead with this email address already exists'
      });
    }

    const initialScore = calculateLeadScore(
      email,
      { company: company || undefined, phone: phone || undefined, jobTitle: undefined },
      answers,
      consent
    );

    const lead = await prisma.lead.create({
      data: {
        name: name || null,
        email,
        phone: phone || null,
        company: company || null,
        source: source || 'Inbound Web Form',
        utmParams: utmParams as any || {},
        score: initialScore,
        status: LeadStatus.NEW,
        answers: answers as any || {},
        consent: consent
      }
    });

    console.log(`[LeadController] Created lead ${lead.id} with initial score ${lead.score}/100.`);

    // Trigger Background Enrichment (Async)
    setImmediate(async () => {
      try {
        console.log(`[Background Enrichment] Running for lead ID: ${lead.id}`);
        const enrichedInfo = await EnrichmentService.enrich(lead.email, lead.company || undefined);

        let finalLead = lead;

        if (enrichedInfo) {
          const updatedScore = calculateLeadScore(
            lead.email,
            {
              company: enrichedInfo.company || lead.company || undefined,
              phone: enrichedInfo.phone || lead.phone || undefined,
              jobTitle: enrichedInfo.jobTitle
            },
            lead.answers as Record<string, any>,
            lead.consent
          );

          finalLead = await prisma.lead.update({
            where: { id: lead.id },
            data: {
              company: enrichedInfo.company || lead.company,
              phone: enrichedInfo.phone || lead.phone,
              enrichedAt: enrichedInfo.enrichedAt,
              enrichmentSource: enrichedInfo.enrichmentSource,
              score: updatedScore,
              answers: {
                ...(lead.answers as Record<string, any>),
                enrichmentDetails: enrichedInfo.details || {}
              } as any
            }
          });
          console.log(`[Background Enrichment] Lead ${lead.id} enriched. New Score: ${finalLead.score}/100.`);
        }

        await EmailService.sendNewLeadNotification(finalLead);

      } catch (backgroundError) {
        console.error(`[Background Enrichment Error] Process failed for lead ${lead.id}:`, backgroundError);
      }
    });

    return res.status(201).json(lead);

  } catch (error: any) {
    console.error('[LeadController] Error in createLead:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/leads
 * Fetches leads for the admin dashboard.
 * Supports: filtering by status, querying/searching, sorting, and pagination.
 */
export const getLeads = async (req: Request, res: Response): Promise<any> => {
  try {
        const {
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
      paginated
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status && typeof status === 'string' && Object.values(LeadStatus).includes(status as LeadStatus)) {
      whereClause.status = status as LeadStatus;
    }

    if (search && typeof search === 'string') {
      const searchString = search;
      whereClause.OR = [
        { name: { contains: searchString, mode: 'insensitive' } },
        { email: { contains: searchString, mode: 'insensitive' } },
        { company: { contains: searchString, mode: 'insensitive' } }
      ];
    }

    const validSortFields = ['createdAt', 'updatedAt', 'score', 'name', 'company'];
    const finalSortBy = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // Legacy fallback: return raw array if not explicitly asking for paginated format
    if (paginated !== 'true') {
      const leads = await prisma.lead.findMany({
        where: whereClause,
        orderBy: {
          [finalSortBy]: finalSortOrder
        }
      });
      return res.json(leads);
    }

    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where: whereClause,
        orderBy: {
          [finalSortBy]: finalSortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.lead.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.json({
      leads,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });

  } catch (error: any) {
    console.error('[LeadController] Error in getLeads:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * PATCH /api/leads/:id/status
 * Updates the status of a lead, merging metadata like follow_up_at/last_contacted_at into the answers JSON.
 */
export const updateLeadStatus = async (req: Request, res: Response): Promise<any> => {
  try {
        const id = req.params.id as string;
    const { status, follow_up_at } = req.body;

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const answers = (existingLead.answers as Record<string, any>) || {};
    if (follow_up_at) answers.follow_up_at = new Date(follow_up_at).toISOString();
    if (status === 'CONTACTED' || status === 'FOLLOW_UP_CALL' || status === 'QUALIFIED') {
       answers.last_contacted_at = new Date().toISOString();
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status: status as LeadStatus,
        answers: answers as any
      }
    });
    return res.json(lead);
  } catch (error: any) {
    console.error('[LeadController] Error in updateLeadStatus:', error);
    return res.status(500).json({ error: 'Failed to update lead status', message: error.message });
  }
};

/**
 * DELETE /api/leads
 * Cleans the database, deleting all meetings first, then all leads.
 */
export const deleteLeads = async (req: Request, res: Response): Promise<any> => {
  try {
    await prisma.meeting.deleteMany({});
    const deleted = await prisma.lead.deleteMany({});
    return res.json({ success: true, count: deleted.count });
  } catch (error: any) {
    console.error('[LeadController] Error in deleteLeads:', error);
    return res.status(500).json({ error: 'Failed to clear database', message: error.message });
  }
};

/**
 * POST /api/leads/scrape-gmaps
 * Non-blocking Google Maps scrape runner.
 */
export const scrapeGmaps = async (req: Request, res: Response): Promise<any> => {
  try {
    const query = req.body.query || req.body.searchQuery;
    if (!query) return res.status(400).json({ error: 'Search query required' });
    
    scrapeGoogleMaps(query).then(result => {
        console.log('[LeadController] GMaps Scrape completed:', result);
    }).catch(err => {
        console.error('[LeadController] GMaps Scrape background failure:', err);
    });

    return res.json({ message: 'Scraping started in background', query });
  } catch (error: any) {
    console.error('[LeadController] Error in scrapeGmaps:', error);
    return res.status(500).json({ error: 'Failed to trigger scraper', message: error.message });
  }
};

/**
 * POST /api/leads/inbound
 * Receives self-submitted lead information.
 */
export const inboundForm = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, name, job_title, company_name, ai_icebreaker } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const answers = {
      jobTitle: job_title || null,
      ai_icebreaker: ai_icebreaker || null
    };

    const initialScore = calculateLeadScore(
      email,
      { company: company_name || undefined, jobTitle: job_title || undefined },
      answers,
      false
    );

    const lead = await prisma.lead.upsert({
      where: { email },
      update: { 
        status: LeadStatus.NEW, 
        name: name || null, 
        company: company_name || null,
        answers: answers as any
      },
      create: { 
        email, 
        name: name || null, 
        company: company_name || null, 
        source: 'email_inbound', 
        status: LeadStatus.NEW, 
        score: initialScore,
        answers: answers as any
      }
    });

    // Trigger enrichment in background
    setImmediate(async () => {
      try {
        const enrichedInfo = await EnrichmentService.enrich(lead.email, lead.company || undefined);
        if (enrichedInfo) {
          const updatedScore = calculateLeadScore(
            lead.email,
            { company: enrichedInfo.company || lead.company || undefined, jobTitle: enrichedInfo.jobTitle },
            lead.answers as Record<string, any>
          );
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              company: enrichedInfo.company || lead.company,
              phone: enrichedInfo.phone || lead.phone,
              enrichedAt: enrichedInfo.enrichedAt,
              enrichmentSource: enrichedInfo.enrichmentSource,
              score: updatedScore
            }
          });
        }
      } catch (err) {
        console.error('[Background Enrichment Inbound Error]:', err);
      }
    });
    
    return res.json({ success: true, lead });
  } catch (error: any) {
    console.error('[LeadController] Error in inboundForm:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/webhooks/social
 * Receives social ad campaigns leads (e.g. Facebook/LinkedIn lead ads).
 */
export const socialWebhook = async (req: Request, res: Response): Promise<any> => {
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

    const initialScore = calculateLeadScore(leadEmail, {});

    const lead = await prisma.lead.upsert({
      where: { email: leadEmail },
      update: { status: LeadStatus.NEW },
      create: {
        email: leadEmail,
        name: leadName || 'Social Lead',
        source: 'social_ads',
        status: LeadStatus.NEW,
        score: initialScore,
        answers: {}
      }
    });

    return res.json({ success: true, lead });
  } catch (error: any) {
    console.error('[LeadController] Error in socialWebhook:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/leads/scrape
 * Custom website scraper non-blocking runner.
 */
export const triggerScraper = async (req: Request, res: Response): Promise<any> => {
  const url = req.body.url;
  if (!url) {
     return res.status(400).json({ error: 'URL is required' });
  }
  try {
     scrapeWebsite(url).then(result => {
        console.log('[LeadController] Web Scrape completed:', result);
     }).catch(err => {
        console.error('[LeadController] Web Scrape background failure:', err);
     });
     return res.json({ message: 'Scrape started in background', url });
  } catch (error: any) {
     console.error('[LeadController] Error in triggerScraper:', error);
     return res.status(500).json({ error: error.message });
  }
};

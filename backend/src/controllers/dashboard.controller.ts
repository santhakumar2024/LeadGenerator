import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { LeadStatus } from '@prisma/client';

export const getDashboardStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const totalLeads = await prisma.lead.count();
    const newLeads = await prisma.lead.count({ where: { status: LeadStatus.NEW } });
    const opportunityLeads = await prisma.lead.count({ where: { status: LeadStatus.OPPORTUNITY } });
    const nurtureLeads = await prisma.lead.count({ where: { status: LeadStatus.NURTURE } });
    const customerLeads = await prisma.lead.count({ where: { status: LeadStatus.CUSTOMER } });

    return res.json({
      totalLeads,
      newLeads,
      repliedLeads: opportunityLeads, // Keep matching frontend expected fields
      activeLeads: nurtureLeads,
      customerLeads,
      replyRate: totalLeads > 0 ? ((opportunityLeads / totalLeads) * 100).toFixed(1) : 0
    });
  } catch (error: any) {
    console.error('[DashboardController] Error in getDashboardStats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats', message: error.message });
  }
};

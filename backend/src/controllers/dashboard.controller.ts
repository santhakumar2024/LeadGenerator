import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalLeads = await prisma.lead.count();
    const newLeads = await prisma.lead.count({ where: { status: 'NEW' } });
    const repliedLeads = await prisma.lead.count({ where: { status: 'REPLIED' } });
    const activeLeads = await prisma.lead.count({ where: { status: 'CONTACTED' } });

    res.json({
      totalLeads,
      newLeads,
      repliedLeads,
      activeLeads,
      replyRate: totalLeads > 0 ? ((repliedLeads / totalLeads) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

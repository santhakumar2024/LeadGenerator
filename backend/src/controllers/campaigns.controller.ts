import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { step_number: 'asc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { step_number, subject, body } = req.body;
    const campaign = await prisma.campaign.create({
      data: { step_number, subject, body }
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { step_number, subject, body } = req.body;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { step_number, subject, body }
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.campaign.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

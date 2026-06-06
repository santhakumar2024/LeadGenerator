import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateIcebreaker = async (req: Request, res: Response) => {
  try {
    const { bio } = req.body;
    
    if (!bio) {
      return res.status(400).json({ error: 'Bio is required to generate an icebreaker' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the backend .env' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Write a short, professional, 1-sentence opening line for a cold email based on this bio. Mention a technical accomplishment. Keep it under 15 words. No fluff. Bio:\n\n${bio}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/^["']|["']$/g, '');

    res.json({ success: true, icebreaker: responseText });

  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to generate icebreaker', details: error.message });
  }
};

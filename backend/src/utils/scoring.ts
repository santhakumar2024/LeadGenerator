/**
 * List of common free/public email providers.
 * Leads from these providers receive lower default scores than those from professional corporate domains.
 */
const FREE_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'icloud.com',
  'mail.ru',
  'yandex.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'gmx.com'
];

/**
 * Calculates a numerical lead quality score (from 0 to 100) based on demographic attributes and intake responses.
 * 
 * Scoring System:
 * - Email Domain (Max 40 pts): Professional domains get 40 pts, while public/free domains get 10 pts.
 * - Job Title / Authority (Max 30 pts): High-level decision makers (CEO, Founder, Director, VP) get 30 pts; mid-level (Manager, Lead, Head) get 15 pts.
 * - Answers / Company Size & Budget (Max 20 pts): High budget or larger company sizes from intake answers get up to 20 pts.
 * - Consent (Max 10 pts): Giving communication consent gets 10 pts.
 * 
 * @param email - The lead's email address
 * @param details - Additional lead fields (company, phone, etc.)
 * @param answers - Questionnaire responses stored as key-value pairs
 * @param consent - Whether explicit communication consent was given
 * @returns An integer lead score between 0 and 100
 */
export function calculateLeadScore(
  email: string,
  details: { company?: string; phone?: string; jobTitle?: string },
  answers: Record<string, any> = {},
  consent: boolean = false
): number {
  let score = 0;

  // 1. Email Domain Evaluation (Max 40 points)
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      const isFreeProvider = FREE_EMAIL_PROVIDERS.includes(domain);
      if (isFreeProvider) {
        score += 10; // Basic points for public email
      } else {
        score += 40; // High points for professional business email
      }
    }
  }

  // 2. Job Title / Authority Level (Max 30 points)
  if (details.jobTitle) {
    const title = details.jobTitle.toLowerCase();
    
    // High-level decision makers
    if (
      title.includes('ceo') ||
      title.includes('founder') ||
      title.includes('owner') ||
      title.includes('president') ||
      title.includes('vp') ||
      title.includes('vice president') ||
      title.includes('director') ||
      title.includes('chief') ||
      title.includes('cto') ||
      title.includes('cfo') ||
      title.includes('coo')
    ) {
      score += 30;
    } 
    // Mid-level roles
    else if (
      title.includes('manager') ||
      title.includes('head') ||
      title.includes('lead') ||
      title.includes('supervisor')
    ) {
      score += 15;
    }
  }

  // 3. Intake Answers / Business Context (Max 20 points)
  // Look for common keys like 'company_size', 'employees', 'budget', 'timeline'
  for (const [key, value] of Object.entries(answers)) {
    const keyLower = key.toLowerCase();
    const valString = String(value).toLowerCase();

    // Company Size / Employees scoring
    if (keyLower.includes('size') || keyLower.includes('employee')) {
      if (valString.includes('50+') || valString.includes('100') || valString.includes('500') || valString.includes('10-50')) {
        score += 10;
      } else if (valString.includes('1-10') || valString.includes('5-10')) {
        score += 5;
      }
    }

    // Budget scoring
    if (keyLower.includes('budget')) {
      if (valString.includes('5000') || valString.includes('10000') || valString.includes('high') || valString.includes('1000+')) {
        score += 10;
      } else if (valString.includes('1000') || valString.includes('500-1000')) {
        score += 5;
      }
    }
  }

  // 4. Opt-in Consent (Max 10 points)
  if (consent) {
    score += 10;
  }

  // Clamp the score between 0 and 100
  return Math.min(Math.max(score, 0), 100);
}

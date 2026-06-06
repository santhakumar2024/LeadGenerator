import axios from 'axios';

export interface EnrichmentData {
  company?: string;
  phone?: string;
  jobTitle?: string;
  enrichmentSource: string;
  enrichedAt: Date;
  details?: Record<string, any>;
}

export class EnrichmentService {
  /**
   * Enriches a lead using a waterfall API model (Apollo.io -> Hunter.io fallback -> Mock data).
   * 
   * @param email - Lead email address
   * @param company - Optional company name
   * @returns Enriched lead data or null if all enrichments failed
   */
  static async enrich(email: string, company?: string): Promise<EnrichmentData | null> {
    const apolloKey = process.env.APOLLO_API_KEY;
    const hunterKey = process.env.HUNTER_API_KEY;
    const domain = email.split('@')[1];

    console.log(`[EnrichmentService] Starting enrichment waterfall for email: ${email}, domain: ${domain}`);

    // --- STEP 1: Try Apollo.io Enrichment ---
    if (apolloKey && apolloKey !== 'your_apollo_api_key_here') {
      try {
        console.log('[EnrichmentService] Attempting Apollo.io enrichment...');
        const response = await axios.post(
          'https://api.apollo.io/v1/people/match',
          {
            email: email,
            organization_name: company
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            params: {
              api_key: apolloKey
            },
            timeout: 5000 // 5 seconds timeout
          }
        );

        if (response.data && response.data.person) {
          const person = response.data.person;
          const organization = person.organization || {};
          console.log('[EnrichmentService] Apollo.io enrichment successful!');
          return {
            company: organization.name || company,
            phone: person.phone_numbers?.[0]?.sanitized_number || person.company?.phone || undefined,
            jobTitle: person.title || undefined,
            enrichmentSource: 'Apollo.io',
            enrichedAt: new Date(),
            details: {
              facebookUrl: person.facebook_url || null,
              linkedinUrl: person.linkedin_url || null,
              twitterUrl: person.twitter_url || null,
              companySize: organization.estimated_num_employees || null,
              industry: organization.industry || null,
              city: person.city || null,
              state: person.state || null
            }
          };
        } else {
          console.warn('[EnrichmentService] Apollo.io returned empty or no-match response.');
        }
      } catch (error: any) {
        console.error('[EnrichmentService] Apollo.io request failed:', error.message);
      }
    } else {
      console.log('[EnrichmentService] Apollo.io API key is not configured. Skipping Step 1.');
    }

    // --- STEP 2: Try Hunter.io Fallback ---
    if (hunterKey && hunterKey !== 'your_hunter_api_key_here') {
      try {
        console.log('[EnrichmentService] Attempting Hunter.io domain search fallback...');
        const response = await axios.get('https://api.hunter.io/v2/domain-search', {
          params: {
            domain: domain,
            api_key: hunterKey
          },
          timeout: 5000
        });

        if (response.data && response.data.data) {
          const data = response.data.data;
          console.log('[EnrichmentService] Hunter.io domain enrichment successful!');
          return {
            company: data.organization || company || data.domain,
            phone: data.phone_number || undefined,
            enrichmentSource: 'Hunter.io',
            enrichedAt: new Date(),
            details: {
              industry: data.industry || null,
              twitterUrl: data.twitter || null,
              facebookUrl: data.facebook || null,
              linkedinUrl: data.linkedin || null,
              pattern: data.pattern || null
            }
          };
        } else {
          console.warn('[EnrichmentService] Hunter.io returned no data for domain.');
        }
      } catch (error: any) {
        console.error('[EnrichmentService] Hunter.io request failed:', error.message);
      }
    } else {
      console.log('[EnrichmentService] Hunter.io API key is not configured. Skipping Step 2.');
    }

    // --- STEP 3: Sandbox/Development Mock Fallback ---
    console.log('[EnrichmentService] Falling back to mock data sandbox enrichment.');
    
    // Simulate API network latency (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Guess company name from domain prefix (e.g., google.com -> Google)
    const guessedCompany = company || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    const mockTitles = ['Founder & CEO', 'VP of Marketing', 'Head of Sales', 'Chief Technology Officer', 'Operations Director'];
    const randomTitle = mockTitles[Math.floor(Math.random() * mockTitles.length)];

    return {
      company: guessedCompany,
      phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
      jobTitle: randomTitle,
      enrichmentSource: 'Mock-Data-Waterfall-Fallback',
      enrichedAt: new Date(),
      details: {
        companySize: '11-50 employees',
        industry: 'Information Technology & Services',
        linkedinUrl: `https://linkedin.com/company/${guessedCompany.toLowerCase()}`,
        status: 'Enriched via Sandbox Fallback'
      }
    };
  }
}

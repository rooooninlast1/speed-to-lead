import { Lead } from '@prisma/client';

export class ScoringService {
  /**
   * Intelligent lead scoring algorithm
   */
  async calculateScore(lead: Lead): Promise<number> {
    let score = 0;

    // 1. Email quality (max 20 points)
    if (lead.email) {
      score += 10; // has email
      if (!lead.email.includes('gmail') && !lead.email.includes('yahoo') && !lead.email.includes('hotmail')) {
        score += 10; // business email bonus
      }
    }

    // 2. Data completeness (max 30 points)
    if (lead.firstName) score += 5;
    if (lead.lastName) score += 5;
    if (lead.phone) score += 10;
    if (lead.company) score += 10;

    // 3. Source quality (max 20 points)
    const metadata = lead.metadata as any;
    if (metadata?.utm_source === 'google') score += 10;
    if (metadata?.utm_medium === 'cpc') score += 8;
    if (metadata?.utm_campaign) score += 2;

    // 4. Behavioral signals (max 15 points)
    if (metadata?.page_url?.includes('pricing')) score += 10;
    if (metadata?.page_url?.includes('enterprise')) score += 5;

    // 5. Company signals (max 15 points)
    if (lead.company) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  getQualification(score: number): string {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'qualified';
    if (score >= 30) return 'new';
    return 'unqualified';
  }

  getTags(lead: Lead, score: number): string[] {
    const tags: string[] = [];

    if (score >= 80) tags.push('priority', 'hot-lead');
    if (lead.company) tags.push('b2b');
    const metadata = lead.metadata as any;
    if (metadata?.utm_source === 'google') tags.push('google-ads');
    if (metadata?.page_url?.includes('pricing')) tags.push('high-intent');

    return tags;
  }
}

export const scoringService = new ScoringService();

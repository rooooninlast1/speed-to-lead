import { Lead } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class RoutingService {
  /**
   * Smart routing logic:
   * 1. Check condition-based routing rules
   * 2. Check round-robin assignment
   * 3. Fallback to available team members
   */
  async routeLead(lead: Lead) {
    // Get active routing rules ordered by priority
    const rules = await prisma.routingRule.findMany({
      where: {
        organizationId: lead.organizationId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    // 1. Try condition-based rules first
    for (const rule of rules) {
      if (this.matchesConditions(lead, rule.conditions as any)) {
        const user = await this.executeAction(lead.organizationId, rule);
        if (user) return user;
      }
    }

    // 2. Fallback to round-robin
    return await this.roundRobinAssignment(lead.organizationId);
  }

  private matchesConditions(lead: Lead, conditions: any): boolean {
    if (!conditions) return false;

    let matches = true;

    if (conditions.minScore && lead.score < conditions.minScore) {
      matches = false;
    }

    if (conditions.qualification && lead.qualification !== conditions.qualification) {
      matches = false;
    }

    if (conditions.hasTag && !lead.tags.includes(conditions.hasTag)) {
      matches = false;
    }

    if (conditions.sourceId && lead.sourceId !== conditions.sourceId) {
      matches = false;
    }

    const metadata = lead.metadata as any;
    if (conditions.utmSource && metadata?.utm_source !== conditions.utmSource) {
      matches = false;
    }

    if (conditions.utmMedium && metadata?.utm_medium !== conditions.utmMedium) {
      matches = false;
    }

    return matches;
  }

  private async executeAction(organizationId: string, rule: any) {
    if (rule.action === 'assign_to_user' && rule.targetId) {
      const user = await prisma.user.findFirst({
        where: { id: rule.targetId, organizationId, isActive: true },
      });
      return user;
    }

    return null;
  }

  /**
   * Round-robin lead distribution among active team members
   */
  private async roundRobinAssignment(organizationId: string) {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        role: { not: 'admin' },
      },
    });

    if (users.length === 0) return null;

    // Get the user with the least recently assigned lead
    const lastAssignments = await prisma.lead.groupBy({
      by: ['assignedToId'],
      where: {
        organizationId,
        assignedToId: { in: users.map(u => u.id) },
      },
      _max: { createdAt: true },
    });

    // Find user with oldest (or no) assignment
    let selectedUser = users[0];
    let oldestDate = new Date();

    for (const user of users) {
      const assignment = lastAssignments.find(a => a.assignedToId === user.id);
      if (!assignment || !assignment._max.createdAt) {
        selectedUser = user;
        break; // User has no assignments, pick them
      }
      if (assignment._max.createdAt < oldestDate) {
        oldestDate = assignment._max.createdAt;
        selectedUser = user;
      }
    }

    return selectedUser;
  }
}

export const routingService = new RoutingService();

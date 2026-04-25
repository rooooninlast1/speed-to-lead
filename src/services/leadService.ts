import { Lead } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { scoringService } from './scoring';
import { routingService } from './routing';
import { messageService } from './messageService';
import { notificationService } from './notificationService';
import { activityService } from './activityService';
import { io } from '../lib/socket';

interface LeadInput {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  company?: string;
  metadata?: any;
  formId?: string;
  sourceId?: string;
  organizationId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  pageUrl?: string;
}

export class LeadService {
  async captureLead(input: LeadInput) {
    const startTime = Date.now();

    // 1. CAPTURE & CREATE LEAD (immediate)
    const lead = await prisma.lead.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName || null,
        phone: input.phone || null,
        company: input.company || null,
        metadata: {
          ...input.metadata,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          referrer: input.referrer,
          page_url: input.pageUrl,
        },
        organizationId: input.organizationId,
        formId: input.formId || null,
        sourceId: input.sourceId || null,
        status: 'new',
        qualification: 'new',
      },
    });

    await activityService.log({
      leadId: lead.id,
      organizationId: input.organizationId,
      action: 'lead_created',
      description: `New lead captured: ${lead.email}`,
    });

    if (io) {
      io.to(`org:${input.organizationId}`).emit('new_lead', lead);
    }

    // 2. ASYNC PROCESSING (parallel for speed)
    void (async () => {
      const scored = await this.scoreAndQualify(lead.id);
      const routed = await this.routeLead(lead.id);
      if (routed?.assignedToId) {
        await this.sendInstantFollowUp(routed.id);
      }
    })();

    const processingTime = Date.now() - startTime;
    console.log(`⚡ Lead captured in ${processingTime}ms`);

    return lead;
  }

  private async scoreAndQualify(leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return null;

    const score = await scoringService.calculateScore(lead);
    const qualification = scoringService.getQualification(score);

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { score, qualification, tags: scoringService.getTags(lead, score) },
    });

    await activityService.log({
      leadId: lead.id,
      organizationId: lead.organizationId,
      action: 'lead_scored',
      description: `Lead scored: ${score} - ${qualification}`,
      metadata: { score, qualification },
    });

    if (io) {
      io.to(`org:${lead.organizationId}`).emit('lead_updated', updated);
    }

    return updated;
  }

  private async routeLead(leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return null;

    const assignedUser = await routingService.routeLead(lead);

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedToId: assignedUser?.id || null,
        routedBy: assignedUser ? 'routing_rule' : null,
        status: assignedUser ? 'contacted' : 'new',
      },
    });

    if (assignedUser) {
      await notificationService.notifyNewLeadAssignment(assignedUser.id, lead);
    }

    if (io) {
      io.to(`org:${lead.organizationId}`).emit('lead_routed', updated);
    }

    return updated;
  }

  private async sendInstantFollowUp(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedTo: true },
    });
    if (!lead || !lead.assignedToId) return;

    await messageService.sendPersonalizedMessage(lead);

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        followUpSent: true,
        followUpSentAt: new Date(),
        isContacted: true,
        contactedAt: new Date(),
      },
    });

    await activityService.log({
      leadId: lead.id,
      organizationId: lead.organizationId,
      userId: lead.assignedToId,
      action: 'message_sent',
      description: `Automated follow-up sent to ${lead.email}`,
    });

    if (io) {
      io.to(`org:${lead.organizationId}`).emit('follow_up_sent', updated);
    }

    return updated;
  }

  async getLeads(
    organizationId: string,
    filters: {
      status?: string;
      qualification?: string;
      assignedToId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.qualification) where.qualification = filters.qualification;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 25;
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const leadService = new LeadService();

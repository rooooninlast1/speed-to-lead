import { prisma } from '../lib/prisma';

interface ActivityInput {
  leadId?: string;
  organizationId?: string;
  userId?: string;
  action: string;
  description: string;
  metadata?: any;
}

export const activityService = {
  async log(input: ActivityInput) {
    return prisma.activity.create({
      data: {
        leadId: input.leadId || null,
        organizationId: input.organizationId || null,
        userId: input.userId || null,
        action: input.action,
        description: input.description,
        metadata: input.metadata ?? {},
      },
    });
  },
};

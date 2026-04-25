import { prisma } from '../lib/prisma';
import { io } from '../lib/socket';

export class NotificationService {
  async notifyNewLeadAssignment(userId: string, lead: any) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'lead_assigned',
        title: 'New Lead Assigned',
        message: `${lead.firstName} ${lead.lastName || ''} from ${lead.company || 'Unknown'} has been assigned to you`,
        leadId: lead.id,
      },
    });

    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  }

  async notifyLeadQualified(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedTo: true },
    });

    if (!lead || !lead.assignedToId) return;

    const notification = await prisma.notification.create({
      data: {
        userId: lead.assignedToId,
        type: 'lead_qualified',
        title: 'Lead Qualified',
        message: `${lead.firstName} ${lead.lastName || ''} has been marked as ${lead.qualification}`,
        leadId: lead.id,
      },
    });

    if (io) {
      io.to(`user:${lead.assignedToId}`).emit('notification', notification);
    }

    return notification;
  }

  async getUnreadNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}

export const notificationService = new NotificationService();

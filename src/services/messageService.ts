import { Lead } from '@prisma/client';
import { Resend } from 'resend';
import { prisma } from '../lib/prisma';

const resend = process.env.RESEND_API_KEY?.startsWith('re_')
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export class MessageService {
  /**
   * Send personalized follow-up message
   */
  async sendPersonalizedMessage(lead: Lead & { assignedTo?: any }) {
    try {
      // Get active template for this organization
      const template = await prisma.messageTemplate.findFirst({
        where: {
          organizationId: lead.organizationId,
          isActive: true,
          channel: 'email',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!template) {
        console.log(`No active template found for org ${lead.organizationId}`);
        return null;
      }

      const subject = this.processTemplate(template.subject, lead);
      const body = this.processTemplate(template.body, lead);

      if (resend) {
        await resend.emails.send({
          from: `${lead.assignedTo?.name || 'Team'} <leads@${process.env.EMAIL_DOMAIN || 'example.com'}>`,
          to: lead.email,
          subject,
          html: body,
          tags: [{ name: 'lead_id', value: lead.id }],
        });
      } else {
        console.log(`[Email Mock] To: ${lead.email} | Subject: ${subject}`);
      }

      const messageLog = await prisma.messageLog.create({
        data: {
          leadId: lead.id,
          templateId: template.id,
          channel: 'email',
          subject,
          body,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: { messageSentId: messageLog.id },
      });

      return messageLog;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  private processTemplate(text: string, lead: Lead & { assignedTo?: any }): string {
    const variables: Record<string, string> = {
      '{{firstName}}': lead.firstName || '',
      '{{lastName}}': lead.lastName || '',
      '{{fullName}}': `${lead.firstName} ${lead.lastName || ''}`.trim(),
      '{{email}}': lead.email,
      '{{company}}': lead.company || '',
      '{{phone}}': lead.phone || '',
      '{{assignedTo}}': lead.assignedTo?.name || 'Our Team',
      '{{assignedEmail}}': lead.assignedTo?.email || '',
      '{{currentDate}}': new Date().toLocaleDateString(),
      '{{currentTime}}': new Date().toLocaleTimeString(),
    };

    let processed = text;
    for (const [key, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return processed;
  }

  async sendManualMessage(leadId: string, _userId: string, message: { subject: string; body: string }) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedTo: true },
    });

    if (!lead) throw new Error('Lead not found');

    if (resend) {
      await resend.emails.send({
        from: `${lead.assignedTo?.name || 'Team'} <leads@${process.env.EMAIL_DOMAIN || 'example.com'}>`,
        to: lead.email,
        subject: message.subject,
        html: message.body,
      });
    } else {
      console.log(`[Email Mock Manual] To: ${lead.email} | Subject: ${message.subject}`);
    }

    const messageLog = await prisma.messageLog.create({
      data: {
        leadId: lead.id,
        channel: 'email',
        subject: message.subject,
        body: message.body,
        status: 'sent',
      },
    });

    return messageLog;
  }
}

export const messageService = new MessageService();

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { leadService } from '../services/leadService';
import { messageService } from '../services/messageService';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all leads with filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const leads = await leadService.getLeads(req.organization!.id, {
      status: req.query.status as string,
      qualification: req.query.qualification as string,
      assignedToId: req.query.assignedToId as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get single lead
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, organizationId: req.organization!.id },
      include: {
        assignedTo: true,
        activities: { orderBy: { createdAt: 'desc' } },
        messageSent: true,
      },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Manual lead creation via dashboard
router.post('/', async (req: AuthRequest, res) => {
  try {
    const lead = await leadService.captureLead({
      ...req.body,
      organizationId: req.organization!.id,
    });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const lead = await prisma.lead.updateMany({
      where: { id: req.params.id, organizationId: req.organization!.id },
      data: req.body,
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Send manual message to lead
router.post('/:id/message', async (req: AuthRequest, res) => {
  try {
    const message = await messageService.sendManualMessage(
      req.params.id,
      req.user!.id,
      req.body
    );
    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// Reassign lead
router.post('/:id/reassign', async (req: AuthRequest, res) => {
  try {
    const lead = await prisma.lead.updateMany({
      where: { id: req.params.id, organizationId: req.organization!.id },
      data: { assignedToId: req.body.userId, routedBy: 'manual' },
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reassign lead' });
  }
});

export default router;

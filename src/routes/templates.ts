import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { organizationId: req.organization!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const template = await prisma.messageTemplate.create({
      data: { ...req.body, organizationId: req.organization!.id },
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const template = await prisma.messageTemplate.updateMany({
      where: { id: req.params.id, organizationId: req.organization!.id },
      data: req.body,
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

export default router;

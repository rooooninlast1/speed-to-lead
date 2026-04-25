import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const rules = await prisma.routingRule.findMany({
      where: { organizationId: req.organization!.id },
      orderBy: { priority: 'desc' },
    });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routing rules' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const rule = await prisma.routingRule.create({
      data: { ...req.body, organizationId: req.organization!.id },
    });
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create routing rule' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const rule = await prisma.routingRule.updateMany({
      where: { id: req.params.id, organizationId: req.organization!.id },
      data: req.body,
    });
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update routing rule' });
  }
});

export default router;

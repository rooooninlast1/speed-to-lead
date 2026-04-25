import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Public form config (no auth)
router.get('/public/:endpoint', async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: { endpoint: req.params.endpoint, isActive: true },
      select: { id: true, name: true, fields: true, successMessage: true, redirectUrl: true },
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// List org forms
router.get('/', async (req: AuthRequest, res) => {
  try {
    const forms = await prisma.form.findMany({
      where: { organizationId: req.organization!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Create form
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, endpoint, fields, redirectUrl, successMessage } = req.body;
    const form = await prisma.form.create({
      data: {
        name,
        endpoint,
        fields: fields || {},
        redirectUrl: redirectUrl || null,
        successMessage: successMessage || null,
        organizationId: req.organization!.id,
      },
    });
    res.status(201).json(form);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Endpoint already exists' });
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const form = await prisma.form.updateMany({
      where: { id: req.params.id, organizationId: req.organization!.id },
      data: req.body,
    });
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update form' });
  }
});

export default router;

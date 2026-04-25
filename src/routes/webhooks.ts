import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { leadService } from '../services/leadService';

const router = Router();

// CORS preflight
router.options('/submit/:formEndpoint', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// Public webhook endpoint for form submissions
router.post('/submit/:formEndpoint', async (req, res) => {
  try {
    const startTime = Date.now();

    const form = await prisma.form.findUnique({
      where: { endpoint: req.params.formEndpoint },
    });

    if (!form || !form.isActive) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { email, firstName, lastName, phone, company, ...metadata } = req.body;

    if (!email || !firstName) {
      return res.status(400).json({ error: 'Email and firstName are required' });
    }

    const utmSource = (req.query.utm_source as string) || (req.headers['x-utm-source'] as string);
    const utmMedium = (req.query.utm_medium as string) || (req.headers['x-utm-medium'] as string);
    const utmCampaign = (req.query.utm_campaign as string) || (req.headers['x-utm-campaign'] as string);
    const referrer = req.headers.referer as string;
    const pageUrl = (req.headers['x-page-url'] as string) || referrer;

    const lead = await leadService.captureLead({
      email,
      firstName,
      lastName,
      phone,
      company,
      metadata,
      formId: form.id,
      organizationId: form.organizationId,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
      pageUrl,
    });

    const processingTime = Date.now() - startTime;

    res.status(201).json({
      success: true,
      message: form.successMessage || "Thanks! We'll be in touch shortly.",
      redirectUrl: form.redirectUrl,
      leadId: lead.id,
      processingTime: `${processingTime}ms`,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Dashboard stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const orgId = req.organization!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      todayLeads,
      hotLeads,
      converted,
      avgResponseTime,
      recentLeads,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.count({
        where: { organizationId: orgId, createdAt: { gte: today } },
      }),
      prisma.lead.count({
        where: { organizationId: orgId, qualification: 'hot' },
      }),
      prisma.lead.count({
        where: { organizationId: orgId, status: 'converted' },
      }),
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("followUpSentAt" - "createdAt"))) as avg_seconds
        FROM "Lead"
        WHERE "organizationId" = ${orgId}
        AND "followUpSentAt" IS NOT NULL
      `,
      prisma.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { assignedTo: { select: { name: true } } },
      }),
    ]);

    const avgSeconds = (avgResponseTime as any)[0]?.avg_seconds || 0;

    res.json({
      totalLeads,
      todayLeads,
      hotLeads,
      conversionRate: totalLeads > 0 ? (((converted as number) / totalLeads) * 100).toFixed(1) : 0,
      avgResponseTime: `${Math.round(avgSeconds)}s`,
      avgResponseTimeMs: Math.round(avgSeconds * 1000),
      recentLeads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Lead sources breakdown
router.get('/sources', async (req: AuthRequest, res) => {
  try {
    const sources = await prisma.lead.groupBy({
      by: ['sourceId'],
      where: { organizationId: req.organization!.id },
      _count: true,
    });

    const sourceNames = await prisma.leadSource.findMany({
      where: { organizationId: req.organization!.id },
    });

    const breakdown = sources.map(s => ({
      sourceId: s.sourceId,
      count: s._count,
      name: sourceNames.find(n => n.id === s.sourceId)?.name || 'Direct',
    }));

    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Daily lead trend (last 30 days)
router.get('/trend', async (req: AuthRequest, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trend = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "Lead"
      WHERE "organizationId" = ${req.organization!.id}
      AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

export default router;

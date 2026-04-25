import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(userId: string, organizationId: string) {
  return jwt.sign({ userId, organizationId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;
    if (!email || !password || !name || !organizationName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 12);
    const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-');

    const org = await prisma.organization.create({
      data: { name: organizationName, slug: orgSlug },
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: 'admin',
        organizationId: org.id,
      },
      include: { organization: true },
    });

    const token = signToken(user.id, org.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, organization: org });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const token = signToken(user.id, user.organizationId);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, organization: user.organization });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json({ user: req.user, organization: req.organization });
});

export default router;

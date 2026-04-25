import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function seed() {
  const org = await prisma.organization.create({
    data: { name: 'Demo Org', slug: 'demo-org' },
  });

  const hashed = await bcrypt.hash('password123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: hashed,
      name: 'Admin User',
      role: 'admin',
      organizationId: org.id,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@demo.com',
      password: hashed,
      name: 'Team Member',
      role: 'member',
      organizationId: org.id,
    },
  });

  const source = await prisma.leadSource.create({
    data: { name: 'Website', organizationId: org.id, utmSource: 'website' },
  });

  const form = await prisma.form.create({
    data: {
      name: 'Demo Form',
      endpoint: 'demo-form',
      fields: { email: true, firstName: true, lastName: true, phone: true, company: true },
      organizationId: org.id,
    },
  });

  const template = await prisma.messageTemplate.create({
    data: {
      name: 'Welcome Email',
      subject: 'Welcome {{firstName}}!',
      body: '<p>Hi {{firstName}}, thanks for reaching out! We will be in touch shortly.</p>',
      channel: 'email',
      organizationId: org.id,
    },
  });

  console.log('✅ Seeded demo data');
  console.log(`   Organization: ${org.name} (${org.slug})`);
  console.log(`   Admin: ${admin.email} / password123`);
  console.log(`   Member: ${member.email} / password123`);
  console.log(`   Form endpoint: /api/webhooks/submit/${form.endpoint}`);
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

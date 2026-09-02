/**
 * Seed utility — creates the default admin user on first startup.
 */
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export async function seedAdminUser(): Promise<void> {
  const existing = await User.findOne({ email: 'admin@riskmanager.ai' });
  if (existing) return;

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await User.create({
    email: 'admin@riskmanager.ai',
    passwordHash,
    fullName: 'Admin User',
    role: 'admin',
    isActive: true,
  });
  console.log('[Seed] Admin user created: admin@riskmanager.ai / Admin@123');
}

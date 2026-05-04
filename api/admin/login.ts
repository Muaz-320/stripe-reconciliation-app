/**
 * Vercel Serverless: POST /api/admin/login
 * In Vercel → Settings → Environment Variables set ADMIN_USERNAME and ADMIN_PASSWORD.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { username, password } = (req.body || {}) as {
    username?: string;
    password?: string;
  };

  const expectedUser = (process.env.ADMIN_USERNAME ?? '').trim();
  const expectedPass = process.env.ADMIN_PASSWORD ?? '';

  if (!expectedUser || !expectedPass) {
    res.status(503).json({
      success: false,
      message:
        'Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in Vercel.',
    });
    return;
  }

  if (username === expectedUser && password === expectedPass) {
    res.status(200).json({
      success: true,
      user: { id: 1001, name: 'Admin', role: 'Super Admin' },
    });
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Invalid username or password credentials.',
  });
}

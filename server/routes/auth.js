import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { hashAdminPassword, verifyAdminPassword } from '../security/adminPassword.js';

const router = Router();


const sessionCookieOptions = {
  httpOnly: true,
  maxAge:   60 * 60 * 1000,   // 1 hour in ms
  path:     '/api',
  sameSite: 'strict',
  secure:   process.env.NODE_ENV === 'production'
};


router.post('/login', async (req, res, next) => {
  const { username, password } = req.body ?? {};
  const secret = process.env.JWT_SECRET;

  // Guard: JWT_SECRET must be set and long enough before we can issue tokens
  if (!secret || Buffer.byteLength(secret) < 32) {
    return res.status(503).json({ message: 'Admin authentication is not configured.' });
  }

  // Basic input validation — empty strings are rejected early
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Look up the admin and explicitly request the hidden password fields.
    // `select: false` on those schema fields means they are excluded by default
    // — we have to ask for them explicitly with the + prefix.
    const admin = await Admin.findOne({
      username: username.trim().toLowerCase(),
      isActive: true
    }).select('+passwordHash +passwordPeppered');

    let passwordMatches = false;
    if (admin) {
      passwordMatches = await verifyAdminPassword(
        password,
        admin.passwordHash,
        admin.passwordPeppered
      );
      // Migrate old un-peppered hashes to the more secure peppered format
      if (passwordMatches && !admin.passwordPeppered) {
        admin.passwordHash      = await hashAdminPassword(password);
        admin.passwordPeppered  = true;
        await admin.save();
      }
    } else {
      // Dummy work so the response time matches a valid-username path
      await hashAdminPassword(password);
    }

    if (!admin || !passwordMatches) {
      // Single vague message so attackers cannot tell which part was wrong
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    
    const token = jwt.sign(
      { role: admin.role },
      secret,
      {
        algorithm: 'HS256',
        audience:  'civicfix-admin',
        expiresIn: '1h',
        issuer:    'civicfix-pro',
        subject:   admin.id
      }
    );

    // Attach the token as an HttpOnly cookie and confirm authentication
    res.cookie('civicfix_admin', token, sessionCookieOptions);
    res.json({ authenticated: true, expiresIn: 3600 });
  } catch (error) {
    next(error);
  }
});


router.get('/session', requireAdmin, (req, res) => {
  // req.admin was attached by the requireAdmin middleware after DB verification
  res.json({ authenticated: true, username: req.admin.username });
});


router.post('/logout', (req, res) => {
  res.clearCookie('civicfix_admin', {
    httpOnly: true,
    path:     '/api',
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production'
  });
  res.json({ authenticated: false });
});

export default router;

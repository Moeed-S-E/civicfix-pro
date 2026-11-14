import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

export async function requireAdmin(req, res, next) {
  const secret = process.env.JWT_SECRET;

  // Safety check: refuse to operate without a properly configured secret
  if (!secret || Buffer.byteLength(secret) < 32) {
    return res.status(503).json({ message: 'Admin authentication is not configured.' });
  }


  const token = req.cookies?.civicfix_admin;
  if (!token) {
    return res.status(401).json({ message: 'A valid admin session is required.' });
  }

  try {

    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],      // reject tokens signed with any other algorithm
      audience:   'civicfix-admin',
      issuer:     'civicfix-pro'
    });

    // Extra payload validation — ensure the token carries the right role and
    // a well-formed subject (MongoDB ObjectId)
    if (
      typeof payload !== 'object' ||
      payload.role !== 'admin' ||
      !mongoose.isValidObjectId(payload.sub)
    ) {
      return res.status(403).json({ message: 'Admin access is required.' });
    }

    const admin = await Admin.findOne({
      _id:      payload.sub,
      role:     'admin',
      isActive: true
    }).select('_id username role').lean();

    if (!admin) {
      return res.status(401).json({ message: 'This admin account is no longer active.' });
    }

    // Attach the admin record to the request so downstream handlers can use it
    // e.g. GET /api/auth/session responds with req.admin.username
    req.admin = admin;
    return next();
  } catch (error) {
    // JsonWebTokenError covers expired, malformed, and wrong-signature tokens
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Your admin session is invalid or expired.' });
    }
    // Any other error (DB failure, etc.) goes to the global error handler
    return next(error);
  }
}

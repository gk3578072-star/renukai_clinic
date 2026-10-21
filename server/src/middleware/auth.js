import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) return res.status(401).json({ message: 'Please sign in to continue.' });

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'renukai-dental-api',
      audience: 'renukai-dental-client',
    });
  } catch {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
  if (!payload || typeof payload === 'string' || typeof payload.sub !== 'string') {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }

  try {
    const user = await User.findById(payload.sub).select('-__v');
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function adminOnly(req, res, next) {
  const authorizedPhones = new Set(
    (process.env.ADMIN_PHONES || '').split(',').map((phone) => phone.trim()).filter(Boolean),
  );
  if (req.user?.role !== 'admin' || !authorizedPhones.has(req.user.phone)) {
    return res.status(403).json({ message: 'Administrator access required.' });
  }
  next();
}

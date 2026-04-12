import jwt from 'jsonwebtoken';

function parseBearerToken(header) {
  if (!header) {
    return { error: 'Token requerido' };
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return { error: 'Formato de token inválido' };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return { user: { id: payload.id } };
  } catch (err) {
    console.error(err);
    return { error: 'Token inválido' };
  }
}

export function requireAuth(req, res, next) {
  const result = parseBearerToken(req.headers.authorization);

  if (!result.user) {
    return res.status(401).json({ message: result.error });
  }

  req.user = result.user;
  return next();
}

export function optionalAuth(req, res, next) {
  if (!req.headers.authorization) {
    return next();
  }

  const result = parseBearerToken(req.headers.authorization);

  if (!result.user) {
    return res.status(401).json({ message: result.error });
  }

  req.user = result.user;
  return next();
}

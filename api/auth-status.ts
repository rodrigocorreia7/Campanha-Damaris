import { authErrorResponse, validateSessionFromCookie } from '../lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const validSession = await validateSessionFromCookie(req.headers.cookie || null);
    if (!validSession) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      user: validSession.user,
      expiresAt: validSession.session.expires_at,
    });
  } catch (error) {
    return authErrorResponse(res, error);
  }
}

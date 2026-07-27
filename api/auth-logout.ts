import { authErrorResponse, clearSessionCookie, logoutByCookie } from '../lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    await logoutByCookie(req.headers.cookie || null);
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (error) {
    return authErrorResponse(res, error);
  }
}

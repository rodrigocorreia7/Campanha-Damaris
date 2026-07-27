import { authErrorResponse, registerWithInvite, sessionCookie } from '../lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const result = await registerWithInvite({
      inviteCode: body.inviteCode,
      email: body.email,
      password: body.password,
      displayName: body.displayName,
    });

    res.setHeader('Set-Cookie', sessionCookie(result.token, req));
    return res.status(200).json({
      ok: true,
      user: result.user,
      expiresInHours: 48,
    });
  } catch (error) {
    return authErrorResponse(res, error);
  }
}

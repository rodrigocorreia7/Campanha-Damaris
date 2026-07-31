import { authErrorResponse, resetAdminPassword } from '../lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    await resetAdminPassword({
      email: body.email,
      setupCode: body.setupCode,
      password: body.password,
    });

    return res.status(200).json({
      ok: true,
      message: 'Senha redefinida.',
    });
  } catch (error) {
    return authErrorResponse(res, error);
  }
}

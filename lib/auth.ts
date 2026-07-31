export type AuthUser = {
  id: string;
  email: string;
  display_name: string | null;
  expires_at: string;
};

export type AuthSession = {
  id: string;
  user_id: string;
  expires_at: string;
};

export type ValidSession = {
  session: AuthSession;
  user: AuthUser;
};

type InviteRow = {
  id: string;
  code_hash: string;
  label: string | null;
  max_uses: number;
  uses: number;
  expires_at: string;
  revoked_at: string | null;
};

const SESSION_COOKIE = 'damaris_session';
const ACCESS_HOURS = 48;
const ADMIN_ACCESS_HOURS = 24 * 365 * 10;
const SESSION_MAX_AGE_SECONDS = ACCESS_HOURS * 60 * 60;

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export function isPublicAuthPath(pathname: string) {
  return (
    pathname === '/login.html' ||
    pathname === '/auth.css' ||
    pathname === '/auth.js' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth-')
  );
}

export async function validateSessionFromCookie(cookieHeader: string | null): Promise<ValidSession | null> {
  const token = getCookie(cookieHeader, SESSION_COOKIE);
  if (!token) {
    return null;
  }

  return validateSessionToken(token);
}

export async function validateSessionToken(token: string): Promise<ValidSession | null> {
  const tokenHash = await hashSecret(`session:${token}`);
  const now = new Date().toISOString();
  const sessions = await supabaseGet<AuthSession[]>(
    `auth_sessions?token_hash=eq.${encodeURIComponent(tokenHash)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(now)}&select=id,user_id,expires_at&limit=1`,
  );

  const session = sessions[0];
  if (!session) {
    return null;
  }

  const users = await supabaseGet<AuthUser[]>(
    `auth_users?id=eq.${encodeURIComponent(session.user_id)}&select=id,email,display_name,expires_at&limit=1`,
  );

  const user = users[0];
  if (!user) {
    return null;
  }

  if (new Date(user.expires_at).getTime() <= Date.now() && !isAdminEmail(user.email)) {
    return null;
  }

  return { session, user };
}

export async function registerWithInvite(input: {
  inviteCode: string;
  email: string;
  password: string;
  displayName?: string;
}) {
  const inviteCode = normalizeCode(input.inviteCode);
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  const displayName = String(input.displayName || '').trim() || null;
  const adminAccess = isAdminEmail(email);
  const adminSetupCode = normalizeCode(process.env.AUTH_ADMIN_SETUP_CODE || '');
  const adminSetupAccess = adminAccess && Boolean(adminSetupCode) && inviteCode === adminSetupCode;

  assertEmail(email);
  assertPassword(password);

  const now = new Date();
  const nowIso = now.toISOString();
  let invite: InviteRow | null = null;

  if (!adminSetupAccess) {
    const inviteHash = await hashSecret(`invite:${inviteCode}`);
    const invites = await supabaseGet<InviteRow[]>(
      `auth_invites?code_hash=eq.${encodeURIComponent(inviteHash)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(nowIso)}&select=id,code_hash,label,max_uses,uses,expires_at,revoked_at&limit=1`,
    );
    invite = invites[0] || null;

    if (!invite || invite.uses >= invite.max_uses) {
      throw new AuthError('Convite inválido, expirado ou já utilizado.', 403);
    }
  }

  const existing = await supabaseGet<AuthUser[]>(
    `auth_users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
  );

  if (existing.length > 0) {
    throw new AuthError('Este e-mail já tem cadastro. Use a opção Entrar.', 409);
  }

  const userExpiresAt = addHours(now, adminAccess ? ADMIN_ACCESS_HOURS : ACCESS_HOURS).toISOString();
  const passwordHash = await hashSecret(`password:${email}:${password}`);
  const createdUsers = await supabasePost<AuthUser[]>('auth_users', {
    email,
    password_hash: passwordHash,
    display_name: displayName,
    expires_at: userExpiresAt,
  });
  const user = createdUsers[0];

  if (!user) {
    throw new AuthError('Não foi possível criar o acesso agora.', 500);
  }

  if (invite) {
    await supabasePatch(
      `auth_invites?id=eq.${encodeURIComponent(invite.id)}`,
      {
        uses: invite.uses + 1,
        used_at: nowIso,
        used_by: user.id,
      },
    );
  }

  const token = await createSession(user.id, input.email);
  return { user, token };
}

export async function loginWithPassword(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const password = String(input.password || '');
  assertEmail(email);

  const users = await supabaseGet<Array<AuthUser & { password_hash: string }>>(
    `auth_users?email=eq.${encodeURIComponent(email)}&select=id,email,display_name,expires_at,password_hash&limit=1`,
  );
  const user = users[0];
  const passwordHash = await hashSecret(`password:${email}:${password}`);

  if (!user || user.password_hash !== passwordHash) {
    throw new AuthError('E-mail ou senha inválidos.', 401);
  }

  if (new Date(user.expires_at).getTime() <= Date.now() && !isAdminEmail(user.email)) {
    throw new AuthError('Este acesso expirou. Gere um novo convite para liberar mais 48 horas.', 403);
  }

  const token = await createSession(user.id, email);
  const { password_hash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function resetAdminPassword(input: { email: string; setupCode: string; password: string }) {
  const email = normalizeEmail(input.email);
  const setupCode = normalizeCode(input.setupCode);
  const password = String(input.password || '');
  const adminSetupCode = normalizeCode(process.env.AUTH_ADMIN_SETUP_CODE || '');

  assertEmail(email);
  assertPassword(password);

  if (!isAdminEmail(email) || !adminSetupCode || setupCode !== adminSetupCode) {
    throw new AuthError('Código de redefinição inválido.', 403);
  }

  const users = await supabaseGet<AuthUser[]>(
    `auth_users?email=eq.${encodeURIComponent(email)}&select=id,email,display_name,expires_at&limit=1`,
  );
  const user = users[0];

  if (!user) {
    throw new AuthError('Nenhum acesso admin foi encontrado para este e-mail. Use Primeiro acesso antes.', 404);
  }

  const now = new Date();
  const passwordHash = await hashSecret(`password:${email}:${password}`);

  await supabasePatch(
    `auth_users?id=eq.${encodeURIComponent(user.id)}`,
    {
      password_hash: passwordHash,
      expires_at: addHours(now, ADMIN_ACCESS_HOURS).toISOString(),
    },
  );

  await supabasePatch(
    `auth_sessions?user_id=eq.${encodeURIComponent(user.id)}&revoked_at=is.null`,
    { revoked_at: now.toISOString() },
  );

  return { ok: true };
}

export async function logoutByCookie(cookieHeader: string | null) {
  const token = getCookie(cookieHeader, SESSION_COOKIE);
  if (!token) {
    return;
  }

  const tokenHash = await hashSecret(`session:${token}`);
  await supabasePatch(
    `auth_sessions?token_hash=eq.${encodeURIComponent(tokenHash)}&revoked_at=is.null`,
    { revoked_at: new Date().toISOString() },
  );
}

export function sessionCookie(token: string, req?: { headers?: Record<string, string | string[] | undefined> }) {
  const secure = isSecureRequest(req);
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export function authJson(res: any, statusCode: number, payload: Record<string, unknown>) {
  return res.status(statusCode).json(payload);
}

export function authErrorResponse(res: any, error: unknown) {
  if (error instanceof AuthError) {
    return authJson(res, error.statusCode, { error: error.message });
  }

  console.error('Erro de autenticação:', error);
  return authJson(res, 500, { error: 'Não foi possível validar o acesso agora.' });
}

async function createSession(userId: string, userAgentSeed: string) {
  const now = new Date();
  const expiresAt = addHours(now, ACCESS_HOURS).toISOString();

  await supabasePatch(
    `auth_sessions?user_id=eq.${encodeURIComponent(userId)}&revoked_at=is.null`,
    { revoked_at: now.toISOString() },
  );

  const token = randomToken();
  const tokenHash = await hashSecret(`session:${token}`);

  await supabasePost('auth_sessions', {
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent_hint: await hashSecret(`agent:${userAgentSeed}`).then((value) => value.slice(0, 24)),
  });

  return token;
}

async function supabaseGet<T>(path: string): Promise<T> {
  return supabaseFetch<T>(path, { method: 'GET' });
}

async function supabasePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return supabaseFetch<T>(path, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
}

async function supabasePatch(path: string, body: Record<string, unknown>) {
  return supabaseFetch(path, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabaseUrl = requireEnv('SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Erro no Supabase.';
    throw new AuthError(message, response.status);
  }

  return payload as T;
}

async function hashSecret(value: string) {
  const pepper = requireEnv('AUTH_PEPPER');
  const data = new TextEncoder().encode(`${pepper}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return '';
  }

  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCode(value: string) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function isAdminEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const adminEmails = String(process.env.AUTH_ADMIN_EMAILS || '')
    .split(/[,\s;]+/)
    .map(normalizeEmail)
    .filter(Boolean);

  return adminEmails.includes(normalizedEmail);
}

function assertEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError('Informe um e-mail válido.');
  }
}

function assertPassword(password: string) {
  if (password.length < 8) {
    throw new AuthError('A senha precisa ter pelo menos 8 caracteres.');
  }
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new AuthError(`Configuração ausente: ${name}.`, 500);
  }
  return value;
}

function isSecureRequest(req?: { headers?: Record<string, string | string[] | undefined> }) {
  const hostHeader = req?.headers?.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (host?.startsWith('localhost') || host?.startsWith('127.0.0.1')) {
    return false;
  }
  return true;
}

import { next } from '@vercel/functions';
import { isPublicAuthPath, validateSessionFromCookie } from './lib/auth';

export const config = {
  matcher: '/(.*)',
  runtime: 'nodejs',
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (isPublicAuthPath(url.pathname) || url.pathname.startsWith('/_vercel/')) {
    return next();
  }

  try {
    const validSession = await validateSessionFromCookie(request.headers.get('cookie'));
    if (validSession) {
      return next();
    }
  } catch (error) {
    console.error('Erro na proteção do site:', error);
    return new Response('Acesso privado ainda em configuração.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Acesso privado. Faça login para continuar.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const loginUrl = new URL('/login.html', request.url);
  loginUrl.searchParams.set('next', `${url.pathname}${url.search}`);
  return Response.redirect(loginUrl, 302);
}

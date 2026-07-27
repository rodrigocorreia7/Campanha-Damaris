# Acesso privado da apresentação

Este projeto bloqueia o site inteiro e o assistente virtual. Quem não tiver uma sessão válida é redirecionado para `login.html`.

## 1. Criar as tabelas no Supabase

No painel do Supabase, abra **SQL Editor** e execute o conteúdo de:

```text
supabase/schema.sql
```

As tabelas ficam com RLS ativo e sem policies públicas. Só as funções do Vercel usam a `service_role`.

## 2. Gerar os convites

No computador, rode:

```bash
node scripts/generate-invites.mjs --count=10 --hours=48
```

O comando mostra:

- `AUTH_PEPPER`, que deve ir para as variáveis de ambiente do Vercel.
- Os 10 códigos de convite, que ficam somente com você.
- O SQL para inserir os convites no Supabase.

Guarde esse resultado em local privado e não suba para o GitHub.

## 3. Configurar variáveis no Vercel

Em **Project Settings > Environment Variables**, crie:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AUTH_PEPPER
GEMINI_API_KEY
GEMINI_MODEL
```

Depois faça um novo deploy.

## 4. Como o acesso funciona

- Primeiro acesso: pessoa informa código, nome, e-mail e cria uma senha.
- Cada código é de uso único.
- O acesso do usuário expira em 48 horas.
- Se o mesmo e-mail entrar em outro navegador, a sessão anterior é revogada automaticamente.
- O endpoint `/api/chat` também exige sessão válida.

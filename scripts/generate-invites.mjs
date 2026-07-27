import { createHash, randomBytes } from 'node:crypto';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const count = Number(args.get('count') || 10);
const hours = Number(args.get('hours') || 48);
const pepper = process.env.AUTH_PEPPER || randomBytes(32).toString('hex');

if (!Number.isInteger(count) || count < 1 || count > 100) {
  throw new Error('Use --count=10, entre 1 e 100.');
}

if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
  throw new Error('Use --hours=48, entre 1 e 720.');
}

const codes = Array.from({ length: count }, (_, index) => {
  const raw = randomBytes(5).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const code = `DAMARIS-${raw}`;
  return {
    label: `Convite ${String(index + 1).padStart(2, '0')}`,
    code,
    hash: hashSecret(`invite:${code}`),
  };
});

console.log('GUARDE ESTE ARQUIVO EM LOCAL PRIVADO. NAO SUBA PARA O GITHUB.');
console.log('');
console.log(`AUTH_PEPPER=${pepper}`);
console.log('');
console.log(`Codigos de convite (${count}) - expiram ${hours}h depois de inserir no Supabase:`);
codes.forEach((item) => {
  console.log(`${item.label}: ${item.code}`);
});
console.log('');
console.log('SQL para inserir no Supabase depois de executar supabase/schema.sql:');
console.log('begin;');
codes.forEach((item) => {
  console.log(
    `insert into public.auth_invites (code_hash, label, max_uses, expires_at) values ('${item.hash}', '${item.label}', 1, now() + interval '${hours} hours');`,
  );
});
console.log('commit;');

function hashSecret(value) {
  return createHash('sha256').update(`${pepper}:${value}`).digest('hex');
}

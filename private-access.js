(function () {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Sair';
  button.setAttribute('aria-label', 'Sair da apresentação privada');
  button.style.cssText = [
    'position:fixed',
    'right:16px',
    'bottom:16px',
    'z-index:99999',
    'border:1px solid rgba(255,201,60,.55)',
    'border-radius:999px',
    'padding:10px 16px',
    'background:#1c0a2a',
    'color:#ffe01b',
    'font:800 13px Inter,system-ui,sans-serif',
    'box-shadow:0 10px 26px rgba(0,0,0,.28)',
    'cursor:pointer',
  ].join(';');

  button.addEventListener('click', async () => {
    button.disabled = true;
    await fetch('/api/auth-logout', { method: 'POST' }).catch(() => null);
    window.location.assign('/login.html');
  });

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(button));
})();

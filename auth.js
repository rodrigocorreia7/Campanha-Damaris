const statusEl = document.querySelector('#auth-status');
const tabs = Array.from(document.querySelectorAll('[data-auth-tab]'));
const forms = {
  login: document.querySelector('#login-form'),
  register: document.querySelector('#register-form'),
  reset: document.querySelector('#reset-form'),
};

const nextUrl = new URLSearchParams(window.location.search).get('next') || '/';

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setMode(tab.dataset.authTab);
  });
});

forms.login.addEventListener('submit', (event) => {
  event.preventDefault();
  submitAuth('/api/auth-login', forms.login);
});

forms.register.addEventListener('submit', (event) => {
  event.preventDefault();
  submitAuth('/api/auth-register', forms.register);
});

forms.reset.addEventListener('submit', (event) => {
  event.preventDefault();
  submitAuth('/api/auth-reset-password', forms.reset, {
    redirect: false,
    successMessage: 'Senha redefinida. Agora entre com sua nova senha.',
    nextMode: 'login',
  });
});

document.querySelectorAll('[data-toggle-password]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const field = toggle.closest('.password-field')?.querySelector('input');
    if (!field) return;

    const showPassword = field.type === 'password';
    field.type = showPassword ? 'text' : 'password';
    toggle.textContent = showPassword ? 'Ocultar' : 'Ver';
    toggle.setAttribute('aria-label', showPassword ? 'Ocultar senha' : 'Mostrar senha');
  });
});

async function submitAuth(endpoint, form, options = {}) {
  const button = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  button.disabled = true;
  setStatus('Validando acesso...', false);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Não foi possível liberar o acesso.');
    }

    if (options.nextMode) {
      setMode(options.nextMode);
    }
    setStatus(options.successMessage || 'Acesso liberado. Abrindo a apresentacao...', false);
    if (options.redirect !== false) {
      window.location.assign(nextUrl);
    }
  } catch (error) {
    const message = error instanceof TypeError && error.message === 'Failed to fetch'
      ? 'Não foi possível conectar agora. Aguarde o deploy terminar e tente novamente.'
      : error.message;
    setStatus(message, true);
  } finally {
    button.disabled = false;
  }
}

function setMode(mode) {
  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.authTab === mode);
  });

  Object.entries(forms).forEach(([name, form]) => {
    form.classList.toggle('is-active', name === mode);
  });

  setStatus('', false);
}

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', Boolean(isError));
}

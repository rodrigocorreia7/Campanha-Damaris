const statusEl = document.querySelector('#auth-status');
const tabs = Array.from(document.querySelectorAll('[data-auth-tab]'));
const forms = {
  login: document.querySelector('#login-form'),
  register: document.querySelector('#register-form'),
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

async function submitAuth(endpoint, form) {
  const button = form.querySelector('button');
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

    setStatus('Acesso liberado. Abrindo a apresentação...', false);
    window.location.assign(nextUrl);
  } catch (error) {
    setStatus(error.message, true);
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

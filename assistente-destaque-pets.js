(function () {
  const promptText = 'O que a Dra. Damaris Moura fez pelos pets e cães em São Miguel Paulista?';

  const css = `
    .pets-assistant-highlight {
      width: 100%;
      border: 1px solid rgba(255, 201, 60, 0.55);
      background:
        radial-gradient(circle at top right, rgba(255, 224, 27, 0.18), transparent 38%),
        linear-gradient(135deg, rgba(75, 29, 106, 0.95), rgba(28, 10, 42, 0.96));
      color: #fff;
      border-radius: 18px;
      padding: 16px;
      margin: 0 0 16px;
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
      text-align: left;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .pets-assistant-highlight:hover {
      transform: translateY(-2px);
      border-color: #ffe01b;
      box-shadow: 0 22px 46px rgba(255, 201, 60, 0.18);
    }

    .pets-assistant-highlight__tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #1c0a2a;
      background: linear-gradient(135deg, #ffe01b, #ffc93c);
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 11px;
      line-height: 1;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 10px;
    }

    .pets-assistant-highlight__title {
      display: block;
      color: #ffe01b;
      font-size: 16px;
      line-height: 1.18;
      font-weight: 900;
      margin-bottom: 8px;
    }

    .pets-assistant-highlight__text {
      display: block;
      color: rgba(255, 255, 255, 0.86);
      font-size: 12px;
      line-height: 1.55;
      margin-bottom: 12px;
    }

    .pets-assistant-highlight__meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .pets-assistant-highlight__meta span {
      border: 1px solid rgba(255, 201, 60, 0.22);
      background: rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 8px;
      color: #ffe01b;
      font-size: 11px;
      font-weight: 850;
      text-align: center;
    }

    .pets-assistant-chip {
      position: fixed;
      left: 14px;
      bottom: 14px;
      z-index: 99990;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: calc(100vw - 28px);
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: linear-gradient(135deg, #ffe01b, #ffc93c);
      color: #1c0a2a;
      border-radius: 999px;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 950;
      box-shadow: 0 14px 32px rgba(255, 201, 60, 0.28);
      cursor: pointer;
    }

    @media (min-width: 1024px) {
      .pets-assistant-chip {
        display: none;
      }
    }
  `;

  function addStyles() {
    if (document.getElementById('pets-assistant-highlight-style')) return;
    const style = document.createElement('style');
    style.id = 'pets-assistant-highlight-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function askAboutPets() {
    const input = document.querySelector('input[type="text"], textarea');
    if (!input) {
      navigator.clipboard?.writeText(promptText).catch(function () {});
      return;
    }

    input.focus();
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
    if (setter) {
      setter.call(input, promptText);
    } else {
      input.value = promptText;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function buildHighlight() {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pets-assistant-highlight';
    card.setAttribute('aria-label', 'Perguntar sobre o Hospital Veterinário Cão Caramelo');
    card.innerHTML = `
      <span class="pets-assistant-highlight__tag">🐾 Causa animal em destaque</span>
      <strong class="pets-assistant-highlight__title">Hospital Veterinário Cão Caramelo</strong>
      <span class="pets-assistant-highlight__text">
        Conquista para pets e tutores de São Miguel Paulista: atendimento gratuito para cães e gatos de famílias no CadÚnico.
      </span>
      <span class="pets-assistant-highlight__meta">
        <span>4 mil atend./mês</span>
        <span>Zona Leste</span>
      </span>
    `;
    card.addEventListener('click', askAboutPets);
    return card;
  }

  function buildChip() {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'pets-assistant-chip';
    chip.innerHTML = '<span>🐾</span><span>Perguntar sobre o Hospital Cão Caramelo</span>';
    chip.addEventListener('click', askAboutPets);
    return chip;
  }

  function inject() {
    addStyles();

    if (!document.querySelector('.pets-assistant-highlight')) {
      const sidebar = document.querySelector('aside');
      const target =
        sidebar?.querySelector('.space-y-4') ||
        sidebar?.querySelector('[class*="space-y"]') ||
        sidebar;

      if (target) {
        target.prepend(buildHighlight());
      }
    }

    if (!document.querySelector('.pets-assistant-chip')) {
      document.body.appendChild(buildChip());
    }

    return Boolean(document.querySelector('.pets-assistant-highlight') || document.querySelector('.pets-assistant-chip'));
  }

  let tries = 0;
  const timer = window.setInterval(function () {
    tries += 1;
    if (inject() || tries > 60) {
      window.clearInterval(timer);
    }
  }, 250);
})();

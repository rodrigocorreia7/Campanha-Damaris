/* ==========================================================================
   LANDING PAGE DRA. DAMARIS MOURA - JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Efeito do Navbar ao Rolar
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 2. Menu Mobile Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(45, 16, 66, 0.98)';
        navLinks.style.padding = '1.5rem';
        navLinks.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
      }
    });
  }

  // 3. Filtro de Categoria nas Leis (O Que Fez)
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lawCards = document.querySelectorAll('.law-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-filter');

      lawCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. Tabs Interativas das Propostas (O Que Vai Fazer)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const proposalCard = document.querySelector('.proposal-content-card');

  const proposalsData = {
    lavida: {
      title: "Projeto LaVida: Rede de Proteção à Mulher",
      desc: "Ampliação estadual da rede integrada de acolhimento e suporte a vítimas de violência doméstica, combinando apoio psicológico, orientação jurídica de urgência e sigilo absoluto de dados familiares.",
      highlights: [
        "Acolhimento humanizado em até 24 horas nas principais regiões de SP",
        "Garantia de sigilo de dados em cadastros públicos para mulheres ameaçadas (PL 386/2020)",
        "Integração com Centros de Referência de Assistência Social (CRAS) e DEAMs"
      ],
      badge: "PL 269/2020 — PROTEÇÃO SOCIAL",
      image: "chrome_5lATTZL8xQ.jpg"
    },
    empreendedorismo: {
      title: "Autonomia Financeira & Empreendedorismo Feminino",
      desc: "Como coordenadora da Frente Parlamentar na Alesp, a Dra. Damaris atua para gerar autonomia econômica às mulheres como principal ferramenta de rompimento de ciclos de dependência e violência.",
      highlights: [
        "Capacitação técnica e cursos executivos gratuitos em gestão e finanças",
        "Acesso facilitado a linhas de microcrédito orientado pelo Banco do Povo",
        "Incentivos fiscais para empresas paulistas que contratarem mulheres vulneráveis"
      ],
      badge: "FRENTE PARLAMENTAR DA ALESP",
      image: "chrome_hCTNmzjjSa.jpg"
    },
    liberdade: {
      title: "Programa Intolerância Zero & Liberdade de Fé",
      desc: "Fortalecimento do Código Estadual de Liberdade Religiosa (Lei 17.346/2021) com foco em educação preventiva nas escolas públicas e proteção a todas as manifestações de fé.",
      highlights: [
        "Educação em Direitos Humanos e respeito inter-religioso em salas de aula (PL 615/2022)",
        "Atendimento e canal direto para denúncias de discriminação religiosa no Estado",
        "Apoio institucional a projetos sociais mantidos por entidades religiosas e voluntários"
      ],
      badge: "LEI 17.346/2021 — DIREITOS FUNDAMENTAIS",
      image: "chrome_56F0Z2t69X.jpg"
    },
    idosos: {
      title: "Inclusão Digital para Idosos & Proteção Infantil",
      desc: "Capacitação tecnológica para a terceira idade visando proteção contra golpes e fraudes financeiras, aliada à infraestrutura humanizada para crianças em delegacias.",
      highlights: [
        "Oficinas gratuitas de cidadania digital e segurança financeira para idosos (PL 314/2022)",
        "Espaços lúdicos e acolhimento psicológico de crianças em delegacias (PL 635/2022)",
        "Capacitação continuada de professores para combate ao abuso infantil nas escolas (Lei 17.337/2021)"
      ],
      badge: "PL 314/2022 & PL 635/2022",
      image: "chrome_RJmlrg2KwX.jpg"
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-tab');
      const data = proposalsData[target];

      if (data && proposalCard) {
        proposalCard.style.opacity = '0';
        proposalCard.style.transform = 'translateY(10px)';

        setTimeout(() => {
          proposalCard.querySelector('h3').textContent = data.title;
          proposalCard.querySelector('.proposal-desc').textContent = data.desc;

          const listHtml = data.highlights.map(item => `
            <li><i class="fas fa-check-circle"></i> <span>${item}</span></li>
          `).join('');
          proposalCard.querySelector('.proposal-highlights').innerHTML = listHtml;

          proposalCard.querySelector('.section-tag').textContent = data.badge;

          const imgEl = proposalCard.querySelector('.proposal-image-block img');
          if (imgEl && data.image) {
            imgEl.src = data.image;
            imgEl.alt = data.title;
          }

          proposalCard.style.opacity = '1';
          proposalCard.style.transform = 'translateY(0)';
        }, 200);
      }
    });
  });

  // 5. Lightbox Modal da Galeria de Fotos
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img && lightboxModal && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Foto da Campanha';
        lightboxModal.classList.add('active');
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
      }
    });
  }

  // 6. Validação do Formulário de Voluntariado
  const joinForm = document.getElementById('join-form');
  if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const lgpd = document.getElementById('lgpd-consent').checked;

      if (!name || !phone) {
        alert('Por favor, preencha seu nome e telefone.');
        return;
      }

      if (!lgpd) {
        alert('Por favor, aceite os termos de consentimento da LGPD para receber as novidades.');
        return;
      }

      // Sucesso
      alert(`Muito obrigado, ${name}! Seu cadastro foi recebido com sucesso. Em breve a equipe da Dra. Damaris Moura entrará em contato pelo WhatsApp!`);
      joinForm.reset();
    });
  }
});

// Animação FadeIn simples para inserção dinâmica
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

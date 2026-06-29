'use strict';

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupHeaderScroll();
  setupActiveNav();
  setupScrollReveal();
  setupBackToTop();
  setupContactForm();
  setupLegalToc();
  setYear();
});

/* ===== Menu mobile (burger) ===== */
function setupMobileMenu() {
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.main-nav');
  if (!burger || !nav) return;

  const toggle = (open) => {
    const isOpen = open ?? !nav.classList.contains('open');
    nav.classList.toggle('open', isOpen);
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  };

  burger.addEventListener('click', () => toggle());

  // Ferme le menu après un clic sur un lien
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggle(false));
  });

  // Ferme avec la touche Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
  });
}

/* ===== Ombre du header au défilement ===== */
function setupHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ===== Lien de navigation actif selon la section visible ===== */
function setupActiveNav() {
  const links = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  const map = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, link);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        map.get(entry.target)?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  map.forEach((_, section) => observer.observe(section));
}

/* ===== Apparition au défilement ===== */
function setupScrollReveal() {
  const targets = document.querySelectorAll('.card, .fleet-card, .feature-list li, .section-head, .avantages-card, .contact-form');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${(i % 4) * 80}ms`;
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

/* ===== Bouton retour en haut ===== */
function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const onScroll = () => btn.classList.toggle('show', window.scrollY > 600);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===== Validation et envoi du formulaire ===== */
function setupContactForm() {
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  if (!form) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Veuillez indiquer votre nom.'),
    email: (v) => (emailRegex.test(v.trim()) ? '' : 'Adresse e-mail invalide.'),
    message: (v) => (v.trim().length >= 10 ? '' : 'Votre message doit faire au moins 10 caractères.'),
  };

  const setError = (field, msg) => {
    field.classList.toggle('invalid', Boolean(msg));
    field.setAttribute('aria-invalid', String(Boolean(msg)));
    let el = field.parentElement.querySelector('.field-error');
    if (!el) {
      el = document.createElement('span');
      el.className = 'field-error';
      field.parentElement.appendChild(el);
    }
    el.textContent = msg;
  };

  // Validation en direct après la première saisie
  Object.keys(validators).forEach((name) => {
    const field = form.elements[name];
    if (field) {
      field.addEventListener('blur', () => setError(field, validators[name](field.value)));
      field.addEventListener('input', () => {
        if (field.classList.contains('invalid')) setError(field, validators[name](field.value));
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid = null;

    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      if (!field) return;
      const msg = validators[name](field.value);
      setError(field, msg);
      if (msg && !firstInvalid) firstInvalid = field;
    });

    const consent = form.elements['consent'];
    if (consent && !consent.checked) {
      showFeedback(feedback, 'Merci d\'accepter d\'être recontacté.', 'error');
      if (!firstInvalid) consent.focus();
      return;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      showFeedback(feedback, 'Veuillez corriger les champs en rouge.', 'error');
      return;
    }

    submitForm(form, feedback);
  });
}

function submitForm(form, feedback) {
  const button = form.querySelector('button[type="submit"]');
  const original = button ? button.textContent : '';
  const config = window.NACELPRO_CONFIG || { contactEmail: 'contact@nacelpro.fr' };

  if (form.elements._honey?.value) {
    showFeedback(feedback, 'Merci ! Votre demande a bien été envoyée.', 'success');
    form.reset();
    return;
  }

  if (button) {
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Envoi en cours…';
  }

  const need = form.elements.need?.value || '';
  const company = form.elements.company?.value || '';
  const phone = form.elements.phone?.value || '';
  const body = [
    form.elements.message.value,
    need && `\n\nBesoin : ${need}`,
    company && `\nSociété : ${company}`,
    phone && `\nTéléphone : ${phone}`,
  ].filter(Boolean).join('');

  const payload = {
    name: form.elements.name.value,
    email: form.elements.email.value,
    message: body,
    _subject: config.formSubject || 'Nouvelle demande — NacelPro',
    _template: 'table',
    _captcha: 'false',
  };

  fetch(`https://formsubmit.co/ajax/${encodeURIComponent(config.contactEmail)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) throw new Error('Échec envoi');
      form.reset();
      form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
      form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
      showFeedback(feedback, 'Merci ! Votre message a bien été envoyé. Nous vous répondons dans les meilleurs délais.', 'success');
    })
    .catch(() => {
      showFeedback(feedback, 'L\'envoi a échoué. Veuillez réessayer ou nous écrire directement à contact@nacelpro.fr.', 'error');
    })
    .finally(() => {
      if (button) {
        button.removeAttribute('aria-busy');
        button.textContent = original;
      }
    });
}

function showFeedback(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.className = `form-feedback ${type}`;
}

/* ===== Année dynamique dans le footer ===== */
function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ===== Sommaire actif sur la page légale ===== */
function setupLegalToc() {
  const tocLinks = document.querySelectorAll('.legal-toc a[href^="#"]');
  if (!tocLinks.length || !('IntersectionObserver' in window)) return;

  const sections = Array.from(tocLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        tocLinks.forEach((l) => l.classList.remove('active'));
        const active = document.querySelector(`.legal-toc a[href="#${entry.target.id}"]`);
        active?.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach((section) => observer.observe(section));
}

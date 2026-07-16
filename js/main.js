'use strict';

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupHeaderScroll();
  setupActiveNav();
  setupScrollReveal();
  setupBackToTop();
  setupContactForm();
  setupLegalToc();
  setupWhatsApp();
  setupPhone();
  setupGalleryCarousel();
  setupGalleryLightbox();
  setYear();
});

/* ===== Menu mobile (burger) ===== */
function setupMobileMenu() {
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.main-nav');
  const backdrop = document.getElementById('navBackdrop');
  const header = document.querySelector('.site-header');
  if (!burger || !nav) return;

  const toggle = (open) => {
    const isOpen = open ?? !nav.classList.contains('open');
    nav.classList.toggle('open', isOpen);
    burger.classList.toggle('open', isOpen);
    backdrop?.classList.toggle('show', isOpen);
    header?.classList.toggle('menu-is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    backdrop?.setAttribute('aria-hidden', String(!isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  };

  burger.addEventListener('click', () => toggle());
  backdrop?.addEventListener('click', () => toggle(false));

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggle(false));
  });

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
  const links = Array.from(document.querySelectorAll('.main-nav-links a[href^="#"], .main-nav a[href^="#"]:not(.main-nav-cta)'));
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
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const selectors = [
    '.hero-content > *',
    '.strength-card',
    '.section-head > *',
    '.service-card',
    '.materiel-card',
    '.partner-card',
    '.review-card',
    '.gallery-item',
    '.contact-intro > *',
    '.contact-details > li',
    '.contact-map',
    '.contact-form',
    '.contact-actions',
    '.section-cta',
    '.footer-brand',
    '.footer-col',
    '.legal-hero .container > *',
    '.legal-content section > h2',
    '.legal-content section > p',
  ].join(', ');

  const items = document.querySelectorAll(selectors);
  if (!items.length) return;

  const markVisible = (el, delay = 0) => {
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.classList.add('visible');
  };

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => markVisible(el));
    return;
  }

  const itemObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const scope = el.closest('section, .hero-content, .contact-layout, .contact-info, .strengths-grid, .services-grid, .materiel-grid, .partners-grid, .reviews-grid, .gallery-track') || el.parentElement;
      const group = scope ? Array.from(scope.querySelectorAll('.reveal')) : [el];
      const index = Math.max(0, group.indexOf(el));
      markVisible(el, Math.min(index * 80, 400));
      obs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  items.forEach((el) => {
    if (el.matches('.materiel-card, .gallery-item, .partner-card, .strength-card')) {
      el.classList.add('reveal', 'reveal--scale');
    } else {
      el.classList.add('reveal');
    }
    itemObserver.observe(el);
  });

  document.querySelectorAll('.hero-content > .reveal').forEach((el, i) => {
    itemObserver.unobserve(el);
    markVisible(el, 60 + i * 90);
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
  const config = window.SITE_CONFIG || window.NACELPRO_CONFIG || { contactEmail: 'contact@doubslevage.fr' };

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
    _subject: config.formSubject || 'Nouvelle demande — DOUBS LEVAGE',
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
      showFeedback(feedback, 'L\'envoi a échoué. Veuillez réessayer ou nous écrire directement à contact@doubslevage.fr.', 'error');
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

/* ===== Liens WhatsApp ===== */
function setupWhatsApp() {
  const config = window.SITE_CONFIG || window.NACELPRO_CONFIG || {};
  const num = String(config.whatsappNumber || '').replace(/\D/g, '');
  if (!num) {
    document.querySelectorAll('[data-whatsapp]').forEach((el) => el.classList.add('is-hidden'));
    return;
  }
  const text = encodeURIComponent(config.whatsappMessage || 'Bonjour, je souhaite vous contacter.');
  const url = `https://wa.me/${num}?text=${text}`;
  document.querySelectorAll('[data-whatsapp]').forEach((el) => {
    el.href = url;
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });
}

/* ===== Téléphone (config) ===== */
function setupPhone() {
  const config = window.SITE_CONFIG || window.NACELPRO_CONFIG || {};
  const phone = String(config.phone || '').trim();
  if (!phone) return;

  const digits = phone.replace(/\D/g, '');
  const tel = digits ? `tel:+${digits.startsWith('33') ? digits : `33${digits.replace(/^0/, '')}`}` : '#';

  document.querySelectorAll('[data-phone-row]').forEach((el) => el.classList.remove('is-hidden'));
  document.querySelectorAll('[data-phone-link]').forEach((el) => {
    el.classList.remove('is-hidden');
    el.href = tel;
    el.textContent = phone;
  });
}

/* ===== Carousel galerie ===== */
function setupGalleryCarousel() {
  const track = document.getElementById('galleryTrack');
  const prev = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  if (!track || !prev || !next) return;

  const getStep = () => {
    const item = track.querySelector('.gallery-item');
    if (!item) return track.clientWidth * 0.8;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 16;
    return item.getBoundingClientRect().width + gap;
  };

  const updateButtons = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };

  const scrollByDir = (dir) => {
    track.scrollBy({ left: dir * getStep(), behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByDir(-1));
  next.addEventListener('click', () => scrollByDir(1));
  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons, { passive: true });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByDir(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByDir(1);
    }
  });

  updateButtons();
}

/* ===== Lightbox galerie ===== */
function setupGalleryLightbox() {
  const lightbox = document.getElementById('lightbox');
  const track = document.getElementById('galleryTrack');
  if (!lightbox || !track) return;

  const items = Array.from(track.querySelectorAll('.gallery-item'));
  if (!items.length) return;

  const imgEl = document.getElementById('lightboxImg');
  const captionEl = document.getElementById('lightboxCaption');
  const counterEl = document.getElementById('lightboxCounter');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let lastFocus = null;

  const slides = items.map((btn) => {
    const img = btn.querySelector('img');
    return {
      src: img?.currentSrc || img?.src || '',
      alt: img?.alt || '',
    };
  });

  const showSlide = (i, animate = true) => {
    index = (i + slides.length) % slides.length;
    const slide = slides[index];
    const apply = () => {
      imgEl.src = slide.src;
      imgEl.alt = slide.alt;
      captionEl.textContent = slide.alt;
      counterEl.textContent = `${index + 1} / ${slides.length}`;
      imgEl.classList.remove('is-switching');
    };

    if (animate && !reduced) {
      imgEl.classList.add('is-switching');
      window.setTimeout(apply, 180);
    } else {
      apply();
    }
  };

  const open = (i) => {
    lastFocus = document.activeElement;
    showSlide(i, false);
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    lightbox.querySelector('.lightbox-close')?.focus();
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    window.setTimeout(() => {
      if (!lightbox.classList.contains('is-open')) lightbox.hidden = true;
    }, 320);
    lastFocus?.focus?.();
  };

  items.forEach((btn, i) => {
    btn.addEventListener('click', () => open(i));
  });

  lightbox.querySelectorAll('[data-lightbox-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => showSlide(index - 1));
  lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => showSlide(index + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') showSlide(index - 1);
    if (e.key === 'ArrowRight') showSlide(index + 1);
  });

  let touchX = null;
  lightbox.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
    if (Math.abs(dx) > 50) showSlide(dx > 0 ? index - 1 : index + 1);
    touchX = null;
  }, { passive: true });
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

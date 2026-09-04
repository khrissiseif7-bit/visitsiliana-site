// ===== Mobile menu =====
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    menuToggle.classList.toggle('open');
  });
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      menuToggle.classList.remove('open');
    });
  });
}

// ===== Dropdown =====
document.querySelectorAll('.has-dropdown').forEach(item => {
  const toggle = item.querySelector('.dropdown-toggle');
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      item.classList.toggle('open');
    });
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.has-dropdown')) {
    document.querySelectorAll('.has-dropdown').forEach(d => d.classList.remove('open'));
  }
});

// ===== Sticky header =====
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ===== Scroll reveal =====
// Active le masquage seulement si JS est là (sinon le contenu reste visible).
document.body.classList.add('anim-ready');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
} else {
  // Pas d'IntersectionObserver : tout afficher
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => el.classList.add('visible'));
}

// ===== Booking box (quantity + total + reservation link) =====
const qtyInput = document.getElementById('qty');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const priceEl = document.getElementById('basePrice');
const bookBtn = document.getElementById('bookBtn');

function updateTotal() {
  if (!priceEl || !qtyInput) return;
  const price = parseFloat(priceEl.dataset.price);
  const qty = Math.max(1, parseInt(qtyInput.value) || 1);
  const total = price * qty;
  const totalEl = document.getElementById('totalPrice');
  if (totalEl) totalEl.textContent = total + ' DT';
  // Mettre à jour le lien de réservation avec le contexte
  if (bookBtn) {
    const act = bookBtn.dataset.activity || '';
    const url = new URL(bookBtn.href, window.location.href);
    url.searchParams.set('activite', act);
    url.searchParams.set('personnes', qty);
    url.searchParams.set('total', total);
    bookBtn.href = url.pathname + url.search + url.hash;
  }
}

if (qtyInput && qtyMinus && qtyPlus) {
  qtyMinus.addEventListener('click', () => {
    const v = parseInt(qtyInput.value) || 1;
    if (v > 1) qtyInput.value = v - 1;
    updateTotal();
  });
  qtyPlus.addEventListener('click', () => {
    qtyInput.value = (parseInt(qtyInput.value) || 1) + 1;
    updateTotal();
  });
  qtyInput.addEventListener('input', updateTotal);
}
// Init au chargement
if (priceEl && qtyInput) updateTotal();

// ===== Contact form (FormSubmit AJAX) + préremplissage réservation =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  // Préremplir depuis les paramètres d'URL (flux de réservation)
  const params = new URLSearchParams(window.location.search);
  if (params.get('activite')) {
    const act = params.get('activite');
    const pers = params.get('personnes') || '1';
    const total = params.get('total') || '';
    const msg = contactForm.querySelector('[name="message"]');
    if (msg) {
      msg.value = `Bonjour, je souhaite réserver l'activité « ${act} » pour ${pers} personne(s)` +
                  (total ? ` (total estimé : ${total} DT)` : '') + `.\n\nMerci de me recontacter.`;
    }
    // Bandeau de confirmation de réservation
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#2d6a4f;color:#fff;padding:14px 20px;border-radius:12px;margin-bottom:20px;font-weight:600;';
    banner.textContent = `🗓️ Réservation : ${act} — ${pers} pers.` + (total ? ` — ${total} DT` : '');
    contactForm.prepend(banner);
    // Faire défiler vers le formulaire
    setTimeout(() => contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }

  // Init EmailJS si configuré
  const emCfg = window.EMAILJS_CONFIG;
  const emReady = emCfg && emCfg.publicKey && emCfg.publicKey !== 'A_REMPLIR' && typeof emailjs !== 'undefined';
  if (emReady) { try { emailjs.init({ publicKey: emCfg.publicKey }); } catch (e) { console.warn('EmailJS init:', e); } }

  const cLang = (typeof getLang === 'function') ? getLang() : 'fr';
  const ctr = (k, fb) => (typeof translations !== 'undefined' && translations[cLang] && translations[cLang][k]) || fb;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.getAttribute('data-original') || btn.textContent;

    // Piège anti-spam (honeypot) : si rempli, on ignore silencieusement
    const honey = contactForm.querySelector('[name="_honey"]');
    if (honey && honey.value) { contactForm.reset(); return; }

    const flash = (txt, color, keepDisabled) => {
      btn.textContent = txt; btn.style.background = color || '';
      if (!keepDisabled) setTimeout(() => { btn.textContent = original; btn.style.background = ''; btn.disabled = false; }, 4500);
    };

    if (!emReady) {
      flash('⚠️ ' + ctr('contact_error', 'Emailing non configuré'), '#ef4444');
      return;
    }

    const params = {
      name:    contactForm.querySelector('[name="name"]').value.trim(),
      email:   contactForm.querySelector('[name="email"]').value.trim(),
      phone:   contactForm.querySelector('[name="phone"]').value.trim(),
      message: contactForm.querySelector('[name="message"]').value.trim(),
      owner_email: emCfg.ownerEmail || 'contact@visitsiliana.com',
      date: new Date().toLocaleString(cLang === 'ar' ? 'ar' : (cLang === 'en' ? 'en-GB' : 'fr-FR'))
    };

    btn.disabled = true;
    btn.textContent = '⏳ ' + ctr('contact_sending', 'Envoi...');

    // Envoi des DEUX emails : au contact (templateOwner) + au visiteur (templateVisitor)
    Promise.all([
      emailjs.send(emCfg.serviceId, emCfg.templateOwner, params),
      emailjs.send(emCfg.serviceId, emCfg.templateVisitor, params)
    ])
    .then(() => {
      flash('✓ ' + ctr('contact_sent', 'Message envoyé !'), '#22c55e');
      contactForm.reset();
    })
    .catch((err) => {
      console.warn('EmailJS send:', err);
      flash('⚠️ ' + ctr('contact_error', 'Échec de l\'envoi. Réessayez.'), '#ef4444');
    });
  });
}

// ===== Gallery lightbox =====
document.querySelectorAll('.gallery-img').forEach(img => {
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `<div class="lightbox-inner"><img src="${img.src}" alt="${img.alt}"><button class="lightbox-close">✕</button></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lightbox-close')) overlay.remove();
    });
  });
});

// ============================================================
//  Système d'avis (reproduit le flux modéré de l'ancien site)
//  Stockage : Firebase Firestore, collection "reviews"
//  Doc : { activity, name, email, rating (1-5), text, status, createdAt }
//  - Envoi visiteur -> status "pending"
//  - Affichage : uniquement status "approved" (modération via console)
// ============================================================
(function () {
  const section = document.getElementById('reviews');
  if (!section) return;

  const activity = section.dataset.activity || '';
  const lang = (typeof getLang === 'function') ? getLang() : 'fr';
  const t = (k) => (typeof translations !== 'undefined' && translations[lang] && translations[lang][k]) || k;

  // --- Init Firebase (compat) si configuré ---
  let db = null;
  const cfg = window.FIREBASE_CONFIG;
  const configured = cfg && cfg.apiKey && cfg.apiKey !== 'A_REMPLIR';
  if (configured && typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      db = firebase.firestore();
    } catch (e) { console.warn('Firebase init:', e); }
  }

  // --- Helpers d'affichage ---
  function starHtml(rating, size) {
    let s = '<span class="stars"' + (size ? ' style="font-size:' + size + '"' : '') + '>';
    for (let i = 1; i <= 5; i++) {
      s += i <= Math.round(rating) ? '★' : '<span class="empty">★</span>';
    }
    return s + '</span>';
  }
  function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
  function fmtDate(ts) {
    try {
      const d = ts && ts.toDate ? ts.toDate() : new Date();
      return d.toLocaleDateString(lang === 'ar' ? 'ar' : (lang === 'en' ? 'en-GB' : 'fr-FR'),
        { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }

  const summaryEl = document.getElementById('reviewsSummary');
  const listEl = document.getElementById('reviewsList');

  function renderEmpty() {
    if (summaryEl) summaryEl.innerHTML = '';
    if (listEl) listEl.innerHTML = '<p class="reviews-empty">' + t('reviews_empty') + '</p>';
  }

  function renderReviews(reviews) {
    if (!reviews.length) { renderEmpty(); return; }
    reviews.sort((a, b) => {
      const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return tb - ta;
    });
    const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
    if (summaryEl) {
      summaryEl.innerHTML =
        '<span class="avg">' + avg.toFixed(1) + '</span>' +
        starHtml(avg) +
        '<span class="count">' + t('reviews_based') + ' ' + reviews.length + ' ' + t('reviews_count') + '</span>';
    }
    if (listEl) {
      listEl.innerHTML = reviews.map(r =>
        '<div class="review-card">' +
          '<div class="review-card-head">' +
            '<div class="review-author">' +
              '<div class="review-avatar">' + initials(r.name) + '</div>' +
              '<div><strong>' + escapeHtml(r.name || '') + '</strong>' +
              '<span class="review-date">' + fmtDate(r.createdAt) + '</span></div>' +
            '</div>' +
            starHtml(r.rating) +
          '</div>' +
          '<p class="review-text">' + escapeHtml(r.text || '') + '</p>' +
        '</div>'
      ).join('');
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // --- Charger les avis approuvés ---
  function loadReviews() {
    if (!db) { renderEmpty(); return; }
    db.collection('reviews')
      .where('activity', '==', activity)
      .where('status', '==', 'approved')
      .get()
      .then(snap => {
        const arr = [];
        snap.forEach(doc => arr.push(doc.data()));
        renderReviews(arr);
      })
      .catch(err => { console.warn('loadReviews:', err); renderEmpty(); });
  }
  loadReviews();

  // --- Modal ---
  const modal = document.getElementById('reviewModal');
  const openBtn = document.getElementById('openReview');
  const closeBtn = document.getElementById('closeReview');
  const form = document.getElementById('reviewForm');
  const msg = document.getElementById('reviewMsg');
  const starInput = document.getElementById('starInput');
  let chosen = 5;

  function setStars(n) {
    chosen = n;
    if (!starInput) return;
    starInput.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < n));
  }
  if (starInput) {
    starInput.querySelectorAll('.star').forEach((s, i) => {
      s.addEventListener('click', () => setStars(i + 1));
    });
    setStars(5);
  }

  if (openBtn) openBtn.addEventListener('click', () => { if (modal) { modal.hidden = false; if (msg) msg.textContent = ''; } });
  if (closeBtn) closeBtn.addEventListener('click', () => { if (modal) modal.hidden = true; });
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const text = (data.get('text') || '').toString().trim();
      if (!name || !email || !text) return;

      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      msg.className = 'review-msg';
      msg.textContent = '';

      if (!db) {
        msg.className = 'review-msg err';
        msg.textContent = t('reviews_error') + ' (Firebase non configuré)';
        return;
      }

      btn.disabled = true;
      btn.textContent = t('reviews_sending');
      db.collection('reviews').add({
        activity: activity,
        name: name.slice(0, 50),
        email: email.slice(0, 100),
        rating: chosen,
        text: text.slice(0, 700),
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        msg.className = 'review-msg ok';
        msg.textContent = t('reviews_thanks');
        form.reset();
        setStars(5);
        setTimeout(() => { if (modal) modal.hidden = true; }, 3500);
      }).catch((err) => {
        console.warn('addReview:', err);
        msg.className = 'review-msg err';
        msg.textContent = t('reviews_error');
      }).finally(() => {
        btn.disabled = false;
        btn.textContent = original;
      });
    });
  }
})();

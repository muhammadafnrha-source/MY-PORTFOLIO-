/* Afnan Portfolio — app logic. Defensive: every optional CDN is guarded so the page keeps working if it fails. */
(function () {
  'use strict';

  /* ---------- Theme (light default, persisted) ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  function applyTheme(preferDark) {
    root.setAttribute('data-theme', preferDark ? 'dark' : 'light');
    if (themeToggle) {
      themeToggle.innerHTML = preferDark ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
      themeToggle.setAttribute('aria-label', preferDark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.setAttribute('aria-pressed', String(preferDark));
    }
    try { localStorage.setItem('afnan-theme', preferDark ? 'dark' : 'light'); } catch (e) {}
  }
  try {
    var stored = localStorage.getItem('afnan-theme');
    if (stored) { applyTheme(stored === 'dark'); }
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) { applyTheme(true); }
  } catch (e) {}
  if (themeToggle) { themeToggle.addEventListener('click', function () { applyTheme(root.getAttribute('data-theme') !== 'dark'); }); }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('mobileMenu');
  var navLinks = document.getElementById('navLinks');
  function setMenu(open) {
    if (!menuBtn || !navLinks) return;
    menuBtn.classList.toggle('active', open);
    navLinks.classList.toggle('active', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!navLinks.classList.contains('active')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeModal(); } });
  }
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- Navbar + scroll spy (single rAF-throttled handler) ---------- */
  var navbar = document.getElementById('navbar');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var backToTop = document.getElementById('backToTop');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (navbar) { navbar.classList.toggle('scrolled', y > 40); }
    if (backToTop) { backToTop.classList.toggle('visible', y > 600); }
    var current = '';
    sections.forEach(function (section) {
      var top = section.offsetTop - 140;
      var bottom = top + section.offsetHeight;
      if (y >= top && y < bottom) { current = section.id; }
    });
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('href') === '#' + current);
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  if (backToTop) { backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

  /* ---------- ScrollReveal with fallback ---------- */
  if (window.ScrollReveal) {
    document.body.classList.add('has-scrollreveal');
    var sr = window.ScrollReveal({ origin: 'bottom', distance: '42px', duration: 850, delay: 120 });
    sr.reveal('.reveal');
    // sr adds its own classes; mark visible so our CSS does not hide content
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('sr-visible'); });
  }

  /* ---------- Animated skill bars ---------- */
  var bars = document.querySelectorAll('.progress');
  if ('IntersectionObserver' in window) {
    var barObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var w = entry.target.getAttribute('data-width') || '100';
          entry.target.style.width = w + '%';
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(function (b) { barObserver.observe(b); });
  } else {
    bars.forEach(function (b) { b.style.width = (b.getAttribute('data-width') || '100') + '%'; });
  }

  /* ---------- Project filtering ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var projectCards = document.querySelectorAll('.project-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      var filter = btn.getAttribute('data-filter');
      projectCards.forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- Project modal ---------- */
  var modal = document.getElementById('projectModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalCategory = document.getElementById('modalCategory');
  var modalBody = document.getElementById('modalBody');
  var modalStatus = document.getElementById('modalStatus');
  var modalClose = document.getElementById('modalClose');
  function closeModal() { if (modal) { modal.hidden = true; document.body.style.overflow = ''; } }
  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.project-card');
      if (!modal || !card) return;
      modalTitle.textContent = card.getAttribute('data-title') || 'Project';
      modalCategory.textContent = 'Category: ' + (card.querySelector('.project-tag') ? card.querySelector('.project-tag').textContent : '');
      modalBody.textContent = card.querySelector('.project-body p') ? card.querySelector('.project-body p').textContent : '';
      modalStatus.textContent = card.getAttribute('data-status') || '';
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (modalClose) modalClose.focus();
    });
  });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Service preselect (services + pricing CTAs) ---------- */
  document.querySelectorAll('[data-service]').forEach(function (link) {
    link.addEventListener('click', function () {
      var select = document.getElementById('service_type');
      if (select) { select.value = link.getAttribute('data-service'); }
    });
  });

  /* ---------- Dynamic year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---------- EmailJS + form ---------- */
  var EMAILJS_PUBLIC_KEY = '7a0QNc7kHUwDI12n4';
  var EMAILJS_SERVICE_ID = 'service_fonk68p';
  var EMAILJS_TEMPLATE_ID = 'template_rda2cva';

  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var submitBtn = document.getElementById('submitBtn');

  function setError(id, msg) {
    var el = document.getElementById(id);
    var input = el ? el.closest('.form-group').querySelector('input,select,textarea') : null;
    if (el) el.textContent = msg || '';
    if (input) { input.classList.toggle('invalid', !!msg); input.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
    return !msg;
  }
  function showStatus(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status ' + (ok ? 'success' : 'error');
    status.style.opacity = '1';
    setTimeout(function () { status.style.opacity = '0'; }, 6000);
  }
  function validate() {
    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var service = document.getElementById('service_type').value;
    var subject = document.getElementById('subject').value.trim();
    var message = document.getElementById('message').value.trim();
    var ok = true;
    if (name.length < 2) { setError('nameError', 'Please enter your full name (at least 2 characters).'); ok = false; } else { setError('nameError', ''); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('emailError', 'Please enter a valid email address.'); ok = false; } else { setError('emailError', ''); }
    if (!service) { setError('serviceError', 'Please select a service.'); ok = false; } else { setError('serviceError', ''); }
    if (subject.length < 3) { setError('subjectError', 'Please enter a subject (at least 3 characters).'); ok = false; } else { setError('subjectError', ''); }
    if (message.length < 10) { setError('messageError', 'Please write a message of at least 10 characters.'); ok = false; } else { setError('messageError', ''); }
    return ok;
  }

  if (form) {
    // Guarded EmailJS init — page still loads if the CDN is unreachable.
    if (window.emailjs && typeof window.emailjs.init === 'function') {
      try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) { console.warn('EmailJS init failed:', e); }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Honeypot spam check (client-side only — not a security boundary; server-side relay recommended for real protection).
      var website = document.getElementById('website');
      if (website && website.value.trim() !== '') { return; }
      if (!validate()) { showStatus('Please fix the highlighted fields and try again.', false); return; }

      var originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
      submitBtn.disabled = true;

      var templateParams = {
        from_name: document.getElementById('name').value.trim(),
        reply_to: document.getElementById('email').value.trim(),
        service: document.getElementById('service_type').value,
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim()
      };

      function done(ok) {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
        if (ok) {
          showStatus('Message sent successfully! We will get back to you soon.', true);
          form.reset();
        } else {
          showStatus('Failed to send message. Please try again or email me directly.', false);
        }
      }

      if (window.emailjs && typeof window.emailjs.send === 'function') {
        window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          .then(function () { done(true); }, function (err) { console.error('EmailJS Error:', err); done(false); });
      } else {
        // EmailJS CDN unavailable — surface an actionable error instead of breaking silently.
        showStatus('Email service is currently unavailable. Please email muhammadafnrha@gmail.com or message on WhatsApp.', false);
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
      }
    });
    // Live-clear errors as the user types
    form.querySelectorAll('input,select,textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        var err = field.closest('.form-group') ? field.closest('.form-group').querySelector('.field-error') : null;
        if (err) err.textContent = '';
        field.classList.remove('invalid');
      });
    });
  }
})();

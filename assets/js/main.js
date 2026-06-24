/* Harsha Packers and Movers - interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var WHATSAPP = (window.HARSHA && window.HARSHA.whatsapp) || '919035291929';

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var body = document.body;
  function collapseDrops() {
    document.querySelectorAll('.nav__item--has-drop.open').forEach(function (o) { o.classList.remove('open'); });
  }
  function closeMenu() {
    body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    collapseDrops();
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) collapseDrops();
    });
  }

  var navClose = document.querySelector('.nav-close');
  if (navClose) navClose.addEventListener('click', closeMenu);

  /* Close menu when a real link (not a dropdown toggle) is tapped */
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.parentElement.classList.contains('nav__item--has-drop') && window.innerWidth <= 992) return;
      closeMenu();
    });
  });

  /* Clear mobile menu state when resizing up to desktop */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 992) body.classList.remove('nav-open');
  });

  /* Mobile dropdown expanders (accordion: only one open at a time keeps the menu compact) */
  document.querySelectorAll('.nav__item--has-drop > .nav__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 992) {
        e.preventDefault();
        var item = link.parentElement;
        var willOpen = !item.classList.contains('open');
        document.querySelectorAll('.nav__item--has-drop.open').forEach(function (o) {
          if (o !== item) o.classList.remove('open');
        });
        item.classList.toggle('open', willOpen);
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement;
      var ans = item.querySelector('.faq__a');
      var isOpen = item.classList.contains('open');
      // close siblings
      var parent = item.closest('.faq');
      if (parent) parent.querySelectorAll('.faq__item.open').forEach(function (o) {
        if (o !== item) { o.classList.remove('open'); o.querySelector('.faq__a').style.maxHeight = null; }
      });
      item.classList.toggle('open');
      ans.style.maxHeight = isOpen ? null : ans.scrollHeight + 'px';
    });
  });

  /* ---------- Scroll reveal ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Quote form (submits to WhatsApp + email backup) ---------- */
  document.querySelectorAll('form[data-quote-form]').forEach(function (form) {
    var endpoint = form.getAttribute('action') || '/submit.php';

    function setError(field, on) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.toggle('field--error', on);
    }

    function radioChecked(name) {
      var grp = form.querySelectorAll('input[name="' + name + '"]');
      var ok = false;
      grp.forEach(function (r) { if (r.checked) ok = true; });
      return ok;
    }

    function validateScope(scope) {
      var ok = true;
      scope.querySelectorAll('[required]').forEach(function (f) {
        var bad;
        if (f.type === 'radio') {
          bad = !radioChecked(f.name);
        } else {
          var val = (f.value || '').trim();
          bad = !val;
          if (f.type === 'tel') bad = !/^[+]?[0-9\s-]{10,15}$/.test(val);
          if (f.type === 'email' && val) bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
        }
        setError(f, bad);
        if (bad) ok = false;
      });
      return ok;
    }
    function validate() { return validateScope(form); }

    form.querySelectorAll('input:not([type=radio]), textarea, select').forEach(function (f) {
      f.addEventListener('blur', function () { if (f.hasAttribute('required')) setError(f, !(f.value || '').trim()); });
    });
    form.querySelectorAll('.seg input[type=radio]').forEach(function (r) {
      r.addEventListener('change', function () { setError(r, false); });
    });

    function line(label, val) { return val ? label + ': ' + val + '\n' : ''; }

    function buildWhatsAppText(d, vehicles) {
      var t = '*New Moving Enquiry - Harsha Packers*\n\n';
      t += line('Name', d.name);
      t += line('WhatsApp', d.phone);
      t += '\n';
      var from = d.moving_from || '';
      if (from && (d.floor_from || d.lift_from)) from += ' (Floor: ' + (d.floor_from || '-') + ', Lift: ' + (d.lift_from || '-') + ')';
      var to = d.moving_to || '';
      if (to && (d.floor_to || d.lift_to)) to += ' (Floor: ' + (d.floor_to || '-') + ', Lift: ' + (d.lift_to || '-') + ')';
      t += line('Moving From', from);
      t += line('Moving To', to);
      t += line('Shifting Date', d.move_date);
      t += line('Property', d.bhk);
      t += '\n';
      t += line('Big Items', d.big_items);
      if (vehicles && vehicles.length) t += line('Vehicles', vehicles.join(', '));
      t += line('Carton Boxes', d.boxes);
      t += line('Notes', d.notes);
      if (d.page_url) t += '\n' + d.page_url;
      return encodeURIComponent(t);
    }

    var formStarted = false;
    form.addEventListener('focusin', function () {
      if (formStarted) return; formStarted = true;
      if (typeof window.gtag === 'function') window.gtag('event', 'form_start', { event_category: 'engagement', form_id: form.id || 'quote' });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pu = form.querySelector('[name="page_url"]');
      if (pu && !pu.value) pu.value = window.location.href;
      if (!validate()) {
        var firstErr = form.querySelector('.field--error input, .field--error textarea, .field--error select');
        if (firstErr) { if (form._wizShowFor) form._wizShowFor(firstErr); try { firstErr.focus(); } catch (e0) {} }
        return;
      }
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { if (k !== 'vehicle') data[k] = v; });
      var vehicles = fd.getAll('vehicle');

      var waUrl = 'https://wa.me/' + WHATSAPP + '?text=' + buildWhatsAppText(data, vehicles);

      // set the success-screen fallback link to the same prefilled message
      var fb = form.querySelector('[data-wa-fallback]');
      if (fb) fb.href = waUrl;

      // open WhatsApp (primary action, kept inside the user gesture)
      window.open(waUrl, '_blank');

      // email copy to the office (non-blocking). Prefer Web3Forms (no server needed);
      // fall back to the PHP handler if a Web3Forms key isn't configured.
      var web3 = (window.HARSHA && window.HARSHA.web3) || '';
      if (web3 && web3.indexOf('REPLACE') === -1) {
        fd.append('access_key', web3);
        fd.append('subject', 'New Moving Enquiry: ' + (data.name || '') + ' (' + (data.phone || '') + ')');
        fd.append('from_name', 'Harsha Packers Website');
        try { fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd }).catch(function () {}); } catch (err) {}
      } else {
        try { fetch(endpoint, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'fetch' } }).catch(function () {}); } catch (err) {}
      }

      form.classList.add('sent');
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: 'whatsapp' });
      if (typeof window.gtag === 'function' && window.HARSHA && window.HARSHA.adsId) window.gtag('event', 'conversion', { send_to: window.HARSHA.adsId + (window.HARSHA.adsLabel ? '/' + window.HARSHA.adsLabel : '') });
      try { form.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err2) {}
    });

    /* ---- Multi-step wizard (progressive enhancement; degrades to one form without JS) ---- */
    if (form.hasAttribute('data-wizard')) {
      var steps = [].slice.call(form.querySelectorAll('.qstep'));
      if (steps.length > 1) {
        var fill = form.querySelector('[data-wiz-fill]');
        var curEl = form.querySelector('[data-wiz-cur]');
        var totEl = form.querySelector('[data-wiz-total]');
        var lblEl = form.querySelector('[data-wiz-label]');
        var backBtn = form.querySelector('[data-wiz-back]');
        var nextBtn = form.querySelector('[data-wiz-next]');
        var subBtn = form.querySelector('[data-wiz-submit]');
        var idx = 0;
        form.classList.add('is-wizard');
        if (totEl) totEl.textContent = steps.length;
        var showStep = function (i, focus) {
          idx = Math.max(0, Math.min(i, steps.length - 1));
          var last = idx === steps.length - 1;
          steps.forEach(function (s, n) { s.classList.toggle('is-active', n === idx); });
          if (fill) fill.style.width = Math.round((idx + 1) / steps.length * 100) + '%';
          if (curEl) curEl.textContent = idx + 1;
          if (lblEl) lblEl.textContent = steps[idx].getAttribute('data-label') || '';
          if (backBtn) backBtn.style.display = idx === 0 ? 'none' : 'inline-flex';
          if (nextBtn) nextBtn.style.display = last ? 'none' : 'inline-flex';
          if (subBtn) subBtn.style.display = last ? 'inline-flex' : 'none';
          if (focus) { var fi = steps[idx].querySelector('input:not([type=hidden]), select, textarea'); if (fi) { try { fi.focus({ preventScroll: true }); } catch (e) {} } }
        };
        form._wizShowFor = function (el) { var s = el.closest ? el.closest('.qstep') : null; var n = steps.indexOf(s); if (n >= 0) showStep(n, true); };
        if (nextBtn) nextBtn.addEventListener('click', function () {
          if (validateScope(steps[idx])) showStep(idx + 1, true);
          else { var fe = steps[idx].querySelector('.field--error input, .field--error textarea, .field--error select'); if (fe) fe.focus(); }
        });
        if (backBtn) backBtn.addEventListener('click', function () { showStep(idx - 1, true); });
        form.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && e.target && e.target.tagName !== 'TEXTAREA' && idx < steps.length - 1) { e.preventDefault(); if (nextBtn) nextBtn.click(); }
        });
        showStep(0, false);
      }
    }
  });

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () { header.style.boxShadow = window.scrollY > 8 ? '0 6px 20px rgba(10,37,64,.12)' : ''; };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Cost calculator ---------- */
  var calc = document.getElementById('cost-calc');
  if (calc) {
    var typeSel = calc.querySelector('[data-calc="type"]');
    var cityWrap = calc.querySelector('[data-calc-city]');
    var toggleCity = function () { cityWrap.hidden = typeSel.value !== 'intercity'; };
    typeSel.addEventListener('change', toggleCity);
    toggleCity();
    calc.querySelector('[data-calc-go]').addEventListener('click', function () {
      var rng = calc.querySelector('[data-calc="bhk"]').value.split('-');
      var min = parseInt(rng[0], 10), max = parseInt(rng[1], 10);
      if (typeSel.value === 'intercity') {
        var m = parseFloat(calc.querySelector('[data-calc="city"]').value) || 2;
        min *= m; max *= m;
      }
      var lift = calc.querySelector('input[name="calc_lift"]:checked');
      if (lift && lift.value === 'no') { min *= 1.08; max *= 1.12; }
      var round = function (n) { return Math.round(n / 500) * 500; };
      min = round(min); max = round(max);
      var fmt = function (n) { return '\u20B9' + n.toLocaleString('en-IN'); };
      calc.querySelector('.calc__amount').textContent = fmt(min) + ' \u2013 ' + fmt(max);
      var res = calc.querySelector('.calc__result');
      res.hidden = false;
      var wa = calc.querySelector('[data-calc-wa]');
      if (wa) {
        var num = (window.HARSHA && window.HARSHA.whatsapp) || '919035291929';
        var msg = 'Hi Harsha Packers, I used your cost calculator. Estimate: ' + fmt(min) + ' - ' + fmt(max) + '. Please share an exact quote.';
        wa.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
      }
      if (typeof window.gtag === 'function') window.gtag('event', 'cost_estimate', { event_category: 'engagement' });
      try { res.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    });
  }

  /* ---------- WhatsApp chat popup ---------- */
  var waToggle = document.querySelector('[data-wa-toggle]');
  var waPop = document.querySelector('[data-wa-pop]');
  if (waToggle && waPop) {
    var setWaPop = function (open) {
      waPop.hidden = !open;
      waToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    waToggle.addEventListener('click', function (e) { e.preventDefault(); setWaPop(waPop.hidden); });
    var waCloseBtn = waPop.querySelector('[data-wa-close]');
    if (waCloseBtn) waCloseBtn.addEventListener('click', function () { setWaPop(false); });
    var waCta = waPop.querySelector('.wa-pop__cta');
    if (waCta) waCta.addEventListener('click', function () { setWaPop(false); });
    document.addEventListener('click', function (e) {
      if (waPop.hidden) return;
      if (waPop.contains(e.target) || waToggle.contains(e.target)) return;
      setWaPop(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !waPop.hidden) setWaPop(false);
    });
  }

  /* ---------- Callback micro-form (name + phone only) ---------- */
  document.querySelectorAll('form[data-callback-form]').forEach(function (form) {
    var endpoint = form.getAttribute('action') || '/submit.php';
    function setErr(field, on) { var w = field.closest('.field'); if (w) w.classList.toggle('field--error', on); }
    function valid() {
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var v = (f.value || '').trim(); var bad = !v;
        if (f.type === 'tel') bad = !/^[+]?[0-9\s-]{10,15}$/.test(v);
        setErr(f, bad); if (bad) ok = false;
      });
      return ok;
    }
    form.querySelectorAll('input').forEach(function (f) { f.addEventListener('blur', function () { if (f.hasAttribute('required')) setErr(f, !(f.value || '').trim()); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pu = form.querySelector('[name="page_url"]'); if (pu && !pu.value) pu.value = window.location.href;
      if (!valid()) { var fe = form.querySelector('.field--error input'); if (fe) fe.focus(); return; }
      var fd = new FormData(form); var d = {}; fd.forEach(function (v, k) { d[k] = v; });
      var msg = '*Callback Request - Harsha Packers*\n\nName: ' + (d.name || '') + '\nNumber: ' + (d.phone || '') + '\nPlease call me back for a moving quote.';
      if (d.page_url) msg += '\n' + d.page_url;
      var waUrl = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      var fb = form.querySelector('[data-wa-fallback]'); if (fb) fb.href = waUrl;
      var web3 = (window.HARSHA && window.HARSHA.web3) || '';
      if (web3 && web3.indexOf('REPLACE') === -1) {
        fd.append('access_key', web3);
        fd.append('subject', 'Callback Request: ' + (d.name || '') + ' (' + (d.phone || '') + ')');
        fd.append('from_name', 'Harsha Packers Website');
        try { fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd }).catch(function () {}); } catch (er) {}
      } else {
        try { fetch(endpoint, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'fetch' } }).catch(function () {}); } catch (er) {}
      }
      form.classList.add('sent');
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: 'callback' });
      if (typeof window.gtag === 'function' && window.HARSHA && window.HARSHA.adsId) window.gtag('event', 'conversion', { send_to: window.HARSHA.adsId + (window.HARSHA.adsLabel ? '/' + window.HARSHA.adsLabel : '') });
    });
  });

  /* ---------- Sticky desktop quote bar ---------- */
  var deskBar = document.querySelector('[data-desk-bar]');
  if (deskBar) {
    var deskOn = false;
    var updateDesk = function () {
      var doc = document.documentElement;
      var nearBottom = (window.innerHeight + window.scrollY) >= (doc.scrollHeight - 260);
      var on = window.scrollY > 700 && !nearBottom && window.innerWidth > 992;
      if (on === deskOn) return;
      deskOn = on;
      deskBar.classList.toggle('is-on', on);
      document.body.classList.toggle('deskbar-on', on);
    };
    window.addEventListener('scroll', updateDesk, { passive: true });
    window.addEventListener('resize', updateDesk);
    updateDesk();
  }

  /* ---------- Exit-intent (desktop, once per session) ---------- */
  var exitPop = document.querySelector('[data-exit-pop]');
  if (exitPop && window.innerWidth > 992) {
    var exitShown = false;
    try { exitShown = sessionStorage.getItem('hpExit') === '1'; } catch (e) {}
    var closeExit = function () { exitPop.hidden = true; document.body.classList.remove('exit-open'); };
    var openExit = function () {
      if (exitShown) return;
      exitShown = true;
      try { sessionStorage.setItem('hpExit', '1'); } catch (e) {}
      exitPop.hidden = false;
      document.body.classList.add('exit-open');
      if (typeof window.gtag === 'function') window.gtag('event', 'exit_intent_shown', { event_category: 'engagement' });
    };
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0) openExit(); });
    exitPop.addEventListener('click', function (e) { if (e.target === exitPop) closeExit(); });
    var ec = exitPop.querySelector('[data-exit-close]'); if (ec) ec.addEventListener('click', closeExit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !exitPop.hidden) closeExit(); });
  }

  /* ---------- Year in footer ---------- */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Conversion tracking: call & WhatsApp clicks ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me"], a[href*="api.whatsapp"]') : null;
    if (!a || typeof window.gtag !== 'function') return;
    if (a.hasAttribute('data-wa-toggle')) return; // opens chat popup, not a real WhatsApp click
    var href = a.getAttribute('href');
    if (href.indexOf('mailto:') === 0) { window.gtag('event', 'email_click', { event_category: 'engagement' }); return; }
    var isCall = href.indexOf('tel:') === 0;
    window.gtag('event', isCall ? 'click_to_call' : 'click_whatsapp', { event_category: 'engagement' });
    if (window.HARSHA && window.HARSHA.adsId) window.gtag('event', 'conversion', { send_to: window.HARSHA.adsId + (window.HARSHA.adsLabel ? '/' + window.HARSHA.adsLabel : '') });
  });

  /* ---------- Animated count-up for stats ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var comma = el.getAttribute('data-comma') === '1';
    var dur = 1500, start = null;
    function fmt(n) {
      var v = dec ? n.toFixed(dec) : Math.round(n).toString();
      if (comma) v = Number(Math.round(n)).toLocaleString('en-IN');
      return v;
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }
})();

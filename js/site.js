/* ============================================================
   Starkapital · comportamiento compartido del sitio · Fase 1
   ============================================================ */
(function(){
  'use strict';

  /* ---------- Constantes financieras ----------
     Estructura confirmada por el cliente (agosto de 2026):
       · tasa 29,5% E.A.
       · seguro de vida deudor: 0,033% mensual sobre el valor desembolsado
       · membresía de seguimiento GPS: $500.000 al año, aparte de la cuota */
  var TASA_EA = 0.295;
  var iMes = Math.pow(1 + TASA_EA, 1/12) - 1;   /* ≈ 0,021776 → 2,18% M.V. */
  var VIDA_DEUDOR_PCT = 0.00033;                 /* mensual, sobre el desembolso */
  var GPS_ANUAL = 500000;                        /* membresía anual, no va en la cuota */
  var WA_NUMBER = '573000000000';                /* número comercial por confirmar */
  var WA_PLACEHOLDER = WA_NUMBER === '573000000000';

  var fmt = function(n){ return '$' + Math.round(n).toLocaleString('es-CO'); };
  var redondearMiles = function(n){ return Math.round(n/1000)*1000; };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function mostrarToast(msg){
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2800);
  }
  window.skToast = mostrarToast;

  /* ---------- WhatsApp (mensaje según página de origen) ---------- */
  function waHref(msg){ return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg); }
  var waMsgBase = document.body.getAttribute('data-wa-msg') ||
                  'Hola, vengo de starkapital.com y quiero información sobre un crédito de taxi.';
  document.querySelectorAll('a.js-wa').forEach(function(a){
    a.href = waHref(a.getAttribute('data-wa-msg') || waMsgBase);
    if (WA_PLACEHOLDER) {
      a.addEventListener('click', function(e){
        e.preventDefault();
        mostrarToast('Número de WhatsApp por confirmar — este botón abrirá el chat con mensaje precargado');
      });
    }
  });

  /* ---------- Enlaces fuera de alcance (portal de cliente, dataroom) ---------- */
  document.querySelectorAll('.soon').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      mostrarToast((a.getAttribute('data-page') || 'Esta sección') + ' — disponible próximamente');
    });
  });

  /* ---------- Menú de escritorio: estado accesible de los desplegables ---------- */
  document.querySelectorAll('.menu button.mi').forEach(function(btn){
    var li = btn.parentElement;
    var setExp = function(on){ btn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    li.addEventListener('mouseenter', function(){ setExp(true); });
    li.addEventListener('mouseleave', function(){ setExp(false); });
    li.addEventListener('focusin', function(){ setExp(true); });
    li.addEventListener('focusout', function(){ if (!li.contains(document.activeElement)) setExp(false); });
    btn.addEventListener('click', function(){
      var first = li.querySelector('.dropdown a');
      if (first) first.focus();
    });
  });

  /* ---------- Drawer móvil (con gestión de foco) ---------- */
  var drawer = document.getElementById('drawer');
  var hamb = document.getElementById('hamb');
  if (drawer && hamb) {
    var panel = drawer.querySelector('.drawer-panel');
    var drawerClose = document.getElementById('drawerClose');
    var abrir = function(){
      drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false');
      panel.setAttribute('aria-modal','true'); hamb.setAttribute('aria-expanded','true');
      drawerClose.focus();
    };
    var cerrar = function(){
      var estaba = drawer.classList.contains('open');
      drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true');
      hamb.setAttribute('aria-expanded','false');
      if (estaba) hamb.focus();
    };
    hamb.addEventListener('click', abrir);
    drawerClose.addEventListener('click', cerrar);
    drawer.addEventListener('click', function(e){ if (e.target === drawer) cerrar(); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key === 'Tab' && drawer.classList.contains('open')) {
        var f = panel.querySelectorAll('button, a[href]');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ cerrar(); }); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .16, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Contadores (elementos .n con data-count) ---------- */
  function animarCifra(el){
    var target = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.innerHTML = '<em>' + prefix + '</em>' + target + suffix; return; }
    var t0 = null, dur = 1400;
    function frame(ts){
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = '<em>' + prefix + '</em>' + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var cifras = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    var ioC = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { animarCifra(e.target); ioC.unobserve(e.target); }
      });
    }, { threshold: .5 });
    cifras.forEach(function(el){ ioC.observe(el); });
  } else {
    cifras.forEach(animarCifra);
  }

  /* ---------- Simulador (se activa donde exista [data-sim]) ----------
     Parámetros por data-attributes del contenedor:
       data-monto  → monto inicial (por defecto 80000000)
       data-plazo  → plazo inicial en meses (por defecto 60)
       data-share-url → si existe, mantiene ?monto=&plazo= en la URL (página /simulador/) */
  var simRoot = document.querySelector('[data-sim]');
  if (simRoot) {
    var range = simRoot.querySelector('.js-monto-range');
    var num = simRoot.querySelector('.js-monto-num');
    var cuotaTotalEl = simRoot.querySelector('.js-cuota-total');
    var cuotaCreditoEl = simRoot.querySelector('.js-cuota-credito');
    var cuotaSeguroEl = simRoot.querySelector('.js-cuota-seguro');   /* seguro de vida deudor */
    var totalPagadoEl = simRoot.querySelector('.js-total-pagado');
    var gpsEl = simRoot.querySelector('.js-gps-anual');
    var waShare = simRoot.querySelector('.js-wa-share');
    var plazoLabels = simRoot.querySelectorAll('.plazos label');
    var shareUrl = simRoot.hasAttribute('data-share-url');

    /* estado inicial: data-attributes, y si la página lo pide, parámetros de la URL */
    var qs = new URLSearchParams(location.search);
    var mMin = parseInt(range.min,10), mMax = parseInt(range.max,10);
    var m0 = parseInt(simRoot.getAttribute('data-monto') || '80000000', 10);
    var p0 = parseInt(simRoot.getAttribute('data-plazo') || '60', 10);
    if (shareUrl) {
      if (qs.get('monto')) m0 = parseInt(qs.get('monto'), 10) || m0;
      if (qs.get('plazo')) p0 = parseInt(qs.get('plazo'), 10) || p0;
    }
    range.value = Math.min(mMax, Math.max(mMin, m0));
    var radios = simRoot.querySelectorAll('input[name="plazo"]');
    radios.forEach(function(r){ r.checked = (parseInt(r.value,10) === p0); });
    if (!simRoot.querySelector('input[name="plazo"]:checked')) radios[3].checked = true;

    var plazoActual = function(){
      var r = simRoot.querySelector('input[name="plazo"]:checked');
      return r ? parseInt(r.value, 10) : 60;
    };
    var cuotaDe = function(P, n){ return P * iMes / (1 - Math.pow(1 + iMes, -n)); };
    var pintarRange = function(){
      var v = parseInt(range.value,10);
      range.style.setProperty('--fill', ((v-mMin)/(mMax-mMin)*100) + '%');
    };
    var pintarPlazos = function(){
      plazoLabels.forEach(function(l){
        l.classList.toggle('sel', l.querySelector('input').checked);
      });
    };
    var render = function(P, n, actualizarCampo){
      /* todo se muestra redondeado a miles y el total se calcula sobre la
         cuota MOSTRADA, para que la multiplicación del usuario siempre cierre */
      var cuotaCredito = redondearMiles(cuotaDe(P, n));
      var vidaDeudor = Math.round(P * VIDA_DEUDOR_PCT);
      var cuotaTotal = redondearMiles(cuotaCredito + vidaDeudor);
      /* la membresía GPS no va en la cuota: se paga aparte, una vez al año */
      var anios = Math.ceil(n / 12);
      var totalPagado = cuotaTotal * n + GPS_ANUAL * anios;

      cuotaCreditoEl.textContent = fmt(cuotaCredito);
      cuotaSeguroEl.textContent = fmt(vidaDeudor);
      cuotaTotalEl.textContent = fmt(cuotaTotal);
      totalPagadoEl.textContent = fmt(totalPagado);
      if (gpsEl) gpsEl.textContent = fmt(GPS_ANUAL);

      if (actualizarCampo) num.value = P.toLocaleString('es-CO');
      range.setAttribute('aria-valuetext', fmt(P) + ' pesos');
      pintarRange();
      pintarPlazos();
      var msg = 'Hola, simulé mi crédito de vehículo productivo en starkapital.com: monto ' + fmt(P) +
                ', plazo ' + n + ' meses, cuota estimada ' + fmt(cuotaTotal) + ' al mes. Quiero más información.';
      if (waShare) {
        var link = shareUrl ? (location.origin + '/simulador/?monto=' + P + '&plazo=' + n) : '';
        waShare.href = waHref(msg + (link ? ' ' + link : ''));
      }
      if (shareUrl) {
        history.replaceState(null, '', '/simulador/?monto=' + P + '&plazo=' + n);
      }
    };
    var calcular = function(){ render(parseInt(range.value, 10), plazoActual(), true); };
    range.addEventListener('input', calcular);
    radios.forEach(function(r){
      r.addEventListener('change', calcular);
      r.addEventListener('focus', function(){ r.closest('label').classList.add('foc'); });
      r.addEventListener('blur', function(){ r.closest('label').classList.remove('foc'); });
    });
    num.addEventListener('input', function(){
      var raw = parseInt((num.value || '').replace(/[^\d]/g, ''), 10);
      /* mientras escribe: solo recalcular con valores dentro del rango; blur normaliza */
      if (isNaN(raw) || raw < mMin || raw > mMax) return;
      range.value = raw;
      render(raw, plazoActual(), false);
    });
    num.addEventListener('blur', calcular);
    if (waShare && WA_PLACEHOLDER) {
      waShare.addEventListener('click', function(e){
        e.preventDefault();
        mostrarToast('Número de WhatsApp por confirmar — este botón compartirá la simulación por chat');
      });
    }
    calcular();
  }

  /* ---------- Radicados de demostración (formularios) ----------
     window.skRadicado('VIT') → 'VIT-2026-00417' persistente por consecutivo local */
  window.skRadicado = function(prefijo){
    var k = 'sk-rad-' + prefijo;
    var n = parseInt(localStorage.getItem(k) || '416', 10) + 1;
    localStorage.setItem(k, String(n));
    return prefijo + '-2026-' + String(n).padStart(5, '0');
  };
})();

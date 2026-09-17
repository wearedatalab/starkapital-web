/* ============================================================
   Starkapital · medición y consentimiento
   ------------------------------------------------------------
   Los identificadores NO viven aquí: se configuran en el back office
   (/crm → Analítica) y este archivo los pide a /api/public/analytics.
   Si no hay API o la medición está apagada, no se carga ningún script
   de terceros y el sitio funciona igual.

   Orden que importa: primero se declaran los valores por defecto del
   Consent Mode (todo denegado) y solo después se inyecta cualquier
   etiqueta. Así ninguna cookie de medición se escribe antes del «sí».
   ============================================================ */
(function () {
  'use strict';

  var CLAVE = 'sk-consent';          /* 'si' | 'no' */
  var cfg = null;

  /* ---------- dataLayer y gtag, disponibles desde el primer momento ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function leerConsentimiento() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }
  function guardarConsentimiento(v) {
    try { localStorage.setItem(CLAVE, v); } catch (e) { /* modo privado */ }
  }

  var yaDecidio = leerConsentimiento();

  /* Consent Mode v2: denegado por defecto salvo que ya haya un «sí» guardado. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });
  if (yaDecidio === 'si') otorgar();

  function otorgar() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  }

  /* ---------- inyección de etiquetas ---------- */
  function script(src, atributos) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    Object.keys(atributos || {}).forEach(function (k) { s.setAttribute(k, atributos[k]); });
    document.head.appendChild(s);
    return s;
  }

  function cargarEtiquetas(c) {
    if (!c || !c.activa) return;

    if (c.gtm) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      script('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(c.gtm));
    }

    /* GA4 directo solo si NO viene por GTM: si no, se mediría dos veces. */
    if (c.ga4 && !c.gtm) {
      script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(c.ga4));
      gtag('js', new Date());
      gtag('config', c.ga4, {
        anonymize_ip: !!c.anonimizarIp,
        send_page_view: true,
      });
    }
    if (c.googleAds && !c.gtm) {
      if (!c.ga4) script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(c.googleAds));
      gtag('config', c.googleAds);
    }

    if (c.metaPixel) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', c.metaPixel);
      window.fbq('track', 'PageView');
    }

    if (c.linkedin) {
      window._linkedin_partner_id = String(c.linkedin);
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(c.linkedin);
      script('https://snap.licdn.com/li_lms/js/lms-ads.js');
    }

    if (c.tiktok) {
      /* eslint-disable */
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(e,n){e[n]=function(){e.push([n].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=n;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]={};var o=d.createElement('script');o.type='text/javascript';o.async=!0;o.src=n+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};
      ttq.load(c.tiktok);ttq.page();}(window,document,'ttq');
      /* eslint-enable */
    }

    if (c.clarity) {
      /* eslint-disable */
      (function(c2,l,a,r,i,t,y){c2[a]=c2[a]||function(){(c2[a].q=c2[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script',c.clarity);
      /* eslint-enable */
    }

    if (c.hotjar) {
      window._hjSettings = { hjid: Number(c.hotjar), hjsv: 6 };
      script('https://static.hotjar.com/c/hotjar-' + encodeURIComponent(c.hotjar) + '.js?sv=6');
    }
  }

  /* ---------- eventos que el sitio reporta ---------- */
  function evento(nombre, params) {
    var datos = params || {};
    window.dataLayer.push(Object.assign({ event: nombre }, datos));
    if (typeof window.gtag === 'function' && cfg && cfg.activa) window.gtag('event', nombre, datos);
    if (window.fbq && nombre === 'generate_lead') window.fbq('track', 'Lead');
  }
  window.skEvento = evento;

  /* ---------- banner de consentimiento ---------- */
  function mostrarBanner() {
    if (document.getElementById('skConsent')) return;
    var b = document.createElement('div');
    b.className = 'consent';
    b.id = 'skConsent';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Uso de cookies');
    b.innerHTML =
      '<p class="consent-t">Usamos cookies para entender cómo se usa el sitio y mejorar lo que le mostramos. ' +
      'Usted decide: sin su permiso no activamos ninguna medición. ' +
      '<a href="/legal/politica-de-cookies/">Ver la política de cookies</a>.</p>' +
      '<div class="consent-btns">' +
      '<button type="button" class="btn-cta" id="skConsentSi">Aceptar</button>' +
      '<button type="button" class="btn-ghost" id="skConsentNo">Solo lo necesario</button>' +
      '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('visible'); });

    var cerrar = function (valor) {
      guardarConsentimiento(valor);
      if (valor === 'si') { otorgar(); cargarEtiquetas(cfg); }
      b.classList.remove('visible');
      setTimeout(function () { b.remove(); }, 220);
    };
    document.getElementById('skConsentSi').addEventListener('click', function () { cerrar('si'); });
    document.getElementById('skConsentNo').addEventListener('click', function () { cerrar('no'); });
  }

  /* ---------- arranque ---------- */
  fetch('/api/public/analytics', { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) {
      cfg = c;
      window.skAnalitica = c;
      if (!c || !c.activa) return;             /* medición apagada: no se carga nada */
      if (!c.consentMode) {                    /* sin Consent Mode, se carga directo */
        otorgar();
        cargarEtiquetas(c);
        return;
      }
      if (yaDecidio === 'si') cargarEtiquetas(c);
      else if (yaDecidio !== 'no') mostrarBanner();
    })
    .catch(function () { cfg = null; window.skAnalitica = null; });
})();

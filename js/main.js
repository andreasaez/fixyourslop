import posthog from 'posthog-js';

document.documentElement.classList.add('js');

var posthogToken = process.env.POSTHOG_PROJECT_TOKEN;
var posthogHost = process.env.POSTHOG_HOST;
var posthogReady = false;

// posthog-js manufactures a synthetic $exception from any non-Error promise
// rejection on the page, including ones thrown by browser extensions and
// embedded webviews we don't control. Outlook's desktop client injects a JS
// bridge when it previews a link, and its rejection value
// ("Object Not Found Matching Id:..., MethodName:update, ParamCount:4") gets
// captured and fingerprinted as if it were our bug. Drop that known-noise
// shape only — match the value signature rather than blanket-dropping every
// frameless/synthetic exception, so genuine minified or cross-origin errors
// still get through.
function isThirdPartyRejectionNoise(cr) {
  if (!cr || cr.event !== '$exception') return false;
  var exceptions = cr.properties && cr.properties.$exception_list;
  if (!Array.isArray(exceptions)) return false;
  return exceptions.some(function (ex) {
    var mechanism = ex && ex.mechanism;
    if (!mechanism || mechanism.synthetic !== true) return false;
    var value = ex && ex.value;
    return typeof value === 'string' &&
      value.indexOf('Object Not Found Matching Id') !== -1 &&
      value.indexOf('MethodName:update') !== -1;
  });
}

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: '2026-01-30',
    capture_exceptions: true,
    before_send: function (cr) {
      return isThirdPartyRejectionNoise(cr) ? null : cr;
    }
  });
  posthogReady = true;
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  throw new Error('POSTHOG_PROJECT_TOKEN and POSTHOG_HOST variables required by PostHog are missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN and POSTHOG_HOST are configured');
}

function captureEvent(event, properties) {
  if (posthogReady) {
    posthog.capture(event, properties);
  }
}

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var heroLoop = document.getElementById('heroLoop');
if (heroLoop && prefersReducedMotion) {
  heroLoop.removeAttribute('autoplay');
  heroLoop.pause();
}

var navToggle = document.getElementById('navToggle');
var primaryNav = document.getElementById('primaryNav');

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', function () {
    var isOpen = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  primaryNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('a[href="#contact"]').forEach(function (link) {
  link.addEventListener('click', function () {
    captureEvent('contact_cta_clicked', {
      cta_location: link.closest('.hero-actions') ? 'hero' : 'navigation'
    });
  });
});

var contactForm = document.getElementById('contactForm');
if (contactForm) {
  var statusEl = contactForm.querySelector('.form-status');
  var submitBtn = contactForm.querySelector('.form-submit');

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        if (response.ok) {
          captureEvent('contact_form_submitted');
          statusEl.textContent = "Got it. We'll be in touch soon.";
          statusEl.className = 'form-status success';
          contactForm.reset();
        } else {
          captureEvent('contact_form_submission_failed', {
            failure_type: 'response_error'
          });
          statusEl.textContent = 'Something went wrong. Try again, or email hello@fixyourslop.ai directly.';
          statusEl.className = 'form-status error';
        }
      })
      .catch(function () {
        captureEvent('contact_form_submission_failed', {
          failure_type: 'network_error'
        });
        statusEl.textContent = 'Something went wrong. Try again, or email hello@fixyourslop.ai directly.';
        statusEl.className = 'form-status error';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get a Free Slop Audit';
      });
  });
}

var logoItems = document.querySelectorAll('.logo-item');
var supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function positionLogoOverlay(item) {
  var overlay = item.querySelector('.logo-overlay');
  if (!overlay) return;
  var baseShift = parseFloat(item.dataset.overlayOffset || '0');
  item.style.setProperty('--overlay-shift', baseShift + 'px');
  var margin = 16;
  var rect = overlay.getBoundingClientRect();
  var shift = baseShift;
  if (rect.left < margin) {
    shift += margin - rect.left;
  } else if (rect.right > window.innerWidth - margin) {
    shift += (window.innerWidth - margin) - rect.right;
  }
  item.style.setProperty('--overlay-shift', shift + 'px');
}

logoItems.forEach(function (item) {
  item.addEventListener('mouseenter', function () { positionLogoOverlay(item); });
  item.addEventListener('focusin', function () { positionLogoOverlay(item); });
});

window.addEventListener('resize', function () {
  logoItems.forEach(function (item) {
    if (item.classList.contains('is-active') || item.matches(':hover')) {
      positionLogoOverlay(item);
    }
  });
});

if (logoItems.length && !supportsHover) {
  logoItems.forEach(function (item) {
    var link = item.querySelector('a');
    if (!link) return;

    link.addEventListener('click', function (e) {
      if (!item.classList.contains('is-active')) {
        e.preventDefault();
        logoItems.forEach(function (other) {
          if (other !== item) other.classList.remove('is-active');
        });
        positionLogoOverlay(item);
        item.classList.add('is-active');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.logo-item')) {
      logoItems.forEach(function (item) {
        item.classList.remove('is-active');
      });
    }
  });
}

if ('IntersectionObserver' in window) {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });
} else {
  document.querySelectorAll('.reveal').forEach(function (el) {
    el.classList.add('in-view');
  });
}

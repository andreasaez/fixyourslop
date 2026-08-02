import posthog from 'posthog-js';

document.documentElement.classList.add('js');

var posthogToken = process.env.POSTHOG_PROJECT_TOKEN;
var posthogHost = process.env.POSTHOG_HOST;
var posthogReady = false;

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: '2026-01-30',
    capture_exceptions: true
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
  item.style.setProperty('--overlay-shift', '0px');
  var margin = 16;
  var rect = overlay.getBoundingClientRect();
  var shift = 0;
  if (rect.left < margin) {
    shift = margin - rect.left;
  } else if (rect.right > window.innerWidth - margin) {
    shift = (window.innerWidth - margin) - rect.right;
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

document.documentElement.classList.add('js');

var heroLoop = document.getElementById('heroLoop');
if (heroLoop && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
          statusEl.textContent = "Got it. We'll be in touch soon.";
          statusEl.className = 'form-status success';
          contactForm.reset();
        } else {
          statusEl.textContent = 'Something went wrong. Try again, or email hello@fixyourslop.ai directly.';
          statusEl.className = 'form-status error';
        }
      })
      .catch(function () {
        statusEl.textContent = 'Something went wrong. Try again, or email hello@fixyourslop.ai directly.';
        statusEl.className = 'form-status error';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get a Free Slop Audit';
      });
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

(function () {
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var buffer = [];
  var isOpen = false;

  var UNICORN = [
    '       *',
    '      /.\\',
    '     /...\\',
    '    /..^..\\',
    '   (  o o  )',
    '    \\  <  /',
    '   __\\___/__',
    '  (_________)'
  ];

  document.addEventListener('keydown', function (e) {
    var active = document.activeElement;
    var typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    if (typing || isOpen) return;

    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    buffer.push(key);
    if (buffer.length > KONAMI.length) buffer.shift();

    if (buffer.length === KONAMI.length && buffer.every(function (k, i) { return k === KONAMI[i]; })) {
      buffer = [];
      openEgg();
    }
  });

  function openEgg() {
    isOpen = true;
    injectStyles();

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var order = UNICORN.map(function (line, i) { return i; });
    do {
      shuffle(order);
    } while (order.every(function (v, i) { return v === i; }));

    var overlay = document.createElement('div');
    overlay.className = 'egg-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Hidden terminal puzzle');

    overlay.innerHTML =
      '<div class="egg-term">' +
        '<div class="egg-bar">' +
          '<span class="egg-dot egg-dot-r"></span>' +
          '<span class="egg-dot egg-dot-y"></span>' +
          '<span class="egg-dot egg-dot-g"></span>' +
          '<span class="egg-title">havefun.exe</span>' +
          '<button class="egg-close" aria-label="Close">x</button>' +
        '</div>' +
        '<div class="egg-body">' +
          '<div class="egg-line">$ sudo ./unlock --easter-egg</div>' +
          '<div class="egg-line">ACCESS GRANTED.</div>' +
          '<div class="egg-line egg-hint">&gt; reassemble the unicorn. click two lines to swap them.</div>' +
          '<div class="egg-puzzle"></div>' +
          '<div class="egg-reveal" hidden></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var puzzle = overlay.querySelector('.egg-puzzle');
    var rows = order.map(function (targetIndex) {
      var row = document.createElement('div');
      row.className = 'egg-row';
      row.textContent = UNICORN[targetIndex];
      row.dataset.target = targetIndex;
      row.tabIndex = 0;
      return row;
    });
    rows.forEach(function (row) { puzzle.appendChild(row); });

    var selected = null;
    function handleRowActivate(row) {
      if (row.classList.contains('egg-locked')) return;
      if (!selected) {
        selected = row;
        row.classList.add('egg-selected');
        return;
      }
      if (selected === row) {
        selected.classList.remove('egg-selected');
        selected = null;
        return;
      }
      var a = selected.textContent;
      var b = row.textContent;
      var ta = selected.dataset.target;
      var tb = row.dataset.target;
      selected.textContent = b;
      row.textContent = a;
      selected.dataset.target = tb;
      row.dataset.target = ta;
      selected.classList.remove('egg-selected');
      selected = null;
      checkSolved();
    }

    rows.forEach(function (row) {
      row.addEventListener('click', function () { handleRowActivate(row); });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowActivate(row);
        }
      });
    });

    function checkSolved() {
      var solved = rows.every(function (row, i) { return Number(row.dataset.target) === i; });
      if (!solved) return;
      rows.forEach(function (row) { row.classList.add('egg-locked'); });
      puzzle.classList.add('egg-solved');
      revealMessage();
    }

    function revealMessage() {
      var reveal = overlay.querySelector('.egg-reveal');
      reveal.hidden = false;
      var lines = ["> let's work together!", '> fixyourslop.ai'];

      if (reducedMotion) {
        reveal.textContent = lines.join('\n');
        wireRevealLink(reveal);
        return;
      }

      var full = lines.join('\n');
      var i = 0;
      var interval = setInterval(function () {
        reveal.textContent = full.slice(0, i);
        i++;
        if (i > full.length) {
          clearInterval(interval);
          wireRevealLink(reveal);
        }
      }, 35);
    }

    function wireRevealLink(reveal) {
      var link = document.createElement('a');
      link.href = '#contact';
      link.className = 'egg-cta';
      link.textContent = "Let's talk ->";
      link.addEventListener('click', closeEgg);
      reveal.appendChild(document.createElement('br'));
      reveal.appendChild(link);
    }

    function closeEgg() {
      document.body.style.overflow = '';
      overlay.remove();
      isOpen = false;
      document.removeEventListener('keydown', onEsc);
    }

    function onEsc(e) {
      if (e.key === 'Escape') closeEgg();
    }
    document.addEventListener('keydown', onEsc);

    overlay.querySelector('.egg-close').addEventListener('click', closeEgg);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeEgg();
    });
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  function injectStyles() {
    if (document.getElementById('egg-styles')) return;
    var style = document.createElement('style');
    style.id = 'egg-styles';
    style.textContent =
      '.egg-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}' +
      '.egg-term{width:100%;max-width:460px;background:#0a0f0a;border:1px solid #2fdc6b;border-radius:8px;box-shadow:0 0 40px rgba(47,220,107,.25);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Courier New",monospace;overflow:hidden;}' +
      '.egg-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#0f1a10;border-bottom:1px solid #1c3320;}' +
      '.egg-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}' +
      '.egg-dot-r{background:#ff5f56;}.egg-dot-y{background:#ffbd2e;}.egg-dot-g{background:#27c93f;}' +
      '.egg-title{color:#7fdca0;font-size:.8rem;margin-left:6px;flex:1;}' +
      '.egg-close{background:none;border:none;color:#7fdca0;font-size:.9rem;cursor:pointer;padding:2px 8px;}' +
      '.egg-close:hover{color:#fff;}' +
      '.egg-body{padding:18px 16px 20px;color:#39ff6a;font-size:.85rem;line-height:1.6;}' +
      '.egg-line{white-space:pre-wrap;}' +
      '.egg-hint{color:#7fdca0;margin:6px 0 14px;}' +
      '.egg-puzzle{display:flex;flex-direction:column;gap:2px;margin-bottom:4px;white-space:pre;}' +
      '.egg-row{cursor:pointer;padding:1px 8px;border-radius:3px;border-left:3px solid transparent;outline:none;}' +
      '.egg-row:hover{background:rgba(47,220,107,.12);}' +
      '.egg-row.egg-selected{background:rgba(47,220,107,.25);border-left-color:#39ff6a;}' +
      '.egg-row.egg-locked{cursor:default;}' +
      '.egg-puzzle.egg-solved .egg-row{color:#f5c93f;}' +
      '.egg-reveal{white-space:pre-wrap;margin-top:16px;padding-top:14px;border-top:1px dashed #1c3320;color:#f5afce;font-weight:bold;min-height:2.6em;}' +
      '.egg-cta{display:inline-block;margin-top:10px;color:#39ff6a;text-decoration:underline;}' +
      '@media (prefers-reduced-motion: no-preference){.egg-term{animation:egg-in .18s ease-out;}}' +
      '@keyframes egg-in{from{transform:scale(.96);opacity:0;}to{transform:scale(1);opacity:1;}}';
    document.head.appendChild(style);
  }
})();

(function () {
  var STORAGE_KEY = 'skillhub-theme';
  var OVERRIDE_ID = 'theme-light-override';
  var btn = null;

  var LIGHT_CSS = [
    'body.light-mode{background:linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%)!important;color:#1e293b!important}',
    'body.light-mode .glass-card{background:#fff!important;border:1px solid #e2e8f0!important;box-shadow:0 4px 24px rgba(0,0,0,.07)!important}',
    'body.light-mode .submit-card{background:#f8fafc!important;border:1px solid #e2e8f0!important}',
    'body.light-mode .assignment-card{background:#f8fafc!important;border:1px solid #e2e8f0!important}',
    'body.light-mode .lms-navbar{background:rgba(255,255,255,.97)!important;border-bottom:1px solid #e2e8f0!important}',
    'body.light-mode .navbar-brand,body.light-mode .nav-link{color:#1e293b!important}',
    'body.light-mode .nav-link:hover{color:#6366f1!important}',
    'body.light-mode h1,body.light-mode h2,body.light-mode h3,body.light-mode h4,body.light-mode h5,body.light-mode h6{color:#0f172a!important}',
    'body.light-mode [style*="color:#e2e8f0"]{color:#1e293b!important}',
    'body.light-mode [style*="color:#c7d2fe"]{color:#3730a3!important}',
    'body.light-mode [style*="color:#94a3b8"]{color:#475569!important}',
    'body.light-mode [style*="color:#64748b"]{color:#475569!important}',
    'body.light-mode [style*="color:#475569"]{color:#64748b!important}',
    'body.light-mode [style*="color:#a5b4fc"]{color:#4338ca!important}',
    'body.light-mode [style*="color:#818cf8"]{color:#4338ca!important}',
    'body.light-mode [style*="color:#4ade80"]{color:#16a34a!important}',
    'body.light-mode [style*="color:#f87171"]{color:#dc2626!important}',
    'body.light-mode [style*="color:#facc15"]{color:#ca8a04!important}',
    'body.light-mode [style*="background:rgba(12,18,34"]{background:#f8fafc!important}',
    'body.light-mode [style*="background:rgba(15,23,42"]{background:#f1f5f9!important}',
    'body.light-mode [style*="background:rgba(0,0,0"]{background:transparent!important}',
    'body.light-mode [style*="background:rgba(99,102,241,.18)"]{background:rgba(99,102,241,.1)!important}',
    'body.light-mode [style*="background:rgba(99,102,241,.2)"]{background:rgba(99,102,241,.1)!important}',
    'body.light-mode [style*="background:rgba(34,197,94"]{background:rgba(34,197,94,.1)!important}',
    'body.light-mode [style*="background:rgba(239,68,68"]{background:rgba(239,68,68,.08)!important}',
    'body.light-mode [style*="background:rgba(148,163,184"]{background:#f1f5f9!important}',
    'body.light-mode .dark-table{color:#1e293b!important}',
    'body.light-mode .dark-table thead tr{background:rgba(99,102,241,.06)!important}',
    'body.light-mode .dark-table thead th{color:#475569!important;border-bottom:1px solid #e2e8f0!important}',
    'body.light-mode .dark-table tbody td{border-bottom:1px solid #f1f5f9!important;color:#1e293b!important}',
    'body.light-mode .dark-table tbody tr:hover{background:rgba(99,102,241,.04)!important}',
    'body.light-mode .form-control,body.light-mode .form-select{background:#fff!important;border:1px solid #cbd5e1!important;color:#0f172a!important}',
    'body.light-mode .form-control:focus,body.light-mode .form-select:focus{border-color:#6366f1!important;box-shadow:0 0 0 .2rem rgba(99,102,241,.15)!important}',
    'body.light-mode .score-input{background:#fff!important;border:1px solid #cbd5e1!important;color:#0f172a!important}',
    'body.light-mode .btn-outline-secondary{color:#475569!important;border-color:#cbd5e1!important}',
    'body.light-mode .btn-outline-secondary:hover{background:#f1f5f9!important}',
    'body.light-mode .btn-light{background:#f1f5f9!important;color:#1e293b!important}',
    'body.light-mode .alert-success{background:#f0fdf4!important;border-color:#bbf7d0!important;color:#166534!important}',
    'body.light-mode .alert-danger{background:#fef2f2!important;border-color:#fecaca!important;color:#991b1b!important}',
    'body.light-mode .alert{background:#fff!important;border-color:#e2e8f0!important;color:#1e293b!important}',
    'body.light-mode .score-pill.score-none{background:#f1f5f9!important;color:#64748b!important;border-color:#e2e8f0!important}',
    'body.light-mode .badge-count{background:rgba(99,102,241,.1)!important;color:#4338ca!important;border-color:rgba(99,102,241,.2)!important}',
    'body.light-mode .modal-content{background:#fff!important;border:1px solid #e2e8f0!important}',
    'body.light-mode .modal-header,body.light-mode .modal-footer{border-color:#e2e8f0!important}',
    'body.light-mode .modal-title{color:#0f172a!important}',
    'body.light-mode .section-label{color:#6366f1!important}',
    'body.light-mode .course-row{border-bottom-color:#f1f5f9!important}',
    'body.light-mode .course-title{color:#3730a3!important}',
    'body.light-mode .deadline-row{border-bottom-color:#f1f5f9!important}',
    'body.light-mode .deadline-title{color:#1e293b!important}',
    'body.light-mode .theme-toggle{background:rgba(255,255,255,.95)!important;border:1px solid #cbd5e1!important;color:#1e293b!important;box-shadow:0 4px 16px rgba(0,0,0,.1)!important}',
    'body.light-mode .text-secondary{color:#64748b!important}',
  ].join('');

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  function injectCSS() {
    if (document.getElementById(OVERRIDE_ID)) return;
    var s = document.createElement('style');
    s.id = OVERRIDE_ID;
    s.textContent = LIGHT_CSS;
    document.head.appendChild(s);
  }

  function removeCSS() {
    var el = document.getElementById(OVERRIDE_ID);
    if (el) el.remove();
  }

  // body mavjud bo'lsa darhol, bo'lmasa DOMContentLoaded da qo'llash
  function applyToBody(theme) {
    var body = document.body;
    if (!body) return false;
    if (theme === 'light') {
      body.classList.add('light-mode');
      injectCSS();
    } else {
      body.classList.remove('light-mode');
      removeCSS();
    }
    document.documentElement.classList.remove('light-mode-pre');
    if (btn) {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
      btn.title = theme === 'light' ? 'Qora rejimga o\'tish' : 'Oq rejimga o\'tish';
    }
    return true;
  }

  function applyTheme(theme) {
    
    if (!applyToBody(theme)) {
      document.addEventListener('DOMContentLoaded', function () {
        applyToBody(theme);
      });
    }
  }

  function toggleTheme() {
    var next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyToBody(next);
  }

  function createButton() {
    if (document.querySelector('.theme-toggle')) return;
    btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Tema almashtirish');
    var theme = getTheme();
    btn.textContent = theme === 'light' ? '🌙' : '☀️';
    btn.title = theme === 'light' ? 'Qora rejimga o\'tish' : 'Oq rejimga o\'tish';
    btn.addEventListener('click', toggleTheme);
    document.body.appendChild(btn);
  }

  // ── Darhol ishga tushirish ──────────────────────────────────────────────
  // 1. Sahifa yuklanishida darhol temani qo'llash
  applyTheme(getTheme());

  // 2. DOMContentLoaded da tugma yaratish
  document.addEventListener('DOMContentLoaded', function () {
    createButton();
    // Tugma yaratilgandan keyin ikonni yangilash
    applyToBody(getTheme());
  });
})();

/* Mini-CEO Кейс 5 — script (адаптировано из Т-Спорт v3) */

/* ── Utils ──────────────────────────────────────────────────── */
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function getSlides() { return Array.from(document.querySelectorAll('.slide')); }

/* ── Toast ──────────────────────────────────────────────────── */
function toast(message, duration) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove('is-visible'), duration || 2600);
}

/* ── RAF-throttled scroll handler ───────────────────────────── */
let _rafPending = false;
function onScroll() {
  if (_rafPending) return;
  _rafPending = true;
  requestAnimationFrame(() => {
    _rafPending = false;
    setProgress();
    updateActiveNav();
    updateSectionCounter();
  });
}

/* ── Progress bar ───────────────────────────────────────────── */
function setProgress() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const max = (doc.scrollHeight || 1) - doc.clientHeight;
  const pct = max <= 0 ? 0 : (scrollTop / max) * 100;
  bar.style.width = clamp(pct, 0, 100) + '%';
}

/* ── Active nav ─────────────────────────────────────────────── */
function updateActiveNav() {
  const links = Array.from(document.querySelectorAll('.nav__link, .side-nav__link'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const topOffset = 110;
  let activeId = sections[0] ? sections[0].id : null;
  for (const sec of sections) {
    if (sec.getBoundingClientRect().top - topOffset <= 0) activeId = sec.id;
  }
  for (const a of links) {
    a.classList.toggle('is-active', a.getAttribute('href').slice(1) === activeId);
  }
}

/* ── Section counter ────────────────────────────────────────── */
function updateSectionCounter() {
  const counter = document.getElementById('sectionCounter');
  if (!counter) return;
  const slides = getSlides();
  if (!slides.length) return;
  const topOffset = 120;
  let idx = 0;
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].getBoundingClientRect().top - topOffset <= 0) idx = i;
  }
  counter.textContent = (idx + 1) + ' / ' + slides.length;
}

/* ── Mobile nav ─────────────────────────────────────────────── */
function setupMobileNav() {
  const btn = document.querySelector('.nav__toggle');
  const menu = document.getElementById('navMenu');
  if (!btn || !menu) return;

  function close() {
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  }
  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  menu.addEventListener('click', e => { if (e.target?.closest('a')) close(); });
  document.addEventListener('click', e => {
    if (!menu.classList.contains('is-open')) return;
    if (!menu.contains(e.target) && !btn.contains(e.target)) close();
  });
}

/* ── Theme toggle ───────────────────────────────────────────── */
function setupTheme() {
  const THEME_KEY = 'miniceo:theme';
  const btn  = document.getElementById('themeToggle');
  const root = document.documentElement;

  function applyTheme(dark) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch {}
    // Re-init Mermaid with matching theme
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'default',
        flowchart: { curve: 'basis', padding: 20 },
        securityLevel: 'loose'
      });
      // Re-render all mermaid diagrams
      document.querySelectorAll('.mermaid').forEach(el => {
        const code = el.getAttribute('data-mermaid-src') || el.textContent;
        if (!el.getAttribute('data-mermaid-src')) {
          el.setAttribute('data-mermaid-src', code.trim());
        }
        el.removeAttribute('data-processed');
        el.innerHTML = code.trim();
      });
      window.mermaid.run({ querySelector: '.mermaid' }).catch(() => {});
    }
  }

  const saved = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
  // По умолчанию — светлая тема. Тёмная только если пользователь её явно включил ранее.
  applyTheme(saved === 'dark');

  btn?.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') !== 'dark');
  });
}

/* ── Presentation mode ──────────────────────────────────────── */
function setupPresentationMode() {
  const btn = document.getElementById('presentationToggle');
  if (!btn) return;

  function set(on) {
    document.body.classList.toggle('is-presentation', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.documentElement.style.scrollBehavior = on ? 'auto' : '';
    try { localStorage.setItem('miniceo:presentation', on ? '1' : '0'); } catch {}
    toast(on ? 'Режим презентации включён — клавиши ↑↓ / PgUp PgDn' : 'Режим презентации выключен');
    if (on) {
      const slides = getSlides();
      const current = slides.find(s => {
        const r = s.getBoundingClientRect();
        return r.top >= 0 && r.top < window.innerHeight;
      });
      (current || slides[0])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  btn.addEventListener('click', () => set(!document.body.classList.contains('is-presentation')));

  try { if (localStorage.getItem('miniceo:presentation') === '1') set(true); } catch {}

  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('is-presentation')) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const prev = new Set(['ArrowUp', 'PageUp']);
    const next = new Set(['ArrowDown', 'PageDown', ' ']);
    if (!prev.has(e.key) && !next.has(e.key)) return;
    e.preventDefault();
    const slides = getSlides();
    const topOffset = 120;
    let idx = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].getBoundingClientRect().top - topOffset <= 0) idx = i;
    }
    const target = clamp(next.has(e.key) ? idx + 1 : idx - 1, 0, slides.length - 1);
    slides[target].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ── Anchor links on h2 ─────────────────────────────────────── */
function setupAnchorLinks() {
  document.querySelectorAll('.section h2').forEach(h2 => {
    const section = h2.closest('.slide');
    if (!section?.id) return;
    h2.style.cursor = 'default';
    h2.style.position = 'relative';

    const anchor = document.createElement('a');
    anchor.href = '#' + section.id;
    anchor.className = 'h2-anchor';
    anchor.setAttribute('aria-label', 'Ссылка на раздел');
    anchor.textContent = '#';
    h2.appendChild(anchor);

    anchor.addEventListener('click', e => {
      e.preventDefault();
      history.pushState(null, '', '#' + section.id);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigator.clipboard?.writeText(location.href).then(() =>
        toast('Ссылка на раздел скопирована')
      ).catch(() => toast('Ссылка: ' + location.href, 3500));
    });
  });
}

/* ── PDF export ─────────────────────────────────────────────── */
function setupPdfExport() {
  const btn = document.getElementById('exportPdfButton');
  if (!btn) return;
  btn.addEventListener('click', () => {
    toast('Открывается диалог печати — выберите «Сохранить как PDF»', 3500);
    btn.disabled = true;
    btn.textContent = 'Подготовка…';
    window.setTimeout(() => {
      window.print();
      btn.disabled = false;
      btn.textContent = 'Скачать PDF';
    }, 500);
  });
}

/* ── Scroll reveal ──────────────────────────────────────────── */
function setupScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll(
    '.card, .panel, .metric, .timeline__item, .story-item, ' +
    '.hero__kpi-item, .callout, .rm-summary-item, .persona-card'
  );
  if (!('IntersectionObserver' in window)) return;
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition =
      `opacity .5s ${(i % 6) * 0.06}s cubic-bezier(.16,1,.3,1), ` +
      `transform .5s ${(i % 6) * 0.06}s cubic-bezier(.16,1,.3,1)`;
  });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ── Mermaid init ───────────────────────────────────────────── */
function setupMermaid() {
  if (!window.mermaid) return;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaid.initialize({
    startOnLoad: true,
    theme: dark ? 'dark' : 'default',
    flowchart: { curve: 'basis', padding: 20 },
    securityLevel: 'loose'
  });
}

/* ── Roadmap ────────────────────────────────────────────────── */
function setupRoadmap() {
  const phaseData = {
    1: { title: 'Фаза 1 — Базовый функционал', dur: '3 мес',
         items: ['Регистрация и профиль пользователя','Персональная программа тренировок (базовая)','Выполнение тренировки с отслеживанием прогресса','Базовый план питания с рецептами','Отслеживание питания (ручной ввод)','Каталог статей (базовый)','Push-уведомления о тренировках','Интеграция с 3–5 ключевыми партнёрами','Начисление кэшбэка за покупки'] },
    2: { title: 'Фаза 2 — Улучшения MVP', dur: '2 мес',
         items: ['Улучшение алгоритма генерации программ','Видео-инструкции по упражнениям','Статистика и графики прогресса','Сканирование штрих-кодов продуктов','Расширение каталога статей','Улучшение UX на основе обратной связи'] },
    3: { title: 'Фаза 3 — Персонализация и ИИ', dur: '4 мес',
         items: ['ИИ-ассистент для планирования тренировок','Автоматическая корректировка программ','Персональные рекомендации контента','Умные напоминания и мотивация','Интеграция с Apple Health и Google Fit'] },
    4: { title: 'Фаза 4 — Социальные функции', dur: '3 мес',
         items: ['Система достижений и бейджей','Совместные челленджи с друзьями','Рейтинги и лидерборды','Делиться прогрессом в соцсетях','Сообщества по интересам'] },
    5: { title: 'Фаза 5 — B2B и корпорации', dur: '3 мес',
         items: ['Программы для корпоративных клиентов','Командные челленджи для компаний','Интеграция с программами здоровья','Аналитика для HR-отделов'] },
    6: { title: 'Фаза 6 — Расширение контента', dur: '2 мес',
         items: ['Видео-тренировки с тренерами','Онлайн-консультации с диетологами','Вебинары и мастер-классы','Подкасты о здоровье'] },
    7: { title: 'Фаза 7 — Медицинские интеграции', dur: '3 мес',
         items: ['Интеграция с медицинскими сервисами','Синхронизация с лабораторными анализами','Интеграция с умными устройствами','API для сторонних разработчиков'] },
    8: { title: 'Фаза 8 — Мультиплатформенность', dur: '4 мес',
         items: ['Веб-версия приложения','Версия для планшетов','Интеграция с умными телевизорами','Голосовой ассистент (Алиса, Siri)'] }
  };

  const phases = document.querySelectorAll('.rm-phase');
  const detailsRow = document.getElementById('rmDetails');
  if (!phases.length || !detailsRow) return;

  let openGroup = null;
  function getGroup(n) {
    if (n <= 2) return [1, 2];
    if (n <= 5) return [3, 4, 5];
    return [6, 7, 8];
  }

  phases.forEach(ph => {
    ph.addEventListener('click', () => {
      const n = parseInt(ph.dataset.phase);
      const group = getGroup(n);
      const key = group.join('-');
      if (openGroup === key) {
        detailsRow.classList.remove('is-visible');
        phases.forEach(p => p.classList.remove('is-open'));
        openGroup = null;
      } else {
        openGroup = key;
        detailsRow.innerHTML = group.map(id => {
          const d = phaseData[id];
          return `<div class="rm-card">
            <div class="rm-card-header">
              <div class="rm-card-title">${d.title}</div>
              <div class="rm-card-dur">${d.dur}</div>
            </div>
            <ul>${d.items.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>`;
        }).join('');
        detailsRow.classList.add('is-visible');
        phases.forEach(p => {
          p.classList.toggle('is-open', group.includes(parseInt(p.dataset.phase)));
        });
        setTimeout(() => detailsRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      }
    });
  });
}

/* ── Hypotheses view (Kanban / Timeline) ─────────────────── */
function setupHypothesesView() {
  const board = document.querySelector('.hyp-board');
  const switcher = document.querySelector('.view-switcher');
  if (!board || !switcher) return;

  const KEY = 'miniceo:hyp-view';
  const buttons = Array.from(switcher.querySelectorAll('button[data-view]'));
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

  function applyView(view) {
    const target = isMobile() ? 'kanban' : (view === 'timeline' ? 'timeline' : 'kanban');
    board.setAttribute('data-view', target);
    buttons.forEach(b => {
      const active = b.getAttribute('data-view') === target;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    try { localStorage.setItem(KEY, view); } catch {}
  }

  const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
  applyView(saved === 'timeline' ? 'timeline' : 'kanban');

  buttons.forEach(b => {
    b.addEventListener('click', () => applyView(b.getAttribute('data-view')));
  });

  // Хоткеи K / T для переключения вида (только когда ввод не идёт)
  document.addEventListener('keydown', e => {
    if (document.querySelector('.hyp-panel.is-open')) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
    if (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л') applyView('kanban');
    else if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') applyView('timeline');
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const stored = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
      applyView(stored === 'timeline' ? 'timeline' : 'kanban');
    }, 120);
  });

  // Backlog-фильтр (Все / Готов к ревью / Ждёт ресурса)
  setupBacklogFilter();

  // Timeline: hover на лейн-карточке → подсветка её периода на оси
  setupTimelineHoverHighlight();
}

function setupBacklogFilter() {
  const filter = document.querySelector('.hyp-column[data-status="backlog"] .hyp-filter');
  if (!filter) return;
  const buttons = Array.from(filter.querySelectorAll('button[data-filter]'));
  const cards = Array.from(document.querySelectorAll('.hyp-column[data-status="backlog"] .hyp-card[data-status="backlog"]'));

  function tagOfCard(card) {
    if (card.querySelector('.hyp-card__tag--ready'))  return 'ready';
    if (card.querySelector('.hyp-card__tag--awaits')) return 'awaits';
    return 'all';
  }

  function applyFilter(mode) {
    cards.forEach(c => {
      const t = tagOfCard(c);
      const visible = (mode === 'all') || (mode === t);
      c.setAttribute('data-hidden', visible ? 'false' : 'true');
    });
    buttons.forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-filter') === mode);
      b.setAttribute('aria-pressed', b.getAttribute('data-filter') === mode ? 'true' : 'false');
    });
  }

  buttons.forEach(b => b.addEventListener('click', () => applyFilter(b.getAttribute('data-filter'))));
  applyFilter('all');
}

function setupTimelineHoverHighlight() {
  const rail = document.querySelector('.hyp-timeline__rail');
  const highlight = document.querySelector('.hyp-timeline__highlight');
  if (!rail || !highlight) return;

  const cards = Array.from(document.querySelectorAll('.hyp-timeline__lane .hyp-card'));
  cards.forEach(card => {
    // Native HTML title — браузер сам покажет полный заголовок если он обрезан
    const title = card.querySelector('.hyp-card__title')?.textContent.trim() || '';
    const period = card.querySelector('.hyp-card__period')?.textContent.trim() || '';
    const contrib = card.querySelector('.hyp-card__contrib')?.textContent.trim() || '';
    if (title) card.setAttribute('title', `${title} · ${period} · ${contrib}`);

    card.addEventListener('mouseenter', () => {
      const start = parseFloat(card.style.getPropertyValue('--start')) || 1;
      const end   = parseFloat(card.style.getPropertyValue('--end'))   || 1;
      const left  = ((start - 1) / 23) * 100;
      const width = ((end - start) / 23) * 100;
      highlight.style.left  = left + '%';
      highlight.style.width = Math.max(width, 1.5) + '%';
      rail.classList.add('is-highlighting');
    });
    card.addEventListener('mouseleave', () => {
      rail.classList.remove('is-highlighting');
    });
  });
}

/* ── Hypothesis detail panel (drawer) ─────────────────────── */
function setupHypothesesPanel() {
  const panel    = document.querySelector('.hyp-panel');
  const backdrop = document.querySelector('.hyp-panel-backdrop');
  if (!panel || !backdrop || !window.HYPOTHESES_DATA) return;

  const orderInData = Object.keys(window.HYPOTHESES_DATA);

  let currentId = null;
  let lastTrigger = null;

  function render(id) {
    const data = window.HYPOTHESES_DATA[id];
    if (!data) return;

    panel.setAttribute('data-status', data.status);
    panel.querySelector('.hyp-panel__status').setAttribute('data-status', data.status);
    panel.querySelector('.hyp-panel__status').textContent =
      data.status === 'plan' ? 'В плане' :
      data.status === 'validate' ? 'Проверяю' : 'Backlog';

    panel.querySelector('.hyp-panel__title').textContent = data.title;
    panel.querySelector('.hyp-panel__period').textContent = data.period;
    panel.querySelector('.hyp-panel__contrib').textContent = data.contrib;

    // Поля
    setText(panel, 'goal', data.goal);
    setList(panel, 'team', data.team, item =>
      `<li><b>${escape(item.role)}</b><small>${escape(item.load || '')}</small></li>`
    );
    setList(panel, 'steps', data.steps, item => `<li>${escape(item)}</li>`);
    setText(panel, 'validate', data.validate);
    setList(panel, 'counterMetrics', data.counterMetrics, item => `<li>${escape(item)}</li>`);
    setList(panel, 'risks', data.risks, item =>
      `<li><b>${escape(item.name)}</b><small>${escape(item.mitigation || '')}</small></li>`
    );
    setText(panel, 'dependencies', data.dependencies);

    // Counter
    const idx = orderInData.indexOf(id);
    panel.querySelector('.hyp-panel__counter').textContent =
      `${idx + 1} / ${orderInData.length}`;
    panel.querySelector('.hyp-panel__prev').disabled = idx <= 0;
    panel.querySelector('.hyp-panel__next').disabled = idx >= orderInData.length - 1;
  }

  function setText(root, field, value) {
    const sec = root.querySelector(`section[data-field="${field}"]`);
    if (!sec) return;
    if (value && String(value).trim()) {
      sec.querySelector('p').textContent = value;
      sec.hidden = false;
    } else {
      sec.hidden = true;
    }
  }

  function setList(root, field, items, formatter) {
    const sec = root.querySelector(`section[data-field="${field}"]`);
    if (!sec) return;
    const list = sec.querySelector('ul, ol');
    if (Array.isArray(items) && items.length) {
      list.innerHTML = items.map(formatter).join('');
      sec.hidden = false;
    } else {
      sec.hidden = true;
    }
  }

  function escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlightActive(id) {
    document.querySelectorAll('.hyp-card.is-active')
      .forEach(c => c.classList.remove('is-active'));
    document.querySelectorAll(`.hyp-card[data-id="${id}"]`)
      .forEach(c => c.classList.add('is-active'));
  }

  function open(id, trigger) {
    if (!window.HYPOTHESES_DATA[id]) return;
    currentId = id;
    lastTrigger = trigger || null;
    render(id);
    panel.classList.add('is-open');
    backdrop.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
    panel.focus();
    highlightActive(id);
    if (history && history.replaceState) history.replaceState(null, '', '#card=' + id);
  }

  function close() {
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    panel.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.hyp-card.is-active')
      .forEach(c => c.classList.remove('is-active'));
    if (history && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    currentId = null;
  }

  function navigate(direction) {
    if (!currentId) return;
    const idx = orderInData.indexOf(currentId);
    if (idx < 0) return;
    const next = idx + direction;
    if (next < 0 || next >= orderInData.length) return;
    open(orderInData[next], null);
  }

  // Click triggers
  document.querySelectorAll('.hyp-card[data-id]').forEach(card => {
    card.addEventListener('click', () => open(card.dataset.id, card));
  });

  // Panel controls
  panel.querySelector('.hyp-panel__close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  panel.querySelector('.hyp-panel__prev').addEventListener('click', () => navigate(-1));
  panel.querySelector('.hyp-panel__next').addEventListener('click', () => navigate(1));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!panel.classList.contains('is-open')) return;
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') { e.preventDefault(); navigate(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'k' || e.key === 'K') { e.preventDefault(); navigate(1); }
  });

  // Hash routing on initial load
  if (location.hash.startsWith('#card=')) {
    const id = location.hash.slice('#card='.length);
    if (window.HYPOTHESES_DATA[id]) {
      setTimeout(() => {
        document.getElementById('b3-hypotheses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        open(id, null);
      }, 100);
    }
  }
}

/* ── Hypothesis search ─────────────────────────────────────── */
function setupHypothesesSearch() {
  const input = document.querySelector('.hyp-search');
  const counter = document.querySelector('.hyp-search__count');
  if (!input) return;

  // Уникальные карточки для подсчёта
  const allCards = Array.from(document.querySelectorAll('.hyp-card[data-id]'));
  const uniqueIds = Array.from(new Set(allCards.map(c => c.dataset.id)));

  function searchableText(card) {
    return [
      card.querySelector('.hyp-card__title')?.textContent || '',
      card.querySelector('.hyp-card__body')?.textContent || '',
      card.querySelector('.hyp-card__meta')?.textContent || '',
      Array.from(card.querySelectorAll('.hyp-card__tag')).map(t => t.textContent).join(' '),
      card.querySelector('.hyp-card__artifact')?.textContent || '',
    ].join(' ').toLowerCase();
  }

  function apply(query) {
    const q = (query || '').trim().toLowerCase();
    const matchedIds = new Set();
    allCards.forEach(card => {
      if (!q) {
        card.removeAttribute('data-search-hidden');
        matchedIds.add(card.dataset.id);
        return;
      }
      const text = searchableText(card);
      if (text.includes(q)) {
        card.removeAttribute('data-search-hidden');
        matchedIds.add(card.dataset.id);
      } else {
        card.setAttribute('data-search-hidden', 'true');
      }
    });
    if (counter) {
      counter.textContent = q
        ? `Найдено: ${matchedIds.size} из ${uniqueIds.length}`
        : '';
    }
  }

  let t = null;
  input.addEventListener('input', () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => apply(input.value), 80);
  });
  input.addEventListener('search', () => apply(input.value));
}

/* ── Boot ───────────────────────────────────────────────────── */
document.addEventListener('scroll', onScroll, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupMermaid();
  setupMobileNav();
  setupPresentationMode();
  setupPdfExport();
  setupAnchorLinks();
  setupScrollReveal();
  setupRoadmap();
  setupHypothesesView();
  setupHypothesesPanel();
  setupHypothesesSearch();

  // Reduced motion hint
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toast('Включено уменьшение анимации', 2600);
  }

  setProgress();
  updateActiveNav();
  updateSectionCounter();
});

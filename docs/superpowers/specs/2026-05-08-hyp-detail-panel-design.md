# Блок 3.5: drawer-панель с детализацией + UX-полировка Kanban/Timeline

**Дата:** 2026-05-08
**Ветка:** `extra-content-supplements`
**Контекст:** уже существующая секция `b3-hypotheses` с Kanban + Timeline режимами и 19 карточками. Сейчас детализация ограничена 1–2 строками тела карточки + tooltip. Нужно — полный «рабочий лист» по каждой инициативе при клике + полировка интерфейса обоих видов.

## Проблема

Текущая карточка показывает только: название, период, плановый вклад, 1 строка обоснования и (для backlog) теги ресурс/статус + артефакт. Этого хватает «обзорно», но проверяющий PM не видит:

- кого конкретно привлечь и в каком объёме нагрузки
- из каких 3–5 шагов состоит инициатива (декомпозиция)
- как валидируется результат (артефакт + метрики)
- какие риски специфичны для этой инициативы (не общие)
- какие контр-метрики мониторим
- какие зависимости с другими инициативами

Эта информация существует в разделах 3.4 (roadmap), 3.6 (приоритеты), 3.7 (метрики), 3.8 (риски), 3.9 (целевое состояние) — но рассыпана по разным таблицам. На карточке её нет.

Дополнительно: **сам интерфейс Kanban/Timeline не подсказывает что карточки кликабельны**, нет sticky-заголовков при скролле, нет быстрой клиентской фильтрации.

## Цели

1. По клику на любую карточку (plan / validate / backlog) открывается **side-panel (drawer)** справа с полной детализацией инициативы.
2. Содержимое панели — структурированный «рабочий лист» из 7 полей: цель, команда, декомпозиция, валидация, контр-метрики, риски, зависимости.
3. Между карточками одной категории навигация ← → не закрывая панель.
4. **Sticky-заголовки колонок** в Kanban и **sticky M-axis + волны** в Timeline при вертикальном скролле.
5. **Клиентский search** по тексту в шапке секции.
6. Карточки визуально подсказывают кликабельность (cursor:pointer, hover-усиление, активная карточка подсвечена пока drawer открыт).
7. Все взаимодействия адаптируются на mobile (≤720px) и **не печатаются** в PDF.

## Не-цели

- Не делаем drag-drop, edit, multi-select — это не live-доска.
- Не меняем содержимое 19 карточек (title, period, contrib) — оно зафиксировано.
- Не трогаем разделы 3.1–3.4, 3.6–3.9 — данные оттуда копируются в HYPOTHESES_DATA, источник истины остаётся в этих разделах.
- Не делаем fullscreen-модалку, bottom-sheet, overlay — выбран drawer.
- Не вводим новые идеи в данные карточек — только распаковываем существующие тезисы по полям.

## Решение одним абзацем

В `index.html` добавляется фиксированный `<aside class="hyp-panel">` справа, изначально скрытый через `transform: translateX(100%)`. Каждой карточке (Kanban и Timeline) добавляется атрибут `data-id`. JS-объект `HYPOTHESES_DATA` с 19 записями хранится в `assets/script.js`. Клик на карточку → находит запись по `data-id` → рендерит её в drawer → анимирует in. Esc / X / клик-вне / клавиши ← → управляют состоянием. Параллельно добавляются `position: sticky` для шапок колонок и оси Timeline, search-input в шапке секции, hover/cursor-полировка карточек.

## Архитектура

### Компонент 1 — Drawer (HTML)

```html
<aside class="hyp-panel" aria-hidden="true" role="dialog" aria-labelledby="hyp-panel-title" tabindex="-1">
  <header class="hyp-panel__header">
    <span class="hyp-panel__status" data-status=""></span>
    <button type="button" class="hyp-panel__close" aria-label="Закрыть">×</button>
  </header>

  <div class="hyp-panel__hero">
    <h3 id="hyp-panel-title" class="hyp-panel__title"></h3>
    <div class="hyp-panel__meta">
      <span class="hyp-panel__period"></span>
      <span class="hyp-panel__contrib"></span>
    </div>
  </div>

  <div class="hyp-panel__body">
    <section data-field="goal">          <h4>Цель</h4>           <p></p> </section>
    <section data-field="team">          <h4>Команда</h4>        <ul></ul> </section>
    <section data-field="steps">         <h4>Декомпозиция</h4>   <ol></ol> </section>
    <section data-field="validate">      <h4>Что проверяем</h4>  <p></p> </section>
    <section data-field="counterMetrics"><h4>Контр-метрики</h4>  <ul></ul> </section>
    <section data-field="risks">         <h4>Риски</h4>          <ul></ul> </section>
    <section data-field="dependencies">  <h4>Зависимости</h4>    <p></p> </section>
  </div>

  <footer class="hyp-panel__nav">
    <button type="button" class="hyp-panel__prev" aria-label="Предыдущая">← Пред.</button>
    <span class="hyp-panel__counter">1 / 19</span>
    <button type="button" class="hyp-panel__next" aria-label="Следующая">След. →</button>
  </footer>
</aside>

<div class="hyp-panel-backdrop" aria-hidden="true"></div>
```

Один drawer на странице, переиспользуется. Backdrop — невидимый, ловит клики-за-пределами для close. Поля не отображаются если в данных нет соответствующего ключа (graceful skip).

### Компонент 2 — Data (HYPOTHESES_DATA)

В `assets/script.js` (или вынести в `assets/hypotheses-data.js` для read-only):

```js
const HYPOTHESES_DATA = {
  'recl-22-7': {
    title: 'Реклассификация 22,7%',
    status: 'plan',
    period: 'М1–М3',
    contrib: '+0–1 п.п. (резерв года 2)',
    goal: 'Разбираем 22,7% неклассифицированных переводов на оператора. Без этой работы roadmap года 2 строится вслепую — главный резерв «Новые сценарии из 22,7%» (+7–9 п.п.) опирается именно на эти данные.',
    team: [
      { role: 'ML-инженер', load: 'основная' },
      { role: 'Аналитик',  load: 'разметка/QA' },
      { role: '1 dev',     load: 'частично, инфра' },
    ],
    steps: [
      'Выборка ≥10k чатов из категории «неклассифицированы»',
      'Кластеризация эмбеддингами (offline) → 30–50 кандидатов-причин',
      'Ручная проверка топ-кластеров аналитиком',
      'Группировка в продуктовые причины (covered / coverage / context / etc.)',
      'Новая карта причин → backlog для волн 2–4',
    ],
    validate: 'Карта новых причин с долями (≥80% бывших 22,7% классифицированы). Готовится к концу М3.',
    counterMetrics: [
      'Размер выборки даёт стат. значимость',
      'Repeat-contact-7d по новым категориям',
    ],
    risks: [
      { name: 'Внутри 22,7% мало массовых безопасных причин', mitigation: 'План года 2 пересобирается, усиливаются другие кластеры' },
    ],
    dependencies: 'Открывает резерв для «Новые сценарии из 22,7%» (М13–М21, +7–9 п.п.)',
  },

  // ... 18 остальных записей с теми же ключами
};
```

Все 19 записей собираются распаковкой существующего материала из 3.4–3.9. Где данных в исходниках нет (например, конкретные шаги декомпозиции для backlog-задачи) — генерация делается консервативно из контекста, без новых тезисов.

### Компонент 3 — JS-логика

Новая функция `setupHypothesesPanel()` в `assets/script.js`, подключается в bootstrap после `setupHypothesesView()`:

```js
function setupHypothesesPanel() {
  const panel    = document.querySelector('.hyp-panel');
  const backdrop = document.querySelector('.hyp-panel-backdrop');
  const cards    = Array.from(document.querySelectorAll('.hyp-card[data-id]'));
  if (!panel || !cards.length) return;

  let currentId = null;
  let lastTrigger = null;

  function open(id, trigger) {
    const data = HYPOTHESES_DATA[id];
    if (!data) return;
    currentId = id;
    lastTrigger = trigger;
    renderPanel(data, id);
    panel.classList.add('is-open');
    backdrop.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
    panel.focus();
    highlightActive(id);
    updateHash(id);
  }

  function close() {
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    panel.setAttribute('aria-hidden', 'true');
    clearHighlight();
    clearHash();
    lastTrigger?.focus();
    currentId = null;
  }

  function renderPanel(data, id) { /* подставляет поля, скрывает пустые */ }

  function highlightActive(id) {
    document.querySelectorAll('.hyp-card.is-active').forEach(c => c.classList.remove('is-active'));
    document.querySelectorAll(`.hyp-card[data-id="${id}"]`).forEach(c => c.classList.add('is-active'));
  }

  function navigate(direction) { /* находит соседнюю карточку в той же категории и open() */ }

  // Клики
  cards.forEach(card => card.addEventListener('click', () => open(card.dataset.id, card)));
  panel.querySelector('.hyp-panel__close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  panel.querySelector('.hyp-panel__prev').addEventListener('click', () => navigate(-1));
  panel.querySelector('.hyp-panel__next').addEventListener('click', () => navigate(1));

  // Хоткеи
  document.addEventListener('keydown', e => {
    if (!panel.classList.contains('is-open')) return;
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') navigate(-1);
    else if (e.key === 'ArrowRight' || e.key === 'k' || e.key === 'K') navigate(1);
  });

  // Хеш для shareable links
  if (location.hash.startsWith('#card=')) {
    const id = location.hash.slice('#card='.length);
    if (HYPOTHESES_DATA[id]) open(id, null);
  }
}
```

### Компонент 4 — CSS drawer

```css
.hyp-panel {
  position: fixed;
  top: 64px; right: 0;             /* topbar = 64px из --topbar */
  width: 420px; max-width: 92vw;
  height: calc(100vh - 64px);
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 24px rgba(0,0,0,0.10);
  transform: translateX(100%);
  transition: transform .28s cubic-bezier(.16,1,.3,1);
  overflow-y: auto;
  z-index: 100;
  display: flex; flex-direction: column;
}
.hyp-panel.is-open { transform: translateX(0); }

.hyp-panel-backdrop {
  position: fixed; inset: 64px 0 0 0;
  background: transparent;
  pointer-events: none;
  z-index: 99;
}
.hyp-panel-backdrop.is-visible { pointer-events: auto; }

@media (max-width: 720px) {
  .hyp-panel { top: 0; height: 100vh; width: 100%; max-width: 100%; }
  .hyp-panel-backdrop { inset: 0; background: rgba(0,0,0,0.40); }
}

@media (prefers-reduced-motion: reduce) {
  .hyp-panel { transition: none; }
}

@media print {
  .hyp-panel, .hyp-panel-backdrop { display: none !important; }
}
```

Типография разделов внутри панели наследует общие стили проекта (font-display для h4, font-body для текста, цветовые vars).

### Компонент 5 — UX-улучшения интерфейса

**Sticky-шапки колонок Kanban:**
```css
.hyp-board[data-view="kanban"] .hyp-column__head {
  position: sticky;
  top: 64px;  /* высота topbar */
  z-index: 5;
  backdrop-filter: blur(8px);
}
```

**Sticky M-axis + waves в Timeline:**
```css
.hyp-board[data-view="timeline"] .hyp-timeline__rail > :not(.hyp-timeline__lanes):not(.hyp-timeline__highlight) {
  position: sticky;
  top: 64px;
  z-index: 4;
  background: var(--surface);
}
```

**Search-input в шапке секции:**
```html
<input type="search" class="hyp-search" placeholder="Поиск по карточкам…" aria-label="Поиск">
```
JS: на `input` событие фильтрует карточки по совпадению с title + body + теги (case-insensitive). Невидимые получают `data-hidden="true"` (тот же механизм, что у backlog-фильтра). Для timeline-вида карточки которые не подходят — opacity 0.25 (а не скрыты), чтобы Gantt-структура не ломалась.

**Полировка карточек:**
- `cursor: pointer` на всех `.hyp-card[data-id]`
- `.hyp-card.is-active` → золотая обводка (border-color: var(--yellow); box-shadow: 0 0 0 3px rgba(255,221,45,0.20))
- Усиление `:hover` → translateY(-3px), shadow глубже

### Компонент 6 — Data-id атрибуты на карточках

Каждая из 19 + 11 (timeline дубли) карточек получает `data-id="<short-key>"`:
- `recl-22-7`, `ux-exit`, `tech-stab`, `gap-scen`, `context-fu`, `formul-slots`, `pre-triage`, `new-22-7`, `seg-safe` (9 plan)
- `seg-split`, `vip-pilot` (2 validate)
- `multi`, `mem-sess`, `gen-bot`, `debt`, `frustration`, `op-summary`, `proactive`, `voice` (8 backlog)

Timeline-копия использует тот же `data-id` — drawer открывается одинаково независимо от вида.

## Адаптив и печать

| Ширина | Drawer |
|---|---|
| ≥1024 px | 420 px справа, доска видна слева |
| 720–1024 px | 420 px справа, доска сужается, scroll внутри панели |
| <720 px | fullscreen sheet, top: 0, ширина 100%, backdrop полупрозрачный затемняющий |

Печать: `.hyp-panel { display: none }` через `@media print`. Карточки печатаются в Kanban-виде как есть.

## Тестирование через playwright

После имплементации прогоняется `/tmp/pwtest/panel.js`:

1. **Click на каждую из 19 карточек** → панель открывается → проверка что title, period, contrib, все 7 полей содержимого корректны (по эталону из HYPOTHESES_DATA)
2. **Esc** → close
3. **X-button** → close
4. **Click backdrop** → close
5. **← / J** → переход к предыдущей карточке той же категории (циклически)
6. **→ / K** → переход к следующей
7. **Mobile 414px** → fullscreen, backdrop с затемнением
8. **Search «контекст»** → фильтрует карточки, видны только содержащие подстроку (case-insensitive)
9. **Sticky headers Kanban** при `page.evaluate(() => window.scrollBy(0, 600))` → проверка что `getBoundingClientRect().top` шапки ≤ 64px
10. **Hash routing**: `goto('#card=recl-22-7')` → панель открыта на правильной карточке
11. **0 console errors** во всех сценариях

## CSS-namespace

Новые классы под префиксом `.hyp-panel-*` и `.hyp-search`:
- `.hyp-panel`, `.hyp-panel.is-open`, `.hyp-panel-backdrop`, `.hyp-panel-backdrop.is-visible`
- `.hyp-panel__header`, `.hyp-panel__status`, `.hyp-panel__close`
- `.hyp-panel__hero`, `.hyp-panel__title`, `.hyp-panel__meta`, `.hyp-panel__period`, `.hyp-panel__contrib`
- `.hyp-panel__body`, `[data-field="goal|team|steps|validate|counterMetrics|risks|dependencies"]`
- `.hyp-panel__nav`, `.hyp-panel__prev`, `.hyp-panel__next`, `.hyp-panel__counter`
- `.hyp-search`
- `.hyp-card.is-active` (модификатор существующего)

## Definition of Done

- В `index.html` существует `<aside class="hyp-panel">` с правильной структурой 7 полей.
- В `assets/script.js` определён `HYPOTHESES_DATA` с **19 записями** (9 plan + 2 validate + 8 backlog), каждая содержит `title, status, period, contrib, goal, team, steps, validate, counterMetrics, risks, dependencies`.
- Все 19 уникальных карточек получили `data-id`, и timeline-копии используют те же id (без дубликации записей данных).
- `setupHypothesesPanel()` подключён в bootstrap script.js после `setupHypothesesView()`.
- **Sticky** работает: шапки колонок при kanban-scroll, M-axis при timeline-scroll.
- **Search-input** мгновенно фильтрует.
- Карточки **визуально кликабельны** (cursor, hover, active-state).
- **Esc / X / backdrop / ← → / J K** работают как описано.
- **Hash-routing** `#card=<id>` открывает соответствующую карточку.
- **Mobile** drawer fullscreen, backdrop затемняет.
- **Печать** не показывает drawer.
- HTML валиден (балансер не ругается).
- **Все playwright-тесты** в `panel.js` зелёные, **0 console errors**.
- Никаких изменений в коротком PDF (`IarochkinMiniCEO.pdf`).

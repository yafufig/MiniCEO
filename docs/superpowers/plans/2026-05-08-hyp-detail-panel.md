# Hyp Detail Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать выезжающую справа панель с подробной информацией по каждой из 19 инициатив раздела 3.5 (Kanban + Timeline) + UX-полировку обоих видов (sticky-заголовки, search, hover-подсказки кликабельности).

**Architecture:** Один общий `<aside class="hyp-panel">` справа в `index.html`, скрыт через `transform: translateX(100%)`. Данные хранятся в `assets/hypotheses-data.js` как объект `HYPOTHESES_DATA[id]` с 19 записями. Каждой карточке (Kanban-копия и Timeline-копия одной инициативы) присваивается общий `data-id`, JS подтягивает запись и рендерит в drawer. Esc / X / backdrop / ← → / J K управляют состоянием. Параллельно добавляются `position: sticky` для шапок колонок Kanban и оси Timeline, search-input в шапке секции.

**Tech Stack:** vanilla HTML/CSS/JS (без сборки), Mermaid (уже подключён), Manrope/Unbounded шрифты, Playwright для e2e-проверок (уже установлен в `/tmp/pwtest/`).

**Files Structure:**

- **Create:**
  - `assets/hypotheses-data.js` — объект `HYPOTHESES_DATA` с 19 записями, подключается через `<script src>` до `script.js`
  - `/tmp/pwtest/panel.js` — playwright e2e-тест (вне репо, для проверки)

- **Modify:**
  - `index.html` — добавление `data-id` на 30 карточек (19 уникальных в Kanban + 11 копий в Timeline), HTML drawer + backdrop + search-input, CSS-блоки для drawer/sticky/search/active/hover, подключение `hypotheses-data.js`
  - `assets/script.js` — функции `setupHypothesesPanel()`, `setupHypothesesSearch()`; их вызов в `DOMContentLoaded`

**Branch:** `extra-content-supplements` (текущая, продолжаем в ней)

---

### Task 1: HYPOTHESES_DATA — структура и образцы

**Files:**
- Create: `/root/project/MiniCEO/assets/hypotheses-data.js`
- Modify: `/root/project/MiniCEO/index.html` (подключение script)

- [ ] **Step 1: Создать `assets/hypotheses-data.js` с 19 записями**

Каждая запись имеет ключи: `title, status, period, contrib, goal, team[], steps[], validate, counterMetrics[], risks[], dependencies`.

Контент каждой записи распаковывается из существующих разделов: `b3-roadmap` (3.4 для team/period/contrib), `b3-priorities` (3.6 для обоснования и trade-offs), `b3-metrics` (3.7 для контр-метрик), `b3-risks` (3.8 для рисков), `b3-final` (3.9 для целевого состояния), а также комментариев в bodi `b3-hypotheses` карточек.

Полная заготовка файла:

```js
/* Mini-CEO · Hypotheses & backlog detail data
 * Используется setupHypothesesPanel() в script.js.
 * Source of truth для team/period/contrib — раздел 3.4 (b3-roadmap).
 */
const HYPOTHESES_DATA = {

  /* ── 9 plan ─────────────────────────────────────────────── */

  'recl-22-7': {
    title: 'Реклассификация 22,7%',
    status: 'plan',
    period: 'М1–М3',
    contrib: '+0–1 п.п. (резерв года 2)',
    goal: 'Разбираем 22,7% неклассифицированных переводов на оператора. Без этой работы план года 2 строится вслепую — главный резерв «Новые сценарии из 22,7%» (+7–9 п.п.) опирается именно на эти данные.',
    team: [
      { role: 'ML-инженер', load: 'основная' },
      { role: 'Аналитик',   load: 'разметка/QA' },
      { role: 'Dev',        load: 'частично, инфра выгрузки' },
    ],
    steps: [
      'Выборка ≥10k чатов из категории «неклассифицированы»',
      'Кластеризация эмбеддингами (offline) → 30–50 кандидатов-причин',
      'Ручная проверка топ-кластеров аналитиком',
      'Группировка в продуктовые причины (coverage / context / etc.)',
      'Новая карта причин → backlog для волн 2–4',
    ],
    validate: 'Карта новых причин с долями, ≥80% бывших 22,7% классифицированы. Готовится к концу М3.',
    counterMetrics: [
      'Размер выборки даёт стат. значимость',
      'Repeat-contact-7d по новым категориям не растёт',
    ],
    risks: [
      { name: '22,7% окажутся неавтоматизируемыми', mitigation: 'Пересборка года 2: усиливаем сценарии, контекст, безопасные сегменты' },
      { name: 'Перегруз ML-инженера', mitigation: 'Не запускаю одновременно реклассификацию, маршрутизацию и сложную память' },
    ],
    dependencies: 'Открывает резерв для «Новые сценарии из 22,7%» (М13–М21, +7–9 п.п.). Без этой работы карточка #8 не запустится.',
  },

  'ux-exit': {
    title: 'UX-выход из сценария',
    status: 'plan',
    period: 'М1–М2',
    contrib: '+0,5–0,8 п.п.',
    goal: 'Из Блока 2: распознавание команд «отмена / назад / вернуться» внутри сценария вместо fallback на оператора. Гипотеза проверяется в Q1 на логах перед эскалацией — диапазон вклада зависит от подтверждённой доли UX-спровоцированных эскалаций.',
    team: [
      { role: 'Dev', load: '1 человек, основная' },
      { role: 'Дизайнер', load: 'частично, мокапы из Блока 2' },
      { role: 'Аналитик', load: 'разбор логов перед эскалацией' },
    ],
    steps: [
      'Q1: лог-разбор сообщений перед вызовом оператора (текст, шаг сценария)',
      'Подсчёт реальной доли «отмена / назад» внутри 0,8% «оператор в середине» + 0,4% «хочет закончить»',
      'Слой 1: распознавание команды на стороне агента до fallback (как «оператор»)',
      'Слой 2: кнопка «Отменить вызов оператора» в окне ожидания + новый reason-код accidental_operator_call',
      'Постепенная раскатка 10/25/50/100% с откатом по cancel-rate и CSAT',
    ],
    validate: 'Доля «оператор в середине» падает на подтверждённую часть; cancel-rate новой кнопки ≥ ожидаемой доли.',
    counterMetrics: [
      'CSAT сценария не падает',
      'Доступность оператора для реальных запросов не ухудшается',
      'Repeat-contact-24h не растёт',
    ],
    risks: [
      { name: 'Размер UX-проблемы окажется меньше ожидаемого', mitigation: 'Не считаю +0,5–0,8 гарантированными до Q1-проверки' },
      { name: 'Команда «отмена» в нужном сценарии трактуется неоднозначно', mitigation: 'Возврат на предыдущий шаг сценария, а не выход целиком' },
    ],
    dependencies: 'Опирается на лог-инфраструктуру (есть). Решает «UX-спровоцированные эскалации» — гипотеза 3.5, поглощённая этой инициативой.',
  },

  'tech-stab': {
    title: 'Техническая стабильность',
    status: 'plan',
    period: 'М1–М12 фоном',
    contrib: '+0,5–1,5 п.п.',
    goal: 'Чиню технические ошибки, неверные/слишком общие ответы, падения сценариев. Это не главный рост, но защита CSAT — без техстабильности рост automation легко достигается формально (клиент бросает чат).',
    team: [
      { role: 'Dev', load: '1 человек фоном весь год 1' },
    ],
    steps: [
      'Еженедельный разбор топ-падений и неверных ответов',
      'Алерт на рост технических ошибок > baseline',
      'Точечные фиксы по приоритету (impact × частота)',
      'Без выделенного спринта — параллельно с волнами 2–3',
    ],
    validate: 'Доля технических ошибок (~3,2% сейчас) снижается; CSAT бота не падает на rollout новых сценариев.',
    counterMetrics: [
      'CSAT бота',
      'Ошибочная маршрутизация',
      'Доля технических ошибок',
    ],
    risks: [
      { name: 'Технический долг копится быстрее чем чиним', mitigation: 'Раз в квартал выделяем спринт на чистку, если очередь > 20 фиксов' },
    ],
    dependencies: 'Защищает все остальные инициативы — без техстабильности новые сценарии будут падать.',
  },

  'gap-scen': {
    title: 'Пробелы сценариев',
    status: 'plan',
    period: 'М4–М9',
    contrib: '+5–6,5 п.п.',
    goal: 'Самый прямой кластер — 13,1% (нет ветки / нет ответа / неизвестное намерение). Закрываю 40–50% — это главный фокус года 1.',
    team: [
      { role: 'Dev', load: '3–4 человека, основная' },
      { role: 'Аналитик', load: 'выбор топ-тем' },
      { role: 'Дизайнер', load: 'частично, новые ветки UI' },
    ],
    steps: [
      'Выбор топ-тем по частоте из кластера 13,1%',
      'Дизайн новых веток сценариев + edge cases',
      'Реализация в боте (чат-движок)',
      'Тестовый режим (10% трафика) → проверка repeat-contact + CSAT',
      'Постепенная раскатка 10 → 25 → 50 → 100% с триггерами отката',
    ],
    validate: 'Доля кластера «нет ветки / нет ответа / неизвестное намерение» падает на 40–50%, repeat-contact-7d не растёт.',
    counterMetrics: [
      'Repeat-contact-7d (главный детектор формальной автоматизации)',
      'CSAT по сценарию',
      'Эскалация после ответа бота',
    ],
    risks: [
      { name: 'Новый сценарий ухудшает CSAT', mitigation: 'Откат до прошлой ступени, разбор причины' },
      { name: 'Закрытие сценария формально (клиент бросает чат)', mitigation: 'Не засчитываем рост, если repeat-contact-7d растёт' },
    ],
    dependencies: 'После закрытия пробелов запускается «Контекст и follow-up» (М7–М12) — клиента есть куда направлять.',
  },

  'context-fu': {
    title: 'Контекст и follow-up',
    status: 'plan',
    period: 'М7–М12',
    contrib: '+2,7–3,6 п.п.',
    goal: 'Кластер 9,1%: потерян контекст внутри диалога, уточнения, повтор вопроса. Сложнее сценарных пробелов — поэтому доля закрытия ниже (30–40%).',
    team: [
      { role: 'Dev', load: '1–2 человека, основная' },
      { role: 'ML-инженер', load: 'частично, классификация уточнений' },
    ],
    steps: [
      'Разбор механики ошибки: потеря контекста / неполный ответ / плохой переход',
      'Доработка хранения контекста в текущей сессии',
      'Уточняющие вопросы при неполных ответах',
      'Обработка повторных вопросов после ответа бота',
      'Постепенная раскатка с откатом',
    ],
    validate: 'Доля «продолжение предыдущего диалога / контекст потерян» (5,4%) и «follow-up в тему» (2,3%) падает на 30–40%.',
    counterMetrics: [
      'Repeat-contact-7d',
      'CSAT по сценарию',
      'Среднее число уточнений на диалог',
    ],
    risks: [
      { name: 'Уточняющие вопросы раздражают клиента', mitigation: 'Не более 1 уточнения подряд; A/B на CSAT' },
    ],
    dependencies: 'Запускается ПОСЛЕ первых сценарных доработок — нужны ветки, в которые направлять клиента.',
  },

  'formul-slots': {
    title: 'Формулировки, слоты, маршрутизация',
    status: 'plan',
    period: 'М9–М12',
    contrib: '+1,5–2,3 п.п.',
    goal: 'Кластер 5,8%: формулировки, общий запрос, ошибка интента, несколько сообщений, слоты. Сначала правила и intent-классификация, ML/LLM — второй шаг если правила не дают качества.',
    team: [
      { role: 'ML-инженер', load: 'основная' },
      { role: 'Dev', load: '1 человек' },
    ],
    steps: [
      'Улучшение intent-классификации на топ-ошибках',
      'Правила маршрутизации для общих запросов',
      'Обработка нескольких сообщений в одном интенте',
      'Доработка парсинга слотов (1,3% «бот не смог распарсить»)',
      'ML/LLM-инструменты — только если правила не дают качества',
    ],
    validate: 'Кластер «формулировки/слоты/маршрутизация» падает на 25–40%.',
    counterMetrics: [
      'Ошибочная маршрутизация',
      'Repeat-contact-7d',
      'Cost per automated chat (для ML/LLM)',
    ],
    risks: [
      { name: 'Дорогой ML/LLM без эффекта', mitigation: 'Начинаем с правил; ML/LLM только после проверки' },
    ],
    dependencies: 'Опирается на existence сценариев из «Пробелы сценариев» (М4–М9).',
  },

  'pre-triage': {
    title: 'Pre-triage перед оператором',
    status: 'plan',
    period: 'М9–М15',
    contrib: '+0,7–1,5 п.п.',
    goal: 'Не блокирую оператора: перед переводом предлагаю быстрый проверенный сценарий. Если клиент снова просит человека — перевожу. Кластер «клиент зовёт оператора» 4,9%, реалистичная конверсия 15–30%.',
    team: [
      { role: 'Dev', load: '1 человек' },
      { role: 'Дизайнер', load: 'частично, UI pre-triage' },
      { role: 'Аналитик', load: 'выбор топ-сценариев pre-triage' },
    ],
    steps: [
      'Анализ: какие топ-3 сценария чаще всего «зовут оператора»',
      'Дизайн pre-triage экрана (1 быстрый сценарий + кнопка «всё равно оператор»)',
      'A/B-тест на 10% трафика',
      'Если CSAT не падает и cancel-rate не растёт — раскатка',
    ],
    validate: 'Конверсия pre-triage 15–30%; CSAT не падает; время до оператора у несогласившихся не растёт.',
    counterMetrics: [
      'CSAT по сценарию pre-triage',
      'Cancel-rate (нажатие «всё равно оператор»)',
      'Время ожидания оператора',
    ],
    risks: [
      { name: 'Pre-triage воспринимается как «не дают оператора»', mitigation: 'Кнопка «всё равно оператор» всегда видна; не более 1 шага задержки' },
    ],
    dependencies: 'После закрытия основных сценарных пробелов — иначе нечего предлагать.',
  },

  'new-22-7': {
    title: 'Новые сценарии из 22,7%',
    status: 'plan',
    period: 'М13–М21',
    contrib: '+7–9 п.п.',
    goal: 'Главный резерв года 2. Подтверждённые массовые причины из реклассификации 22,7% превращаются в сценарии бота. Закрываем 30–40% бывшего кластера.',
    team: [
      { role: 'Dev', load: '3–4 человека, основная' },
      { role: 'Аналитик', load: 'приоритизация и QA' },
      { role: 'ML-инженер', load: 'частично, intent для новых причин' },
    ],
    steps: [
      'Берём топ-причины из карты «Реклассификация 22,7%»',
      'Дизайн сценариев (повторно — как в «Пробелы сценариев»)',
      'Реализация по приоритету (размер × безопасность)',
      'Постепенная раскатка с откатом',
      'Параллельно — обновление документации поддержки',
    ],
    validate: 'Доля бывшего кластера 22,7% падает на 30–40%; repeat-contact-7d не растёт.',
    counterMetrics: [
      'Repeat-contact-7d',
      'CSAT по новым сценариям',
      'Доля бывших 22,7% всё ещё неклассифицирована',
    ],
    risks: [
      { name: 'Внутри 22,7% мало массовых безопасных причин', mitigation: 'План года 2 пересобирается, усиливаются другие кластеры' },
    ],
    dependencies: 'ЗАВИСИТ от «Реклассификация 22,7%» (М1–М3). Без неё запуск невозможен.',
  },

  'seg-safe': {
    title: 'Отключённые сегменты: безопасная часть',
    status: 'plan',
    period: 'М16–М24',
    contrib: '+1–3 п.п.',
    goal: 'Только Guest FAQ без авторизации, если разбивка 9,6% покажет значимую безопасную долю. VIP не закладываю в путь к 60%.',
    team: [
      { role: 'Dev', load: '1–2 человека' },
      { role: 'Дизайнер', load: 'частично, гостевой UX' },
      { role: 'Legal', load: 'согласование тем для гостей' },
    ],
    steps: [
      'Опирается на «Разбивка 9,6% сегментов» (Q1)',
      'Согласование с legal: какие темы можно автоматизировать без авторизации',
      'Реализация Guest FAQ',
      'Постепенная раскатка',
    ],
    validate: 'Доля гостевых обращений из 9,6% падает на 50–80% безопасной части.',
    counterMetrics: [
      'Жалобы / эскалации в дорогом сегменте',
      'CSAT гостевых обращений',
    ],
    risks: [
      { name: 'VIP-инцидент', mitigation: 'VIP по умолчанию остаётся у оператора' },
      { name: 'Legal не согласует темы', mitigation: 'Сужаем до подтверждённых safe-only' },
    ],
    dependencies: 'ЗАВИСИТ от «Разбивка 9,6% сегментов» (validate, Q1).',
  },

  /* ── 2 validate ─────────────────────────────────────────── */

  'seg-split': {
    title: '⚑ Разбивка 9,6% сегментов',
    status: 'validate',
    period: 'Q1',
    contrib: 'вклад не закладываю',
    goal: 'Discovery в Q1: разбиваем 9,6% «отключённые сегменты» на VIP / гость / должник. Без этого «Отключённые сегменты безопасная часть» (М16–М24) не получит трафик.',
    team: [
      { role: 'Аналитик', load: 'основная' },
      { role: 'Legal', load: 'консультация по сегментам' },
    ],
    steps: [
      'Выгрузка 9,6% с метаданными сегмента',
      'Сегментация: какая доля VIP, гость, должник',
      'Определение «безопасной» гостевой доли (темы без авторизации)',
      'Финальная карта VIP / гость / должник + безопасная гостевая доля',
    ],
    validate: 'Карта VIP / гость / должник + безопасная гостевая доля. Готова к концу Q1.',
    counterMetrics: [
      'Размер выборки даёт стат. значимость',
    ],
    risks: [
      { name: 'Безопасная гостевая доля окажется маленькой', mitigation: '«Отключённые сегменты безопасная часть» в плане не запускается, год 2 пересобирается' },
    ],
    dependencies: 'Открывает «Отключённые сегменты безопасная часть» (М16–М24).',
  },

  'vip-pilot': {
    title: '⚑ VIP opt-in пилот',
    status: 'validate',
    period: 'М22–М24',
    contrib: 'не источник 60%',
    goal: 'Малый пилот на проверенных сценариях. VIP — 8% базы и 35% выручки, цена ошибки выше потенциала, поэтому это аргумент осторожности, а не источник роста.',
    team: [
      { role: 'Dev', load: '1 человек' },
      { role: 'Аналитик', load: 'выбор сценариев + QA' },
    ],
    steps: [
      'Выбор 1–2 проверенных сценариев с CSAT > 4,5',
      'Opt-in: VIP-клиент сам соглашается на бот',
      'Малый пилот ≤ 5% VIP-базы',
      'Контроль CSAT и эскалаций еженедельно',
      'Решение «расширять или закрыть» по результатам',
    ],
    validate: 'Результат пилота: CSAT не упал, эскалаций не больше чем у оператора.',
    counterMetrics: [
      'CSAT VIP',
      'Эскалации в VIP',
      'Жалобы / churn VIP',
    ],
    risks: [
      { name: 'Жалоба VIP-клиента → репутационный удар', mitigation: 'Пилот opt-in, маленький, всегда есть кнопка «оператор»' },
    ],
    dependencies: 'Не источник для 60% — пилот для года 3+.',
  },

  /* ── 8 backlog ──────────────────────────────────────────── */

  'multi': {
    title: 'Мультимодальные обращения',
    status: 'backlog',
    period: '—',
    contrib: 'до +0,3–0,6 п.п.',
    goal: 'Часть обращений приходит картинкой/файлом — 0,8% «только картинка/файл» + 0,4% «отвечает картинкой внутри сценария». Маленький пул, высокая сложность OCR/vision.',
    team: [
      { role: 'ML-интерн', load: 'основная (если ресурс появится)' },
      { role: 'Аналитик', load: 'разметка кейсов' },
    ],
    steps: [
      'Разметка 300–500 кейсов мультимодальных обращений',
      'Прототип OCR/vision на топ-сценариях',
      'Анализ: какие сценарии достижимы при текущем качестве моделей',
    ],
    validate: 'Артефакт для ревью: разметка 300–500 кейсов с оценкой автоматизируемости.',
    counterMetrics: [
      'Доля ошибок OCR на документах/скриншотах',
    ],
    risks: [
      { name: 'OCR ошибки на банковских документах = высокий риск', mitigation: 'Только справочные сценарии, не транзакционные' },
    ],
    dependencies: 'Backlog. Берётся при появлении ML-интерна или для доп. оценки на ревью.',
  },

  'mem-sess': {
    title: 'Память между сессиями',
    status: 'backlog',
    period: '—',
    contrib: 'до +1–2 п.п. после проверки',
    goal: 'Может быть частью 5,4% «продолжение предыдущего диалога». Не ясно — потеря внутри сессии или между. Если между, нужно хранить состояние клиента, что попадает под compliance.',
    team: [
      { role: 'Аналитик', load: 'когортный анализ' },
    ],
    steps: [
      'Когортный анализ повторных обращений по той же теме',
      'Разделение: внутри сессии vs между сессиями',
      'Если между — оценка compliance-затрат',
    ],
    validate: 'Артефакт: распределение 5,4% по «внутри/между сессиями». Решение «брать в план или закрыть».',
    counterMetrics: [
      'Доля повторных обращений по той же теме',
    ],
    risks: [
      { name: 'Compliance: хранение состояния между сессиями', mitigation: 'В основной план не беру; сначала юр. оценка' },
      { name: 'Неверная персонализация', mitigation: 'Только non-PII контекст' },
    ],
    dependencies: 'Backlog. Только при свободном аналитическом ресурсе.',
  },

  'gen-bot': {
    title: 'Полноценный генеративный бот',
    status: 'backlog',
    period: '—',
    contrib: 'не закладываю',
    goal: 'Может помочь с нестандартными вопросами, не закрытыми сценариями. В банковском контексте высокий риск уверенных неверных ответов — поэтому не в плане.',
    team: [
      { role: 'ML-интерн', load: 'анализ guardrails' },
    ],
    steps: [
      'Анализ guardrails и ошибок LLM на исторических кейсах',
      'Категоризация: где LLM безопасен, где галлюцинации',
      'Прототип на 1–2 безопасных сценариях',
    ],
    validate: 'Артефакт для ревью: анализ guardrails + список безопасных сценариев.',
    counterMetrics: [
      'Доля галлюцинаций',
      'CSAT на сценариях с LLM',
    ],
    risks: [
      { name: 'Уверенный неверный ответ → финансовый/репутационный ущерб', mitigation: 'Сначала сценарии, маршрутизация и guardrails; LLM только в режиме fallback' },
    ],
    dependencies: 'Backlog. Готов к ревью — кандидат может взять как доп. работу.',
  },

  'debt': {
    title: 'Автоматизация должников',
    status: 'backlog',
    period: '—',
    contrib: 'не закладываю',
    goal: 'Должники в кластере 9,6% отключённых сегментов. Высокий юридический и репутационный риск — нужна работа с legal до запуска.',
    team: [
      { role: 'Аналитик', load: 'сегментация' },
      { role: 'Legal', load: 'карта допустимых тем' },
    ],
    steps: [
      'Сегментация 9,6% по типам должников',
      'Карта допустимых тем для бота (с legal)',
      'Если есть безопасные темы — оценка вклада',
    ],
    validate: 'Артефакт: сегментация 9,6% и карта допустимых тем (или решение «не автоматизируем»).',
    counterMetrics: [
      'Жалобы должников',
      'Доля юр. инцидентов',
    ],
    risks: [
      { name: 'Юр. иск из-за неверного ответа должнику', mitigation: 'Только после legal-согласования' },
    ],
    dependencies: 'Backlog. Только при свободном аналитике + legal.',
  },

  'frustration': {
    title: 'Распознавание фрустрации',
    status: 'backlog',
    period: '—',
    contrib: 'не прямой рост',
    goal: 'Косвенный сигнал перед эскалациями: «зовёт после ответа» 1,1% и «зовёт в середине» 0,8%. Это защита CSAT, не путь к 60%.',
    team: [
      { role: 'ML-интерн', load: 'словарь маркеров' },
      { role: 'Аналитик', load: 'ручная проверка выборки' },
    ],
    steps: [
      'Словарь маркеров фрустрации (текстовые сигналы)',
      'Ручная проверка выборки на корреляцию с эскалацией',
      'Прототип трекинга маркеров в боте',
    ],
    validate: 'Артефакт для ревью: словарь маркеров + анализ корреляции.',
    counterMetrics: [
      'Precision/recall классификатора',
    ],
    risks: [
      { name: 'Ложные срабатывания → раздражение', mitigation: 'Маркер только триггерит вежливое уточнение, не эскалацию' },
    ],
    dependencies: 'Backlog. Готов к ревью.',
  },

  'op-summary': {
    title: 'Резюме для оператора',
    status: 'backlog',
    period: '—',
    contrib: 'не влияет напрямую',
    goal: 'Снижает повторное объяснение проблемы при эскалации, улучшает опыт клиента. Это эффективность операторов, не рост automation. В кейсе нет AHT, поэтому не считаю в 60%.',
    team: [
      { role: 'Junior PM', load: 'пилот' },
      { role: 'Аналитик', load: 'выбор сценариев' },
    ],
    steps: [
      'Выбор 1–2 сценариев эскалации с длинной историей',
      'Прототип авто-резюме (LLM-suggestion для оператора)',
      'Пилот на 1 группе операторов',
    ],
    validate: 'Артефакт для ревью: пилот на 1–2 сценариях, AHT и CSAT оператора.',
    counterMetrics: [
      'AHT оператора',
      'CSAT после эскалации',
    ],
    risks: [
      { name: 'Резюме искажает суть проблемы', mitigation: 'Резюме как suggestion, не замена истории чата' },
    ],
    dependencies: 'Backlog. Готов к ревью.',
  },

  'proactive': {
    title: 'Проактивная поддержка',
    status: 'backlog',
    period: '—',
    contrib: 'не считаю в 60%',
    goal: 'Может заранее снижать поток (статусы переводов, лимиты, комиссии). Это снижение входящего потока, не автоматизация текущих чатов — отдельная продуктовая стратегия.',
    team: [
      { role: 'Product intern', load: 'discovery' },
    ],
    steps: [
      'Discovery по топ-темам обращений',
      'Карта proactive-сигналов (push, in-app)',
      'Оценка снижения входящего потока',
    ],
    validate: 'Артефакт: список proactive-сигналов + ожидаемое снижение потока.',
    counterMetrics: [
      'Объём чатов в месяц',
      'CSAT proactive-уведомлений',
    ],
    risks: [
      { name: 'Notification-fatigue', mitigation: 'Частотные ограничения + opt-out' },
    ],
    dependencies: 'Backlog. Только при свободном product-ресурсе.',
  },

  'voice': {
    title: 'Голосовой ввод с суммаризацией',
    status: 'backlog',
    period: '—',
    contrib: 'не закладываю',
    goal: 'Может помочь, если клиент не может коротко описать проблему текстом: общий запрос 1,0%, несколько сообщений 0,4%. Голос не указан в данных — новая модальность.',
    team: [
      { role: 'ML-интерн', load: 'прототип speech-to-text' },
      { role: 'Дизайнер', load: 'UI голосового ввода' },
    ],
    steps: [
      'Прототип speech-to-text + суммаризация',
      'Анализ длинных неструктурированных сообщений',
      'Оценка качества суммаризации на банковских кейсах',
    ],
    validate: 'Артефакт для ревью: прототип + анализ длинных сообщений.',
    counterMetrics: [
      'WER speech-to-text',
      'CSAT голосового ввода',
    ],
    risks: [
      { name: 'Чувствительные данные в голосе → compliance', mitigation: 'Сначала структурированный ввод и уточняющие вопросы' },
      { name: 'Ошибки суммаризации → неверный intent', mitigation: 'Подтверждение клиентом перед обработкой' },
    ],
    dependencies: 'Backlog. Готов к ревью.',
  },

};

if (typeof window !== 'undefined') window.HYPOTHESES_DATA = HYPOTHESES_DATA;
```

- [ ] **Step 2: Подключить файл в `index.html` ПЕРЕД `script.js`**

Найти строку:
```html
  <script src="./assets/script.js"></script>
```

Заменить на:
```html
  <script src="./assets/hypotheses-data.js"></script>
  <script src="./assets/script.js"></script>
```

- [ ] **Step 3: Проверить загрузку**

```bash
curl -sf http://127.0.0.1:8765/assets/hypotheses-data.js | head -5
```

Ожидаемо: первые строки JS видны, не 404.

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/');
  const keys = await p.evaluate(() => Object.keys(window.HYPOTHESES_DATA || {}));
  console.log('Keys count:', keys.length, '| Sample:', keys.slice(0, 3).join(', '));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо: `Keys count: 19 | Sample: recl-22-7, ux-exit, tech-stab`.

- [ ] **Step 4: Commit**

```bash
git add assets/hypotheses-data.js index.html
git commit -m "feat(b3): add HYPOTHESES_DATA with 19 records for detail panel"
```

---

### Task 2: data-id на всех карточках

**Files:**
- Modify: `/root/project/MiniCEO/index.html` (строки секции `b3-hypotheses`)

- [ ] **Step 1: Добавить `data-id` на 9 plan + 2 validate + 8 backlog карточек в Kanban**

Маппинг порядка карточек → id (порядок снизу-вверх по файлу должен совпадать с массивом):

| HTML порядок (Kanban) | data-id |
|---|---|
| Реклассификация 22,7% | `recl-22-7` |
| UX-выход из сценария | `ux-exit` |
| Техническая стабильность | `tech-stab` |
| Пробелы сценариев | `gap-scen` |
| Контекст и follow-up | `context-fu` |
| Формулировки, слоты, маршрутизация | `formul-slots` |
| Pre-triage перед оператором | `pre-triage` |
| Новые сценарии из 22,7% | `new-22-7` |
| Отключённые сегменты: безопасная часть | `seg-safe` |
| ⚑ Разбивка 9,6% сегментов | `seg-split` |
| ⚑ VIP opt-in пилот | `vip-pilot` |
| Мультимодальные обращения | `multi` |
| Память между сессиями | `mem-sess` |
| Полноценный генеративный бот | `gen-bot` |
| Автоматизация должников | `debt` |
| Распознавание фрустрации | `frustration` |
| Резюме для оператора | `op-summary` |
| Проактивная поддержка | `proactive` |
| Голосовой ввод с суммаризацией | `voice` |

Для каждой Kanban-карточки в `<article class="hyp-card" data-status="..." ...>` добавить атрибут `data-id="<key>"`.

Пример для первой карточки:
```html
<article class="hyp-card" data-status="plan" data-accent="reserve" data-id="recl-22-7" style="--start:1; --end:3;" data-start="1" data-end="3">
```

- [ ] **Step 2: Добавить `data-id` на 11 timeline-копий**

Timeline содержит дубли тех же 9 plan + 2 validate в `.hyp-timeline__lane`. Для каждого `<article class="hyp-card" data-status="..." style="--start:..">` внутри `.hyp-timeline__lane` добавить **тот же `data-id`** что и Kanban-копия.

Backlog в timeline-зоне (`.hyp-timeline__backlog-grid`) — 8 карточек тоже получают `data-id`.

Итого затронуто: 19 (Kanban) + 11 (Timeline lanes) + 8 (Timeline backlog) = 38 карточек, **19 уникальных id**.

- [ ] **Step 3: Проверить через playwright**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/');
  const r = await p.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.hyp-card[data-id]'));
    const ids = new Set(cards.map(c => c.dataset.id));
    return { totalCards: cards.length, uniqueIds: ids.size };
  });
  console.log(r);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо: `{ totalCards: 38, uniqueIds: 19 }`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(b3): assign data-id to 19 unique hypothesis cards"
```

---

### Task 3: HTML drawer + backdrop + CSS layout

**Files:**
- Modify: `/root/project/MiniCEO/index.html` (HTML — после `</main>`; CSS — внутри `<style>` перед `</style>`)

- [ ] **Step 1: Добавить HTML drawer и backdrop**

Найти `</main>` в `index.html` и **перед `<footer>`** вставить:

```html
  <!-- Detail panel for hypothesis cards -->
  <div class="hyp-panel-backdrop" aria-hidden="true"></div>
  <aside class="hyp-panel" aria-hidden="true" role="dialog" aria-labelledby="hyp-panel-title" tabindex="-1">
    <header class="hyp-panel__header">
      <span class="hyp-panel__status" data-status=""></span>
      <button type="button" class="hyp-panel__close" aria-label="Закрыть панель">×</button>
    </header>

    <div class="hyp-panel__hero">
      <h3 id="hyp-panel-title" class="hyp-panel__title"></h3>
      <div class="hyp-panel__meta">
        <span class="hyp-panel__period"></span>
        <span class="hyp-panel__contrib"></span>
      </div>
    </div>

    <div class="hyp-panel__body">
      <section data-field="goal"          hidden><h4>Цель</h4><p></p></section>
      <section data-field="team"          hidden><h4>Команда</h4><ul></ul></section>
      <section data-field="steps"         hidden><h4>Декомпозиция</h4><ol></ol></section>
      <section data-field="validate"      hidden><h4>Что проверяем</h4><p></p></section>
      <section data-field="counterMetrics" hidden><h4>Контр-метрики</h4><ul></ul></section>
      <section data-field="risks"         hidden><h4>Риски</h4><ul></ul></section>
      <section data-field="dependencies"  hidden><h4>Зависимости</h4><p></p></section>
    </div>

    <footer class="hyp-panel__nav">
      <button type="button" class="hyp-panel__prev" aria-label="Предыдущая инициатива">← Пред.</button>
      <span class="hyp-panel__counter" aria-live="polite">— / —</span>
      <button type="button" class="hyp-panel__next" aria-label="Следующая инициатива">След. →</button>
    </footer>
  </aside>
```

- [ ] **Step 2: Добавить CSS-блок drawer'а**

Внутри существующего `<style>` блока (перед `</style>`), добавить:

```css
    /* ─────────────────────────────────────────────────────────── */
    /*  Hypothesis detail panel (drawer)                          */
    /* ─────────────────────────────────────────────────────────── */
    .hyp-panel {
      position: fixed;
      top: var(--topbar);
      right: 0;
      width: 420px;
      max-width: 92vw;
      height: calc(100vh - var(--topbar));
      background: var(--surface);
      border-left: 1px solid var(--border);
      box-shadow: -8px 0 24px rgba(0,0,0,0.10);
      transform: translateX(100%);
      transition: transform .28s cubic-bezier(.16,1,.3,1);
      overflow-y: auto;
      z-index: 100;
      display: flex;
      flex-direction: column;
    }
    .hyp-panel.is-open { transform: translateX(0); }

    .hyp-panel-backdrop {
      position: fixed;
      inset: var(--topbar) 0 0 0;
      background: transparent;
      pointer-events: none;
      z-index: 99;
      transition: background-color .2s;
    }
    .hyp-panel-backdrop.is-visible { pointer-events: auto; }

    .hyp-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px 10px;
      border-bottom: 1px solid var(--border);
    }
    .hyp-panel__status {
      font-family: var(--font-display);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1.5px solid currentColor;
    }
    .hyp-panel__status[data-status="plan"]     { color: var(--success); }
    .hyp-panel__status[data-status="validate"] { color: var(--yellow); }
    .hyp-panel__status[data-status="backlog"]  { color: var(--text3); }
    .hyp-panel__close {
      appearance: none;
      border: none;
      background: transparent;
      font-size: 26px;
      line-height: 1;
      cursor: pointer;
      color: var(--text2);
      padding: 4px 10px;
      border-radius: 6px;
      transition: background .15s, color .15s;
    }
    .hyp-panel__close:hover { background: var(--surface2); color: var(--ink); }
    [data-theme="dark"] .hyp-panel__close:hover { color: var(--text); }

    .hyp-panel__hero {
      padding: 16px 18px;
      border-bottom: 1px dashed var(--border);
    }
    .hyp-panel__title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 800;
      line-height: 1.18;
      letter-spacing: -0.015em;
      color: var(--ink);
      margin: 0 0 8px;
    }
    [data-theme="dark"] .hyp-panel__title { color: var(--text); }
    .hyp-panel__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      font-size: 13px;
      color: var(--text2);
    }
    .hyp-panel__period { font-weight: 700; }
    .hyp-panel__contrib { font-weight: 700; color: var(--success); }
    .hyp-panel[data-status="validate"] .hyp-panel__contrib { color: #7A5E00; }
    [data-theme="dark"] .hyp-panel[data-status="validate"] .hyp-panel__contrib { color: var(--yellow); }
    .hyp-panel[data-status="backlog"] .hyp-panel__contrib { color: var(--text2); font-weight: 600; }

    .hyp-panel__body {
      padding: 8px 18px 16px;
      flex: 1;
    }
    .hyp-panel__body section { margin-top: 18px; }
    .hyp-panel__body section[hidden] { display: none; }
    .hyp-panel__body h4 {
      font-family: var(--font-display);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: var(--text3);
      margin: 0 0 8px;
    }
    .hyp-panel__body p {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: var(--text2);
    }
    .hyp-panel__body ul,
    .hyp-panel__body ol {
      margin: 0;
      padding-left: 18px;
      font-size: 14px;
      line-height: 1.55;
      color: var(--text2);
    }
    .hyp-panel__body li { margin-top: 4px; }
    .hyp-panel__body li b { color: var(--ink); font-weight: 700; }
    [data-theme="dark"] .hyp-panel__body li b { color: var(--text); }
    .hyp-panel__body li small {
      display: block;
      color: var(--text3);
      font-size: 12px;
      margin-top: 2px;
    }

    .hyp-panel__nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-top: 1px solid var(--border);
      background: var(--surface);
      position: sticky;
      bottom: 0;
    }
    .hyp-panel__prev,
    .hyp-panel__next {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text2);
      font-family: var(--font-display);
      font-size: 12px;
      font-weight: 700;
      padding: 7px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
    }
    .hyp-panel__prev:hover,
    .hyp-panel__next:hover {
      background: var(--ink);
      color: var(--surface);
      border-color: var(--ink);
    }
    [data-theme="dark"] .hyp-panel__prev:hover,
    [data-theme="dark"] .hyp-panel__next:hover {
      background: var(--yellow);
      color: var(--ink);
      border-color: var(--yellow);
    }
    .hyp-panel__prev:disabled,
    .hyp-panel__next:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .hyp-panel__counter {
      font-family: var(--font-display);
      font-size: 12px;
      font-weight: 700;
      color: var(--text3);
      font-feature-settings: "tnum" 1;
    }

    @media (max-width: 720px) {
      .hyp-panel { top: 0; height: 100vh; width: 100%; max-width: 100%; }
      .hyp-panel-backdrop {
        inset: 0;
        background: rgba(0,0,0,0.40);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hyp-panel { transition: none; }
    }

    @media print {
      .hyp-panel,
      .hyp-panel-backdrop { display: none !important; }
    }
```

- [ ] **Step 3: Visual smoke-check (drawer пока не открывается, но HTML не ломает страницу)**

```bash
curl -s -o /dev/null -w "HTTP %{http_code} · %{size_download}\n" http://127.0.0.1:8765/index.html
```

Ожидаемо: `HTTP 200`, размер вырос на ~3-4 КБ относительно предыдущего.

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/');
  const r = await p.evaluate(() => ({
    panelExists: !!document.querySelector('.hyp-panel'),
    backdropExists: !!document.querySelector('.hyp-panel-backdrop'),
    panelHidden: document.querySelector('.hyp-panel')?.getAttribute('aria-hidden') === 'true',
    transform: getComputedStyle(document.querySelector('.hyp-panel')).transform
  }));
  console.log(r);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо: `panelExists: true, backdropExists: true, panelHidden: true, transform` содержит `matrix` со сдвигом (translateX 100%).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(b3): add detail panel HTML and CSS (closed by default)"
```

---

### Task 4: JS — open/close + render полей

**Files:**
- Modify: `/root/project/MiniCEO/assets/script.js` (новая функция, подключение в bootstrap)

- [ ] **Step 1: Добавить функцию `setupHypothesesPanel()` перед `/* ── Boot ── */`**

```js
/* ── Hypothesis detail panel (drawer) ─────────────────────── */
function setupHypothesesPanel() {
  const panel    = document.querySelector('.hyp-panel');
  const backdrop = document.querySelector('.hyp-panel-backdrop');
  if (!panel || !backdrop || !window.HYPOTHESES_DATA) return;

  // Уникальные карточки (по data-id) — для определения общего числа
  const allIds = Array.from(new Set(
    Array.from(document.querySelectorAll('.hyp-card[data-id]')).map(c => c.dataset.id)
  ));
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
```

- [ ] **Step 2: Подключить в `DOMContentLoaded` после `setupHypothesesView()`**

В `assets/script.js` найти:
```js
  setupRoadmap();
  setupHypothesesView();
```

Заменить на:
```js
  setupRoadmap();
  setupHypothesesView();
  setupHypothesesPanel();
```

- [ ] **Step 3: Smoke-check через playwright — открытие первой карточки**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.click('.hyp-card[data-id=\"recl-22-7\"]');
  await p.waitForTimeout(400);
  const open = await p.locator('.hyp-panel').evaluate(el => el.classList.contains('is-open'));
  const title = await p.locator('.hyp-panel__title').textContent();
  const goal = await p.locator('.hyp-panel section[data-field=\"goal\"] p').textContent();
  console.log({ open, title: title?.slice(0, 30), goalStart: goal?.slice(0, 30) });
  console.log('errors:', errs.length === 0 ? 'NONE' : errs);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо:
```
{ open: true, title: 'Реклассификация 22,7%', goalStart: 'Разбираем 22,7% неклассифи' }
errors: NONE
```

- [ ] **Step 4: Commit**

```bash
git add assets/script.js
git commit -m "feat(b3): wire detail panel open/close + render fields"
```

---

### Task 5: JS — keyboard nav, hash routing, active highlight (уже в Task 4)

**Files:** уже покрыто Task 4

- [ ] **Step 1: Проверить keyboard navigation**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.click('.hyp-card[data-id=\"recl-22-7\"]');
  await p.waitForTimeout(300);
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(300);
  console.log('after ArrowRight:', await p.locator('.hyp-panel__title').textContent());
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  console.log('after Esc, hidden:', await p.locator('.hyp-panel').getAttribute('aria-hidden'));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо:
```
after ArrowRight: UX-выход из сценария
after Esc, hidden: true
```

- [ ] **Step 2: Проверить hash routing**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/#card=new-22-7', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  console.log('open:', await p.locator('.hyp-panel').evaluate(el => el.classList.contains('is-open')));
  console.log('title:', await p.locator('.hyp-panel__title').textContent());
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо:
```
open: true
title: Новые сценарии из 22,7%
```

- [ ] **Step 3: Проверить active highlight**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://127.0.0.1:8765/#card=gap-scen', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const activeCount = await p.locator('.hyp-card.is-active').count();
  console.log('active cards (kanban+timeline):', activeCount);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо: `active cards: 2` (одна в Kanban + одна в Timeline lanes — у обеих data-id="gap-scen").

- [ ] **Step 4: Commit (если не было исправлений)**

Если все три проверки прошли — нет изменений в коде, шаг пропускается. Иначе фикс + commit.

---

### Task 6: Active highlight CSS + cursor pointer на карточках

**Files:**
- Modify: `/root/project/MiniCEO/index.html` (CSS секция)

- [ ] **Step 1: Добавить стили активной карточки и cursor:pointer**

Внутри `<style>` блока добавить:

```css
    /* Активная карточка пока drawer открыт */
    .hyp-card[data-id] { cursor: pointer; }
    .hyp-card.is-active {
      border-color: var(--yellow) !important;
      box-shadow: 0 0 0 3px rgba(255,221,45,0.25), 0 8px 20px rgba(255,221,45,0.18) !important;
    }
    .hyp-timeline__lane .hyp-card.is-active {
      box-shadow: 0 0 0 2px rgba(255,221,45,0.45), 0 6px 14px rgba(255,221,45,0.25) !important;
      z-index: 5;
    }
```

- [ ] **Step 2: Проверить визуально**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.click('.hyp-card[data-id=\"gap-scen\"]');
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/shots/plan-task6.png', fullPage: false });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
ls -la /tmp/shots/plan-task6.png
```

Ожидаемо: файл создан, можно открыть и увидеть жёлтую обводку на «Пробелы сценариев» в Kanban + такой же подсветке в Timeline lanes.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(b3): cursor:pointer + golden active state on hypothesis cards"
```

---

### Task 7: Sticky-заголовки колонок Kanban + sticky M-axis Timeline

**Files:**
- Modify: `/root/project/MiniCEO/index.html` (CSS секция)

- [ ] **Step 1: Добавить CSS sticky для шапок колонок Kanban**

Внутри `<style>` найти существующее правило `.hyp-column__head { ... }` и **после него** добавить:

```css
    /* Sticky-шапки колонок Kanban при вертикальном скролле */
    .hyp-board[data-view="kanban"] .hyp-column__head {
      position: sticky;
      top: var(--topbar);
      z-index: 5;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
```

- [ ] **Step 2: Добавить sticky для оси/волн Timeline**

Внутри `<style>` после блока timeline-стилей добавить:

```css
    /* Sticky M-axis + волны при вертикальном скролле в timeline-режиме */
    .hyp-board[data-view="timeline"] .hyp-timeline__axis,
    .hyp-board[data-view="timeline"] .hyp-timeline__waves,
    .hyp-board[data-view="timeline"] .hyp-timeline__checkpoints {
      position: sticky;
      z-index: 4;
      background: var(--surface);
    }
    .hyp-board[data-view="timeline"] .hyp-timeline__axis       { top: var(--topbar); }
    .hyp-board[data-view="timeline"] .hyp-timeline__waves      { top: calc(var(--topbar) + 22px); }
    .hyp-board[data-view="timeline"] .hyp-timeline__checkpoints { top: calc(var(--topbar) + 50px); }
```

- [ ] **Step 3: Проверить через playwright**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  // Скролл вниз на 800px
  await p.evaluate(() => window.scrollBy(0, 800));
  await p.waitForTimeout(300);
  const headTop = await p.locator('.hyp-column[data-status=\"plan\"] .hyp-column__head').evaluate(el => el.getBoundingClientRect().top);
  console.log('Kanban head top after scroll:', headTop);
  // Должно быть около var(--topbar) = 64
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо: `Kanban head top after scroll: ~64` (плюс-минус 1px).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(b3): sticky column heads and timeline axis on scroll"
```

---

### Task 8: Search-input в шапке секции

**Files:**
- Modify: `/root/project/MiniCEO/index.html` (HTML + CSS), `/root/project/MiniCEO/assets/script.js` (JS)

- [ ] **Step 1: Добавить HTML search-input в шапку секции**

Найти в `index.html` структуру:
```html
        <h2>
          <span class="hyp-h2-text">Гипотезы и backlog</span>
          <div class="view-switcher" role="tablist" aria-label="Режим просмотра">
            ...
          </div>
        </h2>
```

И **сразу после `</h2>`** добавить:
```html
        <div class="hyp-toolbar">
          <input type="search" class="hyp-search" placeholder="Поиск по карточкам…" aria-label="Поиск по карточкам" autocomplete="off">
          <span class="hyp-search__count" aria-live="polite"></span>
        </div>
```

- [ ] **Step 2: Добавить CSS для search-input**

Внутри `<style>` блока:

```css
    .hyp-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0 14px;
    }
    .hyp-search {
      appearance: none;
      flex: 1;
      max-width: 360px;
      padding: 9px 14px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 14px;
      font-family: var(--font-body);
      transition: border-color .15s, box-shadow .15s;
    }
    .hyp-search:focus {
      outline: none;
      border-color: var(--yellow);
      box-shadow: 0 0 0 3px rgba(255,221,45,0.20);
    }
    .hyp-search::-webkit-search-cancel-button { cursor: pointer; }
    .hyp-search__count {
      font-size: 12px;
      color: var(--text3);
      font-feature-settings: "tnum" 1;
    }
    .hyp-card[data-search-hidden="true"] {
      opacity: 0.18;
      filter: grayscale(0.6);
    }
    .hyp-board[data-view="kanban"] .hyp-card[data-search-hidden="true"] {
      display: none;
    }
```

В Kanban-режиме отфильтрованные карточки скрываются (display:none). В Timeline-режиме они становятся блёклыми, чтобы Gantt-структура не ломалась.

- [ ] **Step 3: Добавить функцию `setupHypothesesSearch()` в `assets/script.js`**

Перед `/* ── Boot ── */` добавить:

```js
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
```

- [ ] **Step 4: Подключить в bootstrap**

В `DOMContentLoaded` после `setupHypothesesPanel();` добавить:
```js
  setupHypothesesSearch();
```

- [ ] **Step 5: Проверить через playwright**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.fill('.hyp-search', 'контекст');
  await p.waitForTimeout(300);
  const visible = await p.locator('.hyp-board[data-view=\"kanban\"] .hyp-card[data-id]:not([data-search-hidden=\"true\"])').count();
  const hidden = await p.locator('.hyp-board[data-view=\"kanban\"] .hyp-card[data-search-hidden=\"true\"]').count();
  console.log({ visible, hidden });
  await p.fill('.hyp-search', '');
  await p.waitForTimeout(200);
  const total = await p.locator('.hyp-board[data-view=\"kanban\"] .hyp-card[data-id]').count();
  console.log({ totalAfterReset: total });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
```

Ожидаемо:
```
{ visible: 1, hidden: 18 }     // только "Контекст и follow-up"
{ totalAfterReset: 19 }
```

- [ ] **Step 6: Commit**

```bash
git add index.html assets/script.js
git commit -m "feat(b3): add client-side search for hypothesis cards"
```

---

### Task 9: Comprehensive playwright e2e suite

**Files:**
- Create: `/tmp/pwtest/panel.js` (вне репо, для постоянных проверок)

- [ ] **Step 1: Создать `/tmp/pwtest/panel.js`**

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await page.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 1. Click each of 19 cards
  const ids = await page.evaluate(() =>
    Array.from(new Set(Array.from(document.querySelectorAll('.hyp-card[data-id]')).map(c => c.dataset.id)))
  );
  console.log('Found unique ids:', ids.length);

  for (const id of ids) {
    await page.click(`.hyp-card[data-id="${id}"]`);
    await page.waitForTimeout(150);
    const title = await page.locator('.hyp-panel__title').textContent();
    const goalShown = await page.locator('.hyp-panel section[data-field="goal"]').evaluate(el => !el.hasAttribute('hidden'));
    console.log(`  ${id} → "${title?.slice(0,30)}" goal:${goalShown}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }

  // 2. Esc closes
  await page.click('.hyp-card[data-id="gap-scen"]');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  console.log('after Esc closed:', await page.locator('.hyp-panel').getAttribute('aria-hidden'));

  // 3. Backdrop closes
  await page.click('.hyp-card[data-id="gap-scen"]');
  await page.waitForTimeout(200);
  await page.click('.hyp-panel-backdrop', { force: true });
  await page.waitForTimeout(200);
  console.log('after backdrop closed:', await page.locator('.hyp-panel').getAttribute('aria-hidden'));

  // 4. Arrow nav
  await page.click('.hyp-card[data-id="recl-22-7"]');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  console.log('after Right:', await page.locator('.hyp-panel__title').textContent());
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  console.log('after Left:', await page.locator('.hyp-panel__title').textContent());
  await page.keyboard.press('Escape');

  // 5. Hash routing
  await page.goto('http://127.0.0.1:8765/#card=new-22-7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log('hash route open:', await page.locator('.hyp-panel').evaluate(el => el.classList.contains('is-open')));
  console.log('hash route title:', await page.locator('.hyp-panel__title').textContent());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 6. Search filter
  await page.fill('.hyp-search', 'контекст');
  await page.waitForTimeout(200);
  const visible = await page.locator('.hyp-board[data-view="kanban"] .hyp-card[data-id]:not([data-search-hidden="true"])').count();
  console.log('search "контекст" visible:', visible);
  await page.fill('.hyp-search', '');
  await page.waitForTimeout(200);

  // 7. Sticky kanban heads
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(200);
  const headTop = await page.locator('.hyp-column[data-status="plan"] .hyp-column__head').evaluate(el => el.getBoundingClientRect().top);
  console.log('sticky kanban head top:', headTop, '(should be ~64)');
  await page.evaluate(() => window.scrollTo(0, 0));

  // 8. Mobile viewport
  await ctx.close();
  const mctx = await browser.newContext({ viewport: { width: 414, height: 900 } });
  const mp = await mctx.newPage();
  await mp.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await mp.waitForTimeout(500);
  await mp.click('.hyp-card[data-id="recl-22-7"]');
  await mp.waitForTimeout(300);
  const panelW = await mp.locator('.hyp-panel').evaluate(el => el.getBoundingClientRect().width);
  console.log('mobile panel width:', panelW, '(should be 414)');
  await mctx.close();

  console.log('\nErrors:', errs.length === 0 ? 'NONE' : errs);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Запустить полный e2e**

```bash
cd /tmp/pwtest && node panel.js
```

Ожидаемо:
- 19 строк `<id> → "<title>" goal:true` (все карточки открываются, поле goal видно)
- `after Esc closed: true`
- `after backdrop closed: true`
- `after Right: UX-выход из сценария`, `after Left: Реклассификация 22,7%`
- `hash route open: true`, `hash route title: Новые сценарии из 22,7%`
- `search "контекст" visible: 1`
- `sticky kanban head top: ~64`
- `mobile panel width: 414`
- `Errors: NONE`

- [ ] **Step 3: Если есть ошибки — пофиксить + повторить**

Если playwright нашёл баги — починить в исходниках, перезапустить тест.

- [ ] **Step 4: Commit (если были фиксы)**

```bash
git add -p
git commit -m "fix(b3): polish detail panel based on e2e findings"
```

---

### Task 10: Финальный pass — визуальная проверка обоих видов + commit

**Files:** ничего нового, только проверка

- [ ] **Step 1: Сделать скриншоты Kanban + Timeline + drawer-открытый + mobile**

```bash
cd /tmp/pwtest && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/#b3-hypotheses', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/shots/done-kanban.png' });
  await p.click('.view-switcher button[data-view=\"timeline\"]');
  await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/shots/done-timeline.png' });
  await p.click('.hyp-card[data-id=\"new-22-7\"]');
  await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/shots/done-panel.png' });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
"
ls -la /tmp/shots/done-*.png
```

- [ ] **Step 2: Convert + view**

```bash
for f in done-kanban done-timeline done-panel; do
  convert /tmp/shots/${f}.png -resize 1100x -quality 80 /tmp/shots/${f}.jpg
done
```

- [ ] **Step 3: Финальная проверка состояния git**

```bash
git status
git log --oneline -10
```

Ожидаемо: дерево чистое (всё закоммичено), 7+ новых коммитов на ветке `extra-content-supplements`.

- [ ] **Step 4: Push (опционально, по согласованию)**

```bash
git push -u origin extra-content-supplements
```

---

## Self-Review

**Spec coverage:**
- ✅ Drawer HTML + CSS — Task 3
- ✅ HYPOTHESES_DATA с 19 записями — Task 1
- ✅ data-id на 38 карточках (19 уник.) — Task 2
- ✅ JS open/close + render — Task 4
- ✅ Keyboard nav (Esc / ← → / J K) — Task 4 (логика) + Task 5 (проверка)
- ✅ Hash routing #card=<id> — Task 4 (логика) + Task 5 (проверка)
- ✅ Active highlight — Task 4 (JS) + Task 6 (CSS)
- ✅ Sticky kanban heads + sticky timeline axis — Task 7
- ✅ Search input — Task 8
- ✅ Mobile fullscreen — Task 3 (CSS @media)
- ✅ Print disabled — Task 3 (CSS @media print)
- ✅ E2E playwright suite — Task 9
- ✅ Final visual + commit — Task 10

**Placeholder scan:** TBD/TODO/«implement later» — нет. Все шаги содержат код или конкретные команды.

**Type consistency:**
- `setupHypothesesPanel()` — определена в Task 4, вызывается в Task 4 Step 2 и упоминается в Task 8 Step 4 (после неё подключается `setupHypothesesSearch()`).
- `HYPOTHESES_DATA` — определена в Task 1, читается в Task 4 (`window.HYPOTHESES_DATA`).
- `data-search-hidden` атрибут — введён в Task 8 (CSS + JS), нигде не конфликтует с `data-hidden` от backlog-фильтра (другой CSS-селектор).
- `.hyp-card.is-active` — стилизуется в Task 6, ставится/снимается в `setupHypothesesPanel()` из Task 4.
- `data-id` keys (`recl-22-7`, `ux-exit`, ...) — одинаковые в Task 1 (data) и Task 2 (HTML).

Несогласованностей не найдено.

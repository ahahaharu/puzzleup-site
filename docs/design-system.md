# Дизайн-система «Тетрадь»

Направление A5.1 «Коллаж из тетрадей»: тёплая бумага в клетку, тёмно-синие «чернила», оранжевый акцент, формулы «от руки», детали пазла как сквозной мотив. Тёмной темы нет.

- **Источник визуала:** макеты в `docs/design/` – HTML-выгрузка холста Claude Design (https://claude.ai/artifact/L8cLVKc6K6RC48NqEY8vKo) от 11.11.2026. Описание файлов – `docs/design/README.md`.
- **Источник значений:** ТЗ главной, раздел 2. Если токены холста и ТЗ расходятся, действует ТЗ: в нём контраст проверен по WCAG 2.2.

## 1. Цвета

| Токен | Значение | Назначение | Контраст |
|---|---|---|---|
| `paper` | #F7F4EC | основной фон | – |
| `paper-alt` | #EFEAE0 | фон чередующихся секций | – |
| `card` | #FBF9F4 | карточки | – |
| `grid` | #1D2340 / 6% | линии клетки фона: 32 px, на телефоне 24 px | декор |
| `kraft` | #E9DFC7 | вторичные детали пазла, плашки, фон инициалов | – |
| `kraft-dark` | #D6CCB2 | вторая светлая деталь | – |
| `kraft-shadow` | #E2DACA | пустое место для детали | – |
| `ink` | #1D2340 | заголовки, тёмные кнопки и секции | 14:1 на paper |
| `ink-2` | #2E3452 | основной текст | 11:1 |
| `ink-muted` | #4A4F66 | подписи, даты | 7,3:1 |
| `on-ink-label` | #C9CCDA | подписи полей на тёмной форме | 11:1 на ink |
| `accent` | #E4572E | только декор и текст от 24 px: точка, деталь пазла, логотип | 3,3:1 |
| `accent-strong` | #C94A24 | кнопка отправки формы, белый текст; кружок статуса «Последние места» | 4,7:1 с белым |
| `accent-text` | #B23A17 | мелкий акцентный текст: номера 01–03, активный пункт меню | 5,4:1 |
| `accent-light` | #F2A487 | акцент на тёмном фоне | 7,6:1 на ink |
| `error` | #B3261E | ошибки на светлом | 6:1 |
| `error-light` | #FFB4A8 | ошибки на тёмной форме | 9:1 на ink |
| `focus` | #3A6FD8 | кольцо фокуса 2 px, отступ 2 px; линии тетради (22–28%) | 4,3:1 / 3,2:1 на ink |
| `success` | #2F7D57 | кружок «Есть свободное время» | 4,6:1 |

Ошибка всегда помечается иконкой и текстом, а не только цветом. Статус занятости всегда назван словами, цвет кружка – подсказка.

## 2. Типографика

Три семейства, все с кириллицей, лицензия OFL. Подключение – `next/font/google` с `subsets: ['latin', 'cyrillic']`, `display: 'swap'`.

| Роль | Шрифт | Десктоп | Телефон | Межстрочный |
|---|---|---|---|---|
| Слоган «Всё сложится.» | Unbounded 700, −0,03em | 96 px | 48 px | 1,0 |
| H1 страницы репетитора (имя) | Unbounded 700 | 64 px | 34–40 px | 1,05 |
| H2 секции | Unbounded 700 | 48 px | 30 px | 1,1 |
| H3 карточки | Unbounded 500 | 22 px | 19 px | 1,25 |
| Лид | Golos Text 400 | 20 px | 18 px | 1,5 |
| Текст | Golos Text 400 | 17 px | 16 px | 1,55 |
| Подпись | Golos Text 400/500 | 14 px | 14 px | 1,45 |
| Кнопки, поля | Golos Text 600 / 400 | 17 / 16 px | 16 px | 1,2 |
| Формулы, номера, «пометки от руки» | Spectral Italic 400/500 | 18–34 px | 16–24 px | 1,1 |

Мельче 14 px нет ничего. Поля ввода на телефоне – от 16 px, иначе iOS масштабирует страницу.

Роли – классы Tailwind (`src/styles/globals.css`), межстрочный, трекинг и начертание входят в класс, семейство задаётся отдельно:

| Роль | Классы |
|---|---|
| Слоган | `font-display text-slogan` |
| H1 страницы репетитора | `font-display text-name` |
| H2 | `font-display text-h2` |
| H3 | `font-display text-h3` |
| Лид, текст | `text-lead`, `text-body` (текст по умолчанию у `body`) |
| Мелкий текст 15 px, подпись 14 px | `text-small`, `text-caption` |
| Кнопки, поля | `text-button`, `text-field` |
| Формулы и пометки | `font-hand italic` + `text-hand-sm` (16–18), `text-hand-md` (20–26), `text-hand-lg` (24–34) |

Заголовки и пометки тянутся `clamp()` от 360 до 1280 px, лид, текст и кнопки меняют размер на `lg` (ADR-026). Стандартной шкалы Tailwind (`text-sm`, `text-xl`…) нет (ADR-025); размер вне ролей – произвольное значение с комментарием.

## 3. Сетка и отступы

| Ширина | Колонки | Межколонник | Поля | Контейнер |
|---|---|---|---|---|
| 360–767 | 4 | 16 | 16 | 100% |
| 768–1023 | 8 | 24 | 32 | 100% |
| 1024–1279 | 12 | 24 | 48 | 100% |
| ≥ 1280 | 12 | 32 | 64 | макс. 1152, по центру |

- Шаг – 8 px. Вертикальный отступ секции: 96 px на десктопе, 56 px на телефоне.
- Фон-клетка – на всю ширину окна, у всех секций. Чередуются только `paper` и `paper-alt`.
- Скругления: карточки 16, кнопки 12, поля 10, тёмные детали формы и «О сайте» 20, чипы и бейджи – 999.
- Тени: «бумага» – `0 2px 6px` ink 12%; «летящая деталь» – `0 18px 22px` ink 28%, только для декоративной детали пазла. Без `blur` на больших блоках, не больше четырёх теней на экран.
- Якоря: `scroll-margin-top` с учётом высоты шапки (88 / 72 / 64 px).
- Утилиты: `page-container` – поля и максимальная ширина из таблицы; `page-grid` – колонки и межколонники. Брейкпоинты Tailwind – только `md` 768, `lg` 1024, `xl` 1280.
- Фокус: глобальное кольцо `:focus-visible` – 2 px `focus`, отступ 2 px. Своё кольцо в компонентах не нужно.

## 4. Бумага (только CSS, без картинок)

```css
/* клетка */
background-color: #FBFAF5;
background-image:
  linear-gradient(rgba(58,111,216,.22) 1px, transparent 1px),
  linear-gradient(90deg, rgba(58,111,216,.22) 1px, transparent 1px);
background-size: 24px 24px;

/* миллиметровка */
background-color: #FFFDF7;
background-image:
  linear-gradient(rgba(228,87,46,.35) 1px, transparent 1px),
  linear-gradient(90deg, rgba(228,87,46,.35) 1px, transparent 1px),
  linear-gradient(rgba(228,87,46,.16) 1px, transparent 1px),
  linear-gradient(90deg, rgba(228,87,46,.16) 1px, transparent 1px);
background-size: 30px 30px, 30px 30px, 6px 6px, 6px 6px;

/* линейка с полями */
background-color: #FFFFFF;
background-image:
  linear-gradient(90deg, transparent 52px, rgba(228,87,46,.7) 52px, rgba(228,87,46,.7) 53px, transparent 53px),
  repeating-linear-gradient(transparent 0 27px, rgba(58,111,216,.28) 27px 28px);

/* чистый лист */
background-color: #FBF9F4;

/* фон страницы */
background-color: #F7F4EC;
background-image:
  linear-gradient(rgba(29,35,64,.06) 1px, transparent 1px),
  linear-gradient(90deg, rgba(29,35,64,.06) 1px, transparent 1px);
background-size: 32px 32px;   /* 24px на телефоне */
```

Под будущие предметы есть ещё три бумаги из макета `ds/DS-Papers`: косая линейка, нотный стан (станы повторяются каждые 72 px), чистый лист с полями. Утилиты: `paper-page`, `paper-cell`, `paper-mm`, `paper-lined`, `paper-slanted`, `paper-staff`, `paper-margin`, `paper-plain`. Все видны на витрине `/dev/tokens` (только `pnpm dev`).

## 5. Tailwind 4: стартовый `@theme`

Действующие токены – `src/styles/globals.css`; ниже – исходный набор цветов, шрифтов, скруглений и теней.

```css
@import 'tailwindcss';

@theme {
  --color-paper: #F7F4EC;
  --color-paper-alt: #EFEAE0;
  --color-card: #FBF9F4;
  --color-kraft: #E9DFC7;
  --color-kraft-dark: #D6CCB2;
  --color-kraft-shadow: #E2DACA;
  --color-ink: #1D2340;
  --color-ink-2: #2E3452;
  --color-ink-muted: #4A4F66;
  --color-on-ink-label: #C9CCDA;
  --color-accent: #E4572E;
  --color-accent-strong: #C94A24;
  --color-accent-text: #B23A17;
  --color-accent-light: #F2A487;
  --color-error: #B3261E;
  --color-error-light: #FFB4A8;
  --color-focus: #3A6FD8;
  --color-success: #2F7D57;

  --font-display: var(--font-unbounded), sans-serif;
  --font-sans: var(--font-golos), sans-serif;
  --font-hand: var(--font-spectral), serif;

  --radius-field: 10px;
  --radius-button: 12px;
  --radius-card: 16px;
  --radius-piece: 20px;

  --shadow-paper: 0 2px 6px rgb(29 35 64 / 0.12);
  --shadow-flying: 0 18px 22px rgb(29 35 64 / 0.28);

  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

## 6. Компоненты

Каждый компонент – `src/components/ui/<Name>.tsx`, без внешних библиотек. Пропсы повторяют настройки компонентов на холсте.

| Компонент | Варианты и правила | Артборд |
|---|---|---|
| `Button` | `primary` (ink / paper, наведение – ink-2), `secondary` (прозрачная, рамка 1,5 px ink), `accent` (accent-strong, белый текст – только отправка формы), `onDark`. Размеры `lg` 56 px (первый экран, форма), `md` 48 px. Состояния: наведение, фокус, нажатие `scale(.98)`, неактивная 40%, загрузка со спиннером и «Отправляем…». Ссылка или кнопка – по смыслу (`href` → `<a>`/`next/link`) | Button, DS-States |
| `MessengerButtons` | Telegram + Viber всегда парой, равного веса, в два равных столбца, иконка + подпись, `aria-label` «Написать Андрею в Telegram» | D-5-tutors, T-1-profile |
| `Chip` | `solid`, `dashed`, `outline` – метки и плашки | Chip |
| `ChoiceChip` | 44 px, рамка 1,5 px ink 25%. Выбранный – заливка ink, текст paper, галочка слева. На тёмной форме – инверсия. Нативные `radio`/`checkbox` внутри `<label>` | DS-States, T-6-form |
| `Badge` (статус занятости) | Высота от 32, кружок 8 px + текст Golos 500 14 px, `nowrap` | T-S-statuses |
| `Field` | Высота 52, рамка 1,5 px ink 30%, подпись всегда над полем, подсказка и ошибка под полем. Ошибка: рамка error / error-light, иконка, текст, `aria-describedby`, `aria-invalid` | DS-States, X-form-errors |
| `Checkbox` | Квадрат 24 px, зона клика от 44×44 вместе с текстом | DS-States |
| `Sheet` | Лист тетради: `kind` = `cell` / `mm` / `lined` / `plain`, `tilt` в градусах, загнутый уголок 26 px вместо скругления | Sheet |
| `PuzzlePiece` | Форма из логотипа (SVG ниже), `currentColor` | Logo |
| `PuzzleStep` | Деталь-шаг, цепочка соединяется выступом и пазом: `left`/`right` = `flat` / `knob` / `socket`, `tone` = `cell` / `sand` / `ink` / `accent` | PuzzleStep |
| `Doodle` | Каракули на полях: `circle`, `sine`, `lever`, `cube`, `triangle`; не больше 6 на экран, на телефоне часть скрыта, `aria-hidden` | Doodle |
| `SectionHead` | H2 + лид | SectionHead |
| `Logo` | Деталь accent + «PuzzleUp» Unbounded 700 | Logo |
| `Margins` («пометки на полях») | Формулы Spectral Italic, ink 35–45%, поворот ±3–4°, `aria-hidden`, на телефоне скрываются при наложении на текст | D-1-hero |
| `PhotoTape` | Фото «вклеено в тетрадь»: белая рамка 8 / 12 px, поворот ±1,5°, полоска «скотча», без фото – инициалы на kraft | D-5-tutors, T-1-profile |

Иконки линейные, толщина 1,6–1,7, 24 px (`viewBox 0 0 24 24`, `stroke="currentColor"`). Эмодзи не используются.

Логотип (деталь пазла, `viewBox="0 0 120 120"`):

```svg
<path d="M20,28 A8,8 0 0 1 28,20 L48,20 C44,8 52,2 60,2 C68,2 76,8 72,20 L92,20 A8,8 0 0 1 100,28 L100,48 C112,44 118,52 118,60 C118,68 112,76 100,72 L100,92 A8,8 0 0 1 92,100 L72,100 C76,88 68,82 60,82 C52,82 44,88 48,100 L28,100 A8,8 0 0 1 20,92 Z" fill="currentColor"/>
```

## 7. Движение

- Анимации короткие (150–600 мс) и одноразовые, только `transform` и `opacity`.
- Первый экран: акцентная деталь один раз «встаёт» на место – смещение и поворот −6° → 0, 600 мс, ease-out.
- «Спасибо»: деталь встаёт в угол за 400 мс.
- Смена карточек фильтра – появление за 150 мс.
- При `prefers-reduced-motion: reduce` выключено всё, кроме смены состояния.

## 8. Скорость – часть дизайна

1. Бумага – только CSS-градиенты, ни одного запроса.
2. Фигуры – встроенный SVG, `currentColor`, без отдельных файлов.
3. Каракули – не больше шести на экран.
4. Тени – только на мелком.
5. Движение – только `transform` и `opacity`.
6. Шрифты – три семейства, preload только Unbounded 700 и Golos 400.
7. Первый экран: заголовок – обычный текст (он же LCP), пазл – inline SVG, дополнительных запросов для оформления нет.

## 9. Артборды холста

| Страница холста | Артборды |
|---|---|
| Главная · десктоп | D-1-hero, D-5-tutors, D-2-situations, D-3-how, D-4-subjects, D-6-reviews, D-7-prices, D-8-faq, D-9-about (на холсте – D-9-form), D-10-footer |
| Главная · телефон | M-0-1-hero, M-5-tutors, M-2-situations, M-3-how, M-4-subjects, M-6-reviews, M-7-prices, M-8-faq, M-9-about, M-10-footer |
| Глобальные | X-thanks-d/-m/-night, X-menu, X-bottombar, X-cookie-d/-m, X-form-errors, X-header-d/-m |
| Страница репетитора | T-1…T-7 (десктоп), TM-1…TM-7 (телефон) |
| Статусы и служебные | T-S-full, T-S-archived, T-S-formfull, TM-S-*, P-404-d/-m, P-privacy-d/-m, P-og, T-S-statuses |
| Дизайн-система | DS-Foundations, DS-Components, DS-Papers, DS-States, Button, Chip, Sheet, PuzzleStep, Doodle, SectionHead, Logo |

### Известные расхождения макетов с ТЗ (тексты и поведение берём из ТЗ)

- **Согласие под формой.** В макете «хранятся в Google Таблицах» и нет фразы о сроке. По ТЗ: «хранятся на сервере в Беларуси…», полный текст – ТЗ главной, поле 9.
- **DS-States.**
  - Ошибка согласия «Без согласия мы не сможем…» – по ТЗ: «Без согласия репетиторы не смогут обработать заявку».
  - Чип «К репетитору: [Имя] ✕» снимаемый – по ТЗ чип «Репетитор: Андрей» без ✕, снять нельзя.
- **DS-Components → PuzzleStep.** Примеры «Подбор репетитора», «Отчёт раз в месяц» устарели: подбора и ежемесячных отчётов нет.
- **D-9 «О сайте».**
  - Заголовок по ТЗ – «О сайте».
  - Нужна фраза «PuzzleUp не организация, не юрлицо и не ИП».
  - В карточках – кнопка «Записаться к {имени}» и мессенджеры.
- **D-10 подвал.**
  - Нужно раскрытие «Не является организацией, юридическим лицом или ИП» и «Сайт ведёт [ФИО]».
  - Строка «© 2026 [ФИО], [ФИО]».
  - Колонка «Репетиторы»: имя-ссылка, под ним Telegram и Viber.
  - Почты нет. Текст раскрытия – 15 px, paper 85%.
- **T-1 профиль.** «Услуги оказывает…» – заметный блок 15 px, ink-2, линия 2 px accent-text слева, а не серая строка.
- **«Спасибо».** Текст подставляет выбранный способ связи («…напишет вам в Viber» / «…позвонит»), кнопки – «Написать Андрею в Telegram/Viber».
- **D-5 репетиторы.** Два репетитора – две карточки по 5 колонок сетки, по центру (а не на всю ширину в две колонки).

# Модель данных

Две части: контент в репозитории (`content/`, проверяется Zod при сборке) и рабочие данные в PostgreSQL. Поля контента – из ТЗ (`docs/spec/home.md`, раздел «Источники данных»; `docs/spec/tutor-page.md`, раздел 2). При расхождении действует ТЗ, этот файл обновляется.

## 1. Контент (`content/`)

### `tutors/<slug>.mdx`

Frontmatter + тело «О себе» (600–1200 символов, 2–4 абзаца, от первого лица).

| Поле | Тип | Обяз. | Правила |
|---|---|---|---|
| `id` | string | да | `t-<slug>`, постоянный, не меняется никогда; хранится в заявках и отзывах |
| `slug` | string | да | латиница, нижний регистр, дефисы; уникален |
| `name` | string | да | имя для заголовков: «Андрей» |
| `nameDative` | string | да | «Андрею» |
| `namePrepositional` | string | да | «Андрее» |
| `fullName` | string | да* | ФИО для «Услуги оказывает» и подвала |
| `unp` | string | да* | 9 цифр |
| `photo` | string | нет | файл в `public/tutors/`; нет – инициалы на kraft |
| `subjects` | `{ id: SubjectId, from: number, to: number }[]` | да | предмет из `subjects.json`, классы в его диапазоне |
| `education` | string | да | одна строка, только подтверждённое документом |
| `teachingSince` | number | да | год; стаж считается автоматически |
| `tagline` | string | да | до 90 символов, без гарантий |
| `goals` | `Goal[]` | да | `ct` – только при классах 10–11 |
| `hobby` | string | нет | 1–2 фразы |
| `personalNote` | string | нет | 1–2 фразы |
| `availability` | `'available' \| 'few' \| 'full'` | да | **только начальное значение**, текущее – в БД |
| `archived` | boolean | да | ушёл: страница с `noindex`, не выводится в списках |
| `order` | number | да | порядок внутри статуса |
| `price` | number | да | BYN за 60 минут |
| `telegram` | string | да | ник без @ или ссылка t.me |
| `viber` | string | да | номер для `viber://chat?number=`; на странице текстом не показывается |
| `terms` | string | нет | условия оплаты и переноса; нет – стандартные из `site.json` |
| `platforms` | string[] | нет | если не «Google Meet, Miro» |
| `seoDescription` | string | нет | иначе собирается шаблоном |

\* Обязательны, пока репетитор на НПД. На этапе разработки допустимы заглушки вида `[ФИО]`. `pnpm content:check --strict` (запускается перед релизом) падает, если заглушки остались.

### `subjects.json`

```ts
{
  id: 'math' | 'physics' | string,      // SubjectId
  name: string,                          // «математика»
  nameAccusative: string,                // «математику»
  nameDativeWithPrep: string,            // «по математике»
  gradeFrom: number, gradeTo: number,
  topics: string[],                      // 4–6
  formula: string,                       // декор карточки
  paper: 'cell' | 'mm' | 'lined' | 'lined-margin' | 'slanted' | 'staff' | 'plain',
  status: 'active' | 'hidden'
}
```

Сейчас `active` только `math`, `physics` – `hidden`.

### `reviews.json`

```ts
{
  id: string,
  tutorId: string,           // обязателен, должен существовать
  author: string,            // «Ольга»
  relation: string,          // «мама ученика 7 класса»
  subject: SubjectId,
  text: string,
  date: 'YYYY-MM-DD',
  featured: boolean,         // для главной – самый новый featured у репетитора
  consent: boolean,          // выводятся только true
  source: string             // откуда взят, на сайте не показывается
}
```

### `situations.json`, `faq.json`, `site.json`

- `situations.json`: `{ id, title, text, goal: Goal, tutors?: string[] }`. Без `tutors` – все репетиторы с подходящими классами.
- `faq.json`: `{ id, question, answer }`. Ответ – строка с простым Markdown. Плейсхолдеры вроде `{tutorsGrades}` собираются из данных.
- `site.json`:
  - название, слоган;
  - тексты раскрытия для подвала и блока «О сайте»;
  - часы ответа `{ from: '09:00', to: '22:00', tz: 'Europe/Minsk' }`;
  - стандартные `terms`;
  - подписи к ценам;
  - тексты согласия с версией `consentVersion`;
  - кто ведёт сайт (`siteOperatorTutorId: 't-andrei'`).

### Перекрёстные проверки (`pnpm content:check`, тест)

- `id` и `slug` репетиторов уникальны.
- Предмет репетитора есть в `subjects.json`, классы – в его диапазоне.
- `reviews[].tutorId` существует.
- Указанное фото существует.
- `goals` содержит `ct` только у репетитора с 10–11 классами.
- `situations[].tutors` существуют.
- В строках нет запрещённых слов из ТЗ: «мы», «наш», «команда», «центр», «школа», «компания», «подберём», «гарантир».

## 2. Перечисления (общие для формы, БД и бота)

```ts
type Goal = 'grades' | 'exam9' | 'ct' | 'olymp'
type ContactMethod = 'telegram' | 'viber' | 'call'
type ContactTime = 'morning' | 'day' | 'evening' | 'any'
type LeadSource = 'form' | 'telegram' | 'viber' | 'call' | 'other'   // «Способ обращения»
type LeadStatus =
  | 'new' | 'contacted' | 'no_answer' | 'trial_scheduled' | 'trial_done'
  | 'student' | 'rejected' | 'waitlist'
type RejectionReason = 'expensive' | 'schedule' | 'chose_other' | 'no_response' | 'other'
type Availability = 'available' | 'few' | 'full'
type Entry =
  | 'hero' | 'header' | 'bottom_bar' | 'tutors' | 'situations' | 'subjects' | 'prices'
  | 'faq' | 'about' | 'tutor_profile' | 'tutor_more' | 'tutor_full' | '404' | 'direct'
type ReferralChannel = 'instagram' | 'tiktok' | 'telegram' | 'word_of_mouth' | 'search' | 'other'  // «откуда узнали» в /add
```

Подписи на русском – в одном месте, `src/lib/labels.ts`.

| LeadStatus | Подпись |
|---|---|
| new | новая |
| contacted | связался |
| no_answer | не дозвонились |
| trial_scheduled | пробное назначено |
| trial_done | пробное проведено |
| student | ученик |
| rejected | отказ |
| waitlist | лист ожидания |

## 3. PostgreSQL (Drizzle, `src/server/db/schema/`)

### `leads`

| Колонка | Тип | Примечание |
|---|---|---|
| `id` | bigint identity, старт 1001 | номер заявки «№ 1024», ключ строки в Таблице |
| `created_at` | timestamptz | |
| `tutor_id` | text not null | id из контента |
| `source` | LeadSource | `form` для сайта |
| `parent_name` | text null | ПД; null у `/add` |
| `phone` | text null | ПД, хранится в E.164: `+375291234567` |
| `contact_method` | ContactMethod null | |
| `grade` | smallint | 5–11 |
| `subjects` | text[] | |
| `goal` | Goal null | |
| `contact_time` | ContactTime[] | |
| `comment` | text null | ПД, до 1000 символов |
| `entry` | Entry | |
| `landing_path` | text | путь страницы с формой |
| `utm_source` … `utm_content` | text null | пять колонок; у `/add` в `utm_source` – ReferralChannel |
| `availability_at_submit` | Availability null | |
| `status` | LeadStatus | |
| `status_changed_at` | timestamptz | от него считается срок хранения |
| `status_changed_by` | text null | tutorId |
| `rejection_reason` | RejectionReason null | |
| `trial_done_at` | timestamptz null | первый переход в `trial_done` |
| `student_at` | timestamptz null | первый переход в `student` |
| `telegram_message_id` | bigint null | сообщение в общем чате |
| `reminder_sent_at` | timestamptz null | |

Индексы: `(status, created_at)` для напоминаний, `(status_changed_at)` для удаления.

### `consents`

`id`, `lead_id` FK → `leads` on delete cascade, `given_at`, `consent_version` (из `site.json`), `consent_text_sha256`. IP и user agent не храним.

### `lead_events`

Журнал изменений для аудита: `id`, `lead_id` FK cascade, `at`, `type` (`created`, `status_changed`), `from_status`, `to_status`, `actor` (tutorId или `system`).

### `outbox`

| Колонка | Тип |
|---|---|
| `id` | bigint identity |
| `type` | `'telegram.lead_created' \| 'telegram.lead_updated' \| 'telegram.reminder' \| 'telegram.alert' \| 'sheets.upsert'` |
| `payload` | jsonb – только идентификаторы (`{ leadId }`), без ПД |
| `status` | `'pending' \| 'processing' \| 'done' \| 'dead'` |
| `attempts` | int |
| `run_at` | timestamptz |
| `locked_at` | timestamptz null |
| `last_error` | text null – без ПД |
| `created_at`, `done_at` | timestamptz |

Индекс: `(status, run_at)`. Триггер `pg_notify('outbox', id)` на вставку.

### `tutor_availability`

`tutor_id` PK, `status` Availability, `updated_at`, `updated_by`. При первом старте заполняется из MDX (`availability`) для репетиторов, которых ещё нет в таблице.

### `bot_dialogs`

Состояние пошаговых диалогов `/add` и выбора причины отказа: `chat_id`, `user_id`, `kind`, `step`, `data` jsonb, `expires_at` (30 минут).

### Удаление по сроку

Ежедневно: `DELETE FROM leads WHERE status_changed_at < now() - interval '6 months'` – каскадом удаляются `consents` и `lead_events`. Задания outbox на удалённые заявки помечаются `done` с пометкой `lead_deleted`.

## 4. Google Таблица – лист «Заявки»

Только обезличенные данные. Синхронизация пишет по буквам столбцов, порядок менять нельзя. Строка ищется по столбцу A.

| Столбец | Заголовок | Значение |
|---|---|---|
| A | № заявки | `leads.id` |
| B | Дата и время | `created_at` по Минску, `ДД.ММ.ГГГГ ЧЧ:ММ` |
| C | Репетитор | `name` по `tutor_id` |
| D | Класс | `grade` |
| E | Предмет | названия через запятую |
| F | Цель | подпись Goal |
| G | Способ обращения | форма / Telegram / Viber / звонок / другое |
| H | Откуда на сайте | `entry` |
| I | Канал | `utm_source` (у `/add` – «откуда узнали») |
| J | Тип трафика | `utm_medium` |
| K | Кампания | `utm_campaign` |
| L | Объявление | `utm_content` |
| M | Статус | подпись LeadStatus |
| N | Дата пробного | `trial_done_at`, `ДД.ММ.ГГГГ` |
| O | Дата «ученик» | `student_at`, `ДД.ММ.ГГГГ` |
| P | Причина отказа | подпись RejectionReason |
| Q | Изменено | `status_changed_at`, `ДД.ММ.ГГГГ ЧЧ:ММ` |

`utm_term` в таблицу не идёт. Остальные листы – «Сводка», «Недели», «Ссылки» (генератор UTM), «Расходы» (вручную), «Справочники», «Инструкция» – считаются формулами, синхронизация их не трогает. Шаблон Таблицы создаётся отдельной задачей (`docs/roadmap.md`).

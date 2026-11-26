# Модель данных

Две части: контент в репозитории (`content/`, проверяется Zod при сборке) и рабочие данные в PostgreSQL. Поля контента – из ТЗ (`docs/spec/home/1-general.md`, «Источники данных»; `docs/spec/tutor-page/2-tutor-data.md`). При расхождении действует ТЗ, этот файл обновляется.

## 1. Контент (`content/`)

### `tutors/<slug>.mdx`

Frontmatter + тело «О себе» (600–1200 символов, 2–4 абзаца, от первого лица).

| Поле | Тип | Обяз. | Правила |
|---|---|---|---|
| `id` | string | да | `t-<slug>` на момент создания, постоянный, не меняется никогда, даже при смене `slug`; хранится в заявках и отзывах |
| `slug` | string | да | латиница, нижний регистр, дефисы; уникален |
| `name` | string | да | имя для заголовков: «Андрей» |
| `nameGenitive` | string | да | «Андрея»: «Условия Андрея», «Сейчас у Андрея нет свободного времени» |
| `nameDative` | string | да | «Андрею» |
| `namePrepositional` | string | да | «Андрее» |
| `pronoun` | `'он' \| 'она'` | да | «он ответит с 9:00 до 22:00» («Как начать»), «посмотрите его страницу» (плашка ушедшего, подсказка о классе) |
| `fullName` | string | да* | ФИО для «Услуги оказывает» и подвала |
| `unp` | string | да* | 9 цифр, в YAML – в кавычках: `'123456789'` |
| `photo` | string | нет | JPEG или PNG в `public/tutors/` (`next/og` не читает WebP и AVIF); нет – инициалы на kraft |
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
| `telegram` | string | да | ник без @ или ссылка `https://t.me/…` |
| `viber` | string | да | номер для `viber://chat?number=`; на странице текстом не показывается |
| `terms` | string | нет | условия оплаты и переноса; нет – стандартные из `site.json` |
| `platforms` | string[] | нет | если не «Google Meet, Miro» |
| `seoDescription` | string | нет | иначе собирается шаблоном |

\* Обязательны, пока репетитор на НПД.

**Заглушки.** Пока данных нет, поля `fullName`, `unp`, `education`, `teachingSince`, `telegram`, `viber` могут быть заглушкой вида `[ФИО]` (та же запись, что в макетах). Черновые тексты (`tagline`, `hobby`, тело «О себе») тоже берутся в квадратные скобки – по абзацу. Обычная проверка заглушки пропускает, `pnpm content:check --strict` (перед релизом) падает на любой из них во всех файлах `content/`. Ссылка Markdown `[текст](адрес)` заглушкой не считается.

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
  paper: 'cell' | 'mm' | 'lined' | 'slanted' | 'staff' | 'margin' | 'plain',  // = SheetKind
  status: 'active' | 'hidden'
}
```

Сейчас `active` только `math`, `physics` – `hidden`. Значения `paper` совпадают с `kind` компонента `Sheet`: `lined` – линейка с красным полем, `margin` – чистый лист с полями.

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

Корень `reviews.json`, `subjects.json`, `situations.json`, `faq.json` – массив, `site.json` – объект. Объекты строгие: неизвестное поле – ошибка.

- `situations.json`: `{ id, title, text, goal: Goal, tutors?: string[] }`. Без `tutors` – все репетиторы, у кого в `goals` есть эта цель (ADR-036). Карточка без репетиторов не выводится.
- `faq.json`: `{ id, question, answer }`. Ответ – строка с простым Markdown. В ответе допустим плейсхолдер `{tutorsGrades}` – собирается из данных.
- `site.json`:

| Поле | Что |
|---|---|
| `name`, `slogan` | «PuzzleUp», «Всё сложится.» |
| `url` | боевой адрес `https://puzzle-up.by` без `/` в конце: canonical, sitemap, `og:image`, JSON-LD (ADR-055) |
| `disclosure` | раскрытие статуса сайта отдельной фразой – для мест вне подвала; в подвале раскрытие входит в `footer.requisites` (ADR-041) |
| `about` | текст блока «О сайте» как есть (решение владельца, ADR-035) |
| `footer.tagline`, `footer.requisites`, `footer.copyright` | подвал; реквизиты – шаблон с `{tutorsRequisites}` и `{siteOperatorFullName}`, копирайт – с `{tutorsFullNames}` |
| `responseHours` | `{ from: '09:00', to: '22:00', tz: 'Europe/Minsk' }`, `from` раньше `to` |
| `defaultTerms` | стандартные условия оплаты и переноса |
| `defaultPlatforms` | `['Google Meet', 'Miro']` для репетитора без `platforms` |
| `prices` | заголовки и подписи карточек «Пробное занятие» и «Занятие», строка об оплате, сноска об оферте |
| `consent` | `version` (дата редакции, `YYYY-MM-DD`), `label`, `policyLinkLabel`, `details` – шаблон с `{operators}` |
| `analytics` | необязательные счётчики: `umami { scriptUrl, websiteId }` (адрес `https://`, UUID сайта в Umami) и `metrika { counterId }`; до релиза – заглушки `[…]`. Работают только на боевом адресе `url`; cookie-баннер есть, когда есть поле `metrika`, в том числе с заглушкой (ADR-056). На запуске `metrika` нет (ADR-057) |
| `cookieBanner` | `text` и `policyLinkLabel` cookie-баннера: «{text} Подробнее – в {policyLinkLabel}.», ссылка – на `/cookies` |
| `siteOperatorTutorId` | кто ведёт сайт: `t-andrei` |
| `trialExample` | необязательный пример итога пробного занятия (блок «Как это работает»): `{ tutorId, intro, strong, improve, startWith, offer }` – сообщение репетитора `tutorId`, строки «Уверенно», «Подтянуть», «Начнём с». Репетитор должен существовать; если он ушёл, карточки нет |

Плейсхолдеры `{key}` разрешены только в перечисленных полях (`src/content/schemas.ts`), подстановка – `src/lib/template.ts`.

### Перекрёстные проверки (`pnpm content:check`, тест)

- `id` и `slug` репетиторов уникальны, `slug` совпадает с именем файла, `id` – вида `t-…`.
- Предмет репетитора есть в `subjects.json`, классы – в его диапазоне.
- `reviews[].tutorId` существует, предмет отзыва репетитор ведёт.
- Указанное фото существует.
- `goals` содержит `ct` только у репетитора с 10–11 классами.
- `situations[].tutors` существуют, и у каждого есть цель карточки.
- `id` в JSON-файлах уникальны; `siteOperatorTutorId` существует и не в архиве; есть `legal/privacy.mdx` и `legal/cookies.mdx`.
- Плейсхолдеры `{key}` – только известные.
- Во всех строках и в теле MDX нет запрещённых слов из ТЗ: «мы», «наш», «находим», «разбираем», «решаем», «команда», «центр», «школа» (только эта форма: «учится в школе» – обязательный текст), «компания», «© PuzzleUp», «подберём», «гарантир», «с первого раза», «педагог», «опытный преподаватель». Типографика: нет дефиса вместо тире, «—» и прямых кавычек.
- Только `--strict`: нет заглушек `[…]`, «О себе» – 600–1200 символов и 2–4 абзаца.

Где запускается: загрузчик `src/content` при `next build` и `next dev` (схемы и связи), `pnpm content:check` – ещё и синтаксис YAML/MDX и фото – в `pnpm build`, CI и pre-commit при изменении `content/**`. Поэтому production-сборка – только `pnpm build`, не `next build` напрямую (в том числе в Dockerfile).

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
| `grade` | smallint | 5–11; база проверяет только 1–11, диапазон предмета – форма |
| `subjects` | text[] | хотя бы один |
| `goal` | Goal null | |
| `contact_time` | ContactTime[] | пустой массив по умолчанию |
| `comment` | text null | ПД, до 1000 символов |
| `entry` | Entry null | null у `/add` (ADR-048) |
| `landing_path` | text null | путь страницы с формой; null у `/add` |
| `utm_source` … `utm_content` | text null | пять колонок; у `/add` в `utm_source` – ReferralChannel |
| `availability_at_submit` | Availability null | |
| `status` | LeadStatus | `new` по умолчанию |
| `status_changed_at` | timestamptz | от него считается срок хранения |
| `status_changed_by` | text null | tutorId |
| `rejection_reason` | RejectionReason null | |
| `trial_done_at` | timestamptz null | первый переход в `trial_done` |
| `student_at` | timestamptz null | первый переход в `student` |
| `telegram_message_id` | bigint null | сообщение в общем чате |
| `reminder_sent_at` | timestamptz null | |

Индексы: `(status, created_at)` для напоминаний, `(status_changed_at)` для удаления.

Ограничения (CHECK): у заявки с `source = 'form'` заполнены `parent_name`, `phone`, `contact_method`, `entry`, `landing_path`; `phone` – E.164; `comment` – до 1000 символов. Это последний рубеж, правила для родителя – в Zod-схеме формы.

Перечисления – `pgEnum` из Zod-схем `src/lib` (`goal.ts`, `availability.ts`, `entry.ts`, `lead.ts`). Новое значение – `pnpm db:generate` (миграция `ALTER TYPE … ADD VALUE`), удаление и переименование – только миграцией, написанной вручную.

### `consents`

`id`, `lead_id` FK → `leads` on delete cascade, `given_at`, `consent_version` (из `site.json`), `consent_text_sha256`. IP и user agent не храним.

### `lead_events`

Журнал изменений для аудита: `id`, `lead_id` FK cascade, `at`, `type` (`created`, `status_changed`), `from_status` (null у `created`), `to_status`, `actor` (tutorId или `system`).

### `outbox`

| Колонка | Тип |
|---|---|
| `id` | bigint identity |
| `type` | `'telegram.lead_created' \| 'telegram.lead_updated' \| 'telegram.reminder' \| 'telegram.alert' \| 'sheets.upsert'` |
| `payload` | jsonb – только идентификаторы: `{ leadId }`, у `telegram.alert` – `{ outboxId }` задания, ушедшего в `dead`; без ПД |
| `status` | `'pending' \| 'processing' \| 'done' \| 'dead'` |
| `attempts` | int |
| `run_at` | timestamptz |
| `locked_at` | timestamptz null |
| `last_error` | text null – без ПД |
| `created_at`, `done_at` | timestamptz |

Индекс: `(status, run_at)`. Триггер `pg_notify('outbox', id)` на вставку – миграция `0001_outbox_notify.sql`, написанная вручную.

### `tutor_availability`

`tutor_id` PK, `status` Availability, `updated_at`, `updated_by` (tutorId или `system`). Заполняется из MDX (`availability`) для репетиторов, которых ещё нет в таблице, при каждом `pnpm db:migrate` (`src/server/availability/seed.ts`); записанный статус не перезаписывается.

### `bot_dialogs`

Состояние пошаговых диалогов (сейчас – `/add`): `chat_id`, `user_id`, `kind`, `step`, `data` jsonb (у `/add` – ответы и `messageId` сообщения с вопросом), `expires_at` (30 минут от последнего шага). Ключ – `(chat_id, user_id)`: один активный диалог пользователя в чате, новый `/add` заменяет прежний. Причина отказа выбирается без диалога: всё нужное – в `callback_data` кнопки (ADR-051).

### Удаление по сроку

Ежедневно (`src/server/jobs/retention.ts`): `DELETE FROM leads WHERE status_changed_at < now() - interval '6 months'` – каскадом удаляются `consents` и `lead_events`. Задания outbox на удалённые заявки в статусах `pending` и `dead` помечаются `done` с `last_error = 'lead_deleted'`; `processing` закрывает сам обработчик – заявки уже нет. Выполненные задания outbox удаляются через 30 дней после `done_at`.

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

`utm_term` в таблицу не идёт. Пустое значение – пустая ячейка. Даты (B, N, O, Q) пишутся числами дней по Минску – так Таблица хранит даты, и по ним считают формулы «Недель»; вид `ДД.ММ.ГГГГ` задаёт формат столбца. Канал ручной заявки – код «откуда узнали» (`word_of_mouth`), а не подпись: так он совпадает с `utm_source` рекламы той же площадки (ADR-052).

Остальные листы – «Сводка», «Недели», «Ссылки» (генератор UTM), «Расходы» (вручную), «Справочники», «Инструкция» – считаются формулами, синхронизация их не трогает. Шаблон – `src/server/sheets/template.ts`, применяется командой `pnpm sheets:setup` (`docs/architecture.md`, раздел 8).

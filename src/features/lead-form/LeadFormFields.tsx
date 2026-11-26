'use client';

import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import Link from 'next/link';
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';

import { sessionStore } from '@/components/layout/UtmCapture';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { MessengerButtons } from '@/components/ui/MessengerButtons';
import { entrySchema, type Entry } from '@/lib/entry';
import { goalSchema } from '@/lib/goal';
import { CONTACT_METHOD_LABELS, CONTACT_TIME_LABELS } from '@/lib/labels';
import { contactMethodSchema, contactTimeSchema } from '@/lib/lead';
import { rememberUtm } from '@/lib/utm';

import type { LeadActionState } from './action';
import { ChipGroup } from './ChipGroup';
import { gradeHintKey, type LeadFormData } from './form-data';
import { PhoneField } from './PhoneField';
import { COMMENT_COUNTER_FROM, COMMENT_MAX, HONEYPOT, leadSchema, NAME_MAX } from './schema';
import {
  COMMENT_HINT,
  commentCounter,
  DETAILS_TOGGLE,
  errorCount,
  LABEL_COMMENT,
  LABEL_CONTACT,
  LABEL_CONTACT_TIME,
  LABEL_GOAL,
  LABEL_GRADE,
  LABEL_NAME,
  LABEL_SUBJECTS,
  RATE_LIMIT_ERROR,
  SERVER_ERROR,
  SUBMIT,
} from './texts';
import { UrlParams } from './UrlParams';

// Поля формы заявки по порядку ТЗ главной, блок 9: чип репетитора стоит в LeadSection, здесь –
// поля 1–9, ловушка и скрытые поля. Проверка – при уходе из поля и при отправке (Conform + та же
// Zod-схема, что на сервере); при ошибках фокус – на первом неверном поле, число ошибок
// объявляется через aria-live. Данные формы в браузере не сохраняются: это ПД.

const CONTACT_METHODS = contactMethodSchema.options.map((value) => ({
  value,
  label: CONTACT_METHOD_LABELS[value],
}));
const CONTACT_TIMES = contactTimeSchema.options.map((value) => ({
  value,
  label: CONTACT_TIME_LABELS[value],
}));

/** Поля с ошибками по порядку формы: «subjects[0]» – это поле «subjects». */
const FIELD_ORDER = [
  'parentName',
  'phone',
  'contactMethod',
  'grade',
  'subjects',
  'goal',
  'contactTime',
  'comment',
  'consent',
] as const;
const DETAIL_FIELDS = new Set<string>(['goal', 'contactTime', 'comment']);

type LeadFormFieldsProps = {
  id: string;
  data: LeadFormData;
  state: LeadActionState | undefined;
  /** Server Action для отправки без JavaScript. */
  action: (formData: FormData) => void;
  pending: boolean;
  /** Отправка с JavaScript – после проверки на месте. */
  onValid: (formData: FormData) => void;
};

type ReportRefs = {
  form: RefObject<HTMLFormElement | null>;
  details: RefObject<HTMLDetailsElement | null>;
  live: RefObject<HTMLParagraphElement | null>;
};

/**
 * Фокус на первое неверное поле по порядку формы и «В форме 2 ошибки» в aria-live. Подробности
 * раскрываются до фокуса: поле в закрытом <details> фокус не примет.
 */
function reportErrors(keys: readonly string[], refs: ReportRefs) {
  const names = FIELD_ORDER.filter((name) =>
    keys.some((key) => key === name || key.startsWith(`${name}[`)),
  );
  const first = names[0];
  if (first === undefined) return;
  if (DETAIL_FIELDS.has(first) && refs.details.current) refs.details.current.open = true;
  refs.form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  const live = refs.live.current;
  if (!live) return;
  // Сначала пусто: то же число ошибок при повторной отправке тоже объявляется.
  live.textContent = '';
  requestAnimationFrame(() => {
    live.textContent = errorCount(names.length);
  });
}

const asArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? [value]
      : [];

export function LeadFormFields({ id, data, state, action, pending, onValid }: LeadFormFieldsProps) {
  const schema = leadSchema(data.options);
  // Conform вызывает onSubmit только для верной формы: так видно, что проверка не прошла.
  const passed = useRef(false);
  const lastResult = state?.result;
  const [form, fields] = useForm({
    id,
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    onSubmit(event, { formData }) {
      event.preventDefault();
      passed.current = true;
      // UTM первого захода – из sessionStorage (ТЗ главной, раздел 8); без JavaScript их нет.
      for (const [key, tag] of Object.entries(
        rememberUtm(window.location.search, sessionStore()),
      )) {
        formData.set(key, tag);
      }
      onValid(formData);
    },
  });
  const initial = lastResult?.initialValue ?? {};

  // Поля с выбором, от которых зависят подсказки и параметры адреса, – управляемые.
  const [grade, setGrade] = useState(() => asArray(initial.grade)[0]);
  const [subjects, setSubjects] = useState(() =>
    'subjects' in initial ? asArray(initial.subjects) : data.defaultSubjects,
  );
  const [goal, setGoal] = useState(() => goalSchema.safeParse(asArray(initial.goal)[0]).data);
  const [commentLength, setCommentLength] = useState(asArray(initial.comment)[0]?.length ?? 0);
  const [entry, setEntry] = useState<Entry>('direct');

  const errors = Object.fromEntries(
    FIELD_ORDER.map((name) => [
      name,
      Object.entries(form.allErrors).find(
        ([key]) => key === name || key.startsWith(`${name}[`),
      )?.[1][0],
    ]),
  );
  const [detailsOpen, setDetailsOpen] = useState(() =>
    FIELD_ORDER.some((name) => DETAIL_FIELDS.has(name) && errors[name] !== undefined),
  );

  // Контекст из адреса: `entry` – в скрытое поле, `goal` раскрывает подробности и выбирает цель,
  // `subject` и `grade` – из подсказки другого репетитора (ТЗ страницы репетитора, блок 6).
  const applyParams = useCallback(
    (params: URLSearchParams) => {
      const fromUrl = entrySchema.safeParse(params.get('entry'));
      if (fromUrl.success) setEntry(fromUrl.data);
      const goalParam = goalSchema.safeParse(params.get('goal'));
      if (goalParam.success && data.options.goals.includes(goalParam.data)) {
        setGoal(goalParam.data);
        setDetailsOpen(true);
      }
      const subject = params.get('subject');
      if (subject && data.options.subjects.includes(subject)) setSubjects([subject]);
      const gradeParam = Number(params.get('grade'));
      if (data.options.grades.includes(gradeParam)) setGrade(String(gradeParam));
    },
    [data.options],
  );

  // После отправки с ошибками – фокус на первое неверное поле и число ошибок для дикторов.
  const formRef = useRef<HTMLFormElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const report = { form: formRef, details: detailsRef, live: liveRef };

  // Ответ сервера с ошибками полей – как отправка с ошибками.
  useEffect(() => {
    if (lastResult?.status === 'error' && lastResult.error) {
      reportErrors(Object.keys(lastResult.error), {
        form: formRef,
        details: detailsRef,
        live: liveRef,
      });
    }
  }, [lastResult]);

  function submit(event: FormEvent<HTMLFormElement>) {
    // Перепроверка поля при вводе и уходе из него – тоже событие submit: Conform отправляет форму
    // служебной кнопкой с `name` (намерение `validate`). Её он разбирает сам, а фокус и
    // объявление ошибок – только для отправки родителем (кнопка без `name` или Enter).
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    if (submitter?.getAttribute('name')) {
      form.onSubmit(event);
      return;
    }
    if (pending) {
      event.preventDefault();
      return;
    }
    passed.current = false;
    form.onSubmit(event);
    if (passed.current) return;
    const submission = parseWithZod(new FormData(event.currentTarget), { schema });
    if (submission.status === 'error' && submission.error) {
      reportErrors(
        Object.entries(submission.error)
          .filter((entry) => entry[1] !== null)
          .map(([key]) => key),
        report,
      );
    }
  }

  const subjectKey = subjects.length === 1 ? subjects[0] : undefined;
  const gradeNumber = grade === undefined ? undefined : Number(grade);
  const gradeHint =
    gradeNumber === undefined ? undefined : data.gradeHints[gradeHintKey(gradeNumber, subjectKey)];
  const earlyHints =
    gradeNumber === undefined
      ? []
      : data.earlySubjects.filter(
          (subject) => subjects.includes(subject.id) && gradeNumber < subject.gradeFrom,
        );

  return (
    <form
      ref={formRef}
      id={form.id}
      action={action}
      onSubmit={submit}
      noValidate={form.noValidate}
      className="flex flex-col gap-5"
    >
      <Suspense fallback={null}>
        <UrlParams onChange={applyParams} />
      </Suspense>

      <input type="hidden" name="tutorId" value={data.options.tutorId} />
      <input type="hidden" name="entry" value={entry} />
      <input type="hidden" name="landing" value={data.landing} />
      {/* Ловушка для спама: не видна, вне порядка фокуса, без автозаполнения. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <Field
        id={fields.parentName.id}
        name={fields.parentName.name}
        label={LABEL_NAME}
        tone="dark"
        autoComplete="name"
        maxLength={NAME_MAX}
        // Подсказка, а не пример имени: пример выглядел бы уже введённым.
        placeholder="Как к вам обращаться"
        defaultValue={asArray(initial.parentName)[0]}
        error={errors.parentName}
      />
      <PhoneField
        id={fields.phone.id}
        name={fields.phone.name}
        defaultValue={asArray(initial.phone)[0]}
        error={errors.phone}
      />
      <ChipGroup
        id={fields.contactMethod.id}
        name={fields.contactMethod.name}
        legend={LABEL_CONTACT}
        type="radio"
        options={CONTACT_METHODS}
        defaultValues={asArray(initial.contactMethod)}
        error={errors.contactMethod}
      />
      <ChipGroup
        id={fields.grade.id}
        name={fields.grade.name}
        legend={LABEL_GRADE}
        type="radio"
        options={data.grades}
        checked={(value) => String(value) === grade}
        onToggle={(value) => setGrade(String(value))}
        error={errors.grade}
        hint={
          gradeHint && (
            <p>
              {gradeHint.text}
              {gradeHint.link && (
                <Link
                  href={gradeHint.link.href}
                  className="text-paper underline underline-offset-2"
                >
                  {gradeHint.link.label}
                </Link>
              )}
            </p>
          )
        }
      />
      <ChipGroup
        id={fields.subjects.id}
        name={fields.subjects.name}
        legend={LABEL_SUBJECTS}
        type="checkbox"
        options={data.subjects}
        checked={(value) => subjects.includes(value)}
        onToggle={(value, on) =>
          setSubjects((current) =>
            on ? [...current, value] : current.filter((item) => item !== value),
          )
        }
        error={errors.subjects}
        hint={earlyHints.length > 0 && earlyHints.map((item) => <p key={item.id}>{item.hint}</p>)}
      />

      <details
        ref={detailsRef}
        open={detailsOpen}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
        className="group/details"
      >
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-field font-medium text-paper [&::-webkit-details-marker]:hidden">
          <Icon
            name="plus"
            size={20}
            className="transition-transform group-open/details:rotate-45"
          />
          <span className="underline underline-offset-4">{DETAILS_TOGGLE}</span>
        </summary>
        <div className="flex flex-col gap-5 pt-3">
          {data.goals.length > 0 && (
            <ChipGroup
              id={fields.goal.id}
              name={fields.goal.name}
              legend={LABEL_GOAL}
              type="radio"
              options={data.goals}
              checked={(value) => value === goal}
              onToggle={(value) => setGoal(value)}
              // Повторное нажатие снимает выбор (поле 6).
              onRepeat={() => setGoal(undefined)}
            />
          )}
          <ChipGroup
            id={fields.contactTime.id}
            name={fields.contactTime.name}
            legend={LABEL_CONTACT_TIME}
            type="checkbox"
            options={CONTACT_TIMES}
            defaultValues={asArray(initial.contactTime)}
          />
          <Field
            id={fields.comment.id}
            name={fields.comment.name}
            label={LABEL_COMMENT}
            tone="dark"
            multiline
            rows={4}
            defaultValue={asArray(initial.comment)[0]}
            onInput={(event) => setCommentLength(event.currentTarget.value.length)}
            error={errors.comment}
            hint={
              <span className="flex justify-between gap-3">
                <span>{COMMENT_HINT}</span>
                {commentLength >= COMMENT_COUNTER_FROM && (
                  <span className="whitespace-nowrap tabular-nums">
                    {commentCounter(commentLength, COMMENT_MAX)}
                  </span>
                )}
              </span>
            }
          />
        </div>
      </details>

      <Checkbox
        id={fields.consent.id}
        name={fields.consent.name}
        tone="dark"
        defaultChecked={asArray(initial.consent)[0] === 'on'}
        error={errors.consent}
        label={
          <>
            {data.consent.label} (
            <a
              href={data.consent.policyHref}
              target="_blank"
              rel="noopener"
              className="underline underline-offset-2"
            >
              {data.consent.policyLabel}
            </a>
            )
          </>
        }
        description={data.consent.details}
      />

      {state?.status === 'error' && state.problem && (
        <div role="alert" className="flex flex-col gap-3 rounded-field bg-paper/10 p-4">
          <p className="flex items-start gap-2 text-small text-paper">
            <Icon name="alert" size={20} className="mt-px flex-none text-error-light" />
            {state.problem === 'rate_limit' ? RATE_LIMIT_ERROR : SERVER_ERROR}
          </p>
          <MessengerButtons
            telegram={data.tutor.telegram}
            viber={data.tutor.viber}
            nameDative={data.tutor.nameDative}
            tone="dark"
            size="md"
          />
        </div>
      )}

      <Button type="submit" variant="accent" fullWidth loading={pending}>
        {SUBMIT}
      </Button>
      <p ref={liveRef} aria-live="polite" className="sr-only" />
    </form>
  );
}

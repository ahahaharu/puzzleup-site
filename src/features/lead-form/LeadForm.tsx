'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';

import { leadAnchor } from '@/lib/urls';

import { submitLead, type LeadActionState } from './action';
import type { LeadFormData } from './form-data';
import { LeadFormFields } from './LeadFormFields';
import { Thanks } from './Thanks';

// Форма заявки LeadForm – ТЗ главной, блок 9; ТЗ страницы репетитора, блок 6. Без JavaScript
// форма – обычный POST в Server Action (`useActionState` с адресом формы), страница приходит
// с ошибками или экраном «Спасибо». С JavaScript поля проверяются на месте, а заявка уходит
// без перезагрузки; сбой сети – та же плашка, что и ошибка сервера.

const NETWORK_ERROR: LeadActionState = { status: 'error', problem: 'server' };

export function LeadForm({ data }: { data: LeadFormData }) {
  // Без JavaScript – POST на эту же страницу и сразу к форме.
  const [serverState, formAction] = useActionState(submitLead, undefined, `${data.landing}#lead`);
  // Ответ на отправку с JavaScript; `{ state: undefined }` – новая пустая форма.
  const [clientState, setClientState] = useState<{ state: LeadActionState | undefined }>();
  const [pending, startTransition] = useTransition();
  // Новая форма после «Отправить ещё одну заявку» – новый ключ, поля пустые.
  const [round, setRound] = useState(0);
  const state = clientState ? clientState.state : serverState;
  const firstField = useRef(false);

  useEffect(() => {
    if (!firstField.current) return;
    firstField.current = false;
    document.getElementById(`lead-form-${round}-parentName`)?.focus();
  }, [round]);

  function send(formData: FormData) {
    if (pending) return;
    startTransition(async () => {
      let next: LeadActionState;
      try {
        next = await submitLead(state, formData);
      } catch {
        next = NETWORK_ERROR;
      }
      startTransition(() => setClientState({ state: next }));
    });
  }

  if (state?.status === 'success') {
    return (
      <Thanks
        tutor={data.tutor}
        contactMethod={state.thanks.contactMethod}
        night={state.thanks.night}
        responseFrom={data.responseFrom}
        againHref={leadAnchor(state.thanks.entry)}
        onAgain={() => {
          firstField.current = true;
          setClientState({ state: undefined });
          setRound((value) => value + 1);
        }}
        focus={clientState !== undefined}
      />
    );
  }

  return (
    <LeadFormFields
      key={round}
      id={`lead-form-${round}`}
      data={data}
      state={state}
      action={formAction}
      pending={pending}
      onValid={send}
    />
  );
}

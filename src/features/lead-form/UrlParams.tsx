'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Параметры адреса формы – `entry`, `goal`, `subject`, `grade` (ТЗ главной, раздел 3). Страница
// статическая, поэтому адрес читает клиент; компонент стоит в <Suspense> без запасного вида:
// сама форма остаётся в статической оболочке и без JavaScript. После `pushState` из
// SamePageLinks (`?entry=tutor_profile#lead`) Next обновляет useSearchParams – форма видит новый `entry`.

export function UrlParams({ onChange }: { onChange: (params: URLSearchParams) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    onChange(new URLSearchParams(params.toString()));
  }, [params, onChange]);
  return null;
}

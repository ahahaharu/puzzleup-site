import { ViewTransition, type ReactNode } from 'react';

// Фото репетитора перелетает из карточки в профиль на его странице (ADR-065): родитель видит, что
// открыл того, кого выбрал. React <ViewTransition> с общим именем на обеих страницах; перелёт – только
// при открытии профиля по ссылке карточки (тип перехода OPEN_PROFILE). «Записаться» ведёт к форме
// внизу страницы – туда фото улетало бы за край экрана, поэтому у других переходов его нет.
// Без поддержки View Transitions переход обычный.

/** Тип перехода у ссылок карточки на профиль – `transitionTypes` у next/link. */
export const OPEN_PROFILE = 'open-profile';

export function TutorPhotoTransition({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <ViewTransition
      name={`tutor-photo-${slug}`}
      share={{ [OPEN_PROFILE]: 'morph', default: 'none' }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

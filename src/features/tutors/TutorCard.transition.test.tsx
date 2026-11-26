import Link from 'next/link';
import { isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { tutorUrl } from '@/lib/urls';

import { FIXTURE_TUTORS } from './fixtures';
import { TutorCard } from './TutorCard';
import { OPEN_PROFILE } from './TutorPhotoTransition';

type LinkProps = { href?: unknown; transitionTypes?: string[]; children?: ReactNode };

/** Все элементы со ссылкой в дереве карточки, без раскрытия вложенных компонентов. */
function links(node: ReactNode): { type: unknown; props: LinkProps }[] {
  if (Array.isArray(node)) return node.flatMap(links);
  if (!isValidElement<LinkProps>(node)) return [];
  const own = node.props.href === undefined ? [] : [{ type: node.type, props: node.props }];
  return [...own, ...links(node.props.children)];
}

const ANNA = FIXTURE_TUTORS[0]!;

describe('TutorCard photo transition', () => {
  // TutorCard – синхронный серверный компонент: его дерево видно без рендера, тип перехода next/link
  // в DOM не попадает.
  const tree = links(TutorCard({ tutor: { ...ANNA, reviewCount: 2 } }));
  const toProfile = tree.filter(({ props }) => props.href === tutorUrl(ANNA.slug));
  const elsewhere = tree.filter(({ props }) => props.href !== tutorUrl(ANNA.slug));

  it('starts the photo flight from the photo, the name and «Подробнее»', () => {
    expect(toProfile).toHaveLength(3);
    for (const { type, props } of toProfile) {
      expect(type).toBe(Link);
      expect(props.transitionTypes).toEqual([OPEN_PROFILE]);
    }
  });

  it('leaves the photo alone on the lead button and the reviews link', () => {
    expect(elsewhere.length).toBeGreaterThanOrEqual(2);
    for (const { props } of elsewhere) expect(props.transitionTypes).toBeUndefined();
  });
});

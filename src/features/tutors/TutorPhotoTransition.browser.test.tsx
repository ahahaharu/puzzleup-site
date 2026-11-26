import { addTransitionType, startTransition, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { OPEN_PROFILE, TutorPhotoTransition } from './TutorPhotoTransition';

// Смена «карточка → профиль» в одном дереве – как переход между страницами: React запускает
// View Transition и складывает пару по общему имени.
function Pages({ type }: { type?: string | undefined }) {
  const [page, setPage] = useState<'card' | 'profile'>('card');
  return (
    <>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            if (type) addTransitionType(type);
            setPage('profile');
          })
        }
      >
        Открыть
      </button>
      {page === 'card' ? (
        <TutorPhotoTransition key="card" slug="anna">
          <div style={{ width: 92, height: 115 }}>карточка</div>
        </TutorPhotoTransition>
      ) : (
        <TutorPhotoTransition key="profile" slug="anna">
          <div style={{ width: 420, height: 525, marginTop: 200 }}>профиль</div>
        </TutorPhotoTransition>
      )}
    </>
  );
}

/** Псевдоэлементы View Transition, которые анимировались после нажатия. */
async function transitionedAfterClick(type?: string) {
  const seen = new Set<string>();
  const screen = await render(<Pages type={type} />);
  const watch = () => {
    for (const animation of document.getAnimations()) {
      const pseudo = animation.effect instanceof KeyframeEffect && animation.effect.pseudoElement;
      if (pseudo) seen.add(pseudo);
    }
  };
  const timer = setInterval(watch, 10);
  await screen.getByRole('button', { name: 'Открыть' }).click();
  await expect.element(screen.getByText('профиль')).toBeInTheDocument();
  await new Promise((resolve) => setTimeout(resolve, 200));
  clearInterval(timer);
  return seen;
}

describe('TutorPhotoTransition', () => {
  it('flies the photo from the card into the profile when the profile is opened', async () => {
    const seen = await transitionedAfterClick(OPEN_PROFILE);
    expect(seen).toContain('::view-transition-group(tutor-photo-anna)');
  });

  it('leaves the photo alone on any other navigation', async () => {
    const seen = await transitionedAfterClick();
    expect(seen).not.toContain('::view-transition-group(tutor-photo-anna)');
  });
});

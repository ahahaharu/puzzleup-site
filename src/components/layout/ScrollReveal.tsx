'use client';

import { useEffect } from 'react';

import { dueReveals, isBelowFold, REVEAL_DURATION_MS, REVEAL_EASING } from '@/lib/reveal';

// Появление блоков при прокрутке – ADR-063. Сервер только помечает блоки `data-reveal`; прячет их
// этот скрипт и только те, что после загрузки ниже окна. Без JavaScript, до гидратации и при
// prefers-reduced-motion всё видно сразу. Блоки, добавленные позже (гидратация «Репетиторов»,
// переход между страницами), подхватывает MutationObserver.
// Скрытие и появление – Web Animations API, а не атрибуты: разметку, которую React ещё гидратирует
// (Suspense-граница «Репетиторов»), менять нельзя.

const SELECTOR = '[data-reveal]';

/** Начальный кадр – из `--reveal-from` вида блока (globals.css), на десктопе он бывает другим. */
function keyframes(element: Element): Keyframe[] {
  const from = getComputedStyle(element).getPropertyValue('--reveal-from').trim() || 'none';
  return [
    { opacity: 0, transform: from },
    { opacity: 1, transform: 'none' },
  ];
}

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Блок ждёт на паузе в начальном кадре; после проигрыша анимация сама снимается (fill: backwards).
    const pending = new Map<Element, Animation>();
    const seen = new WeakSet<Element>();
    let frame = 0;

    function sweep() {
      frame = 0;
      // Блоки ушедшей страницы или заменённой разметки больше не ждут.
      for (const [element, animation] of pending) {
        if (element.isConnected) continue;
        animation.cancel();
        pending.delete(element);
      }
      const boxes = [...pending.keys()].map((element) => ({
        item: element,
        box: element.getBoundingClientRect(),
      }));
      for (const { item, delay } of dueReveals(boxes, window.innerHeight)) {
        const animation = pending.get(item);
        pending.delete(item);
        if (!animation) continue;
        // Вид мог смениться вместе с шириной окна, пока блок ждал.
        if (animation.effect instanceof KeyframeEffect)
          animation.effect.setKeyframes(keyframes(item));
        animation.effect?.updateTiming({ delay });
        animation.play();
      }
    }

    function schedule() {
      frame ||= requestAnimationFrame(sweep);
    }

    function collect(root: ParentNode) {
      const found = [...root.querySelectorAll(SELECTOR)];
      if (root instanceof Element && root.matches(SELECTOR)) found.unshift(root);
      const hidden = found.filter(
        (element) =>
          !seen.has(element) && isBelowFold(element.getBoundingClientRect(), window.innerHeight),
      );
      for (const element of found) seen.add(element);
      for (const element of hidden) {
        const animation = element.animate(keyframes(element), {
          duration: REVEAL_DURATION_MS,
          easing: REVEAL_EASING,
          fill: 'backwards',
        });
        animation.pause();
        pending.set(element, animation);
      }
    }

    // Перед печатью ждущие блоки встают на место.
    function revealAll() {
      for (const animation of pending.values()) animation.finish();
      pending.clear();
    }

    collect(document);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof Element) collect(node);
      }
      schedule();
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('beforeprint', revealAll);
    // Браузер мог восстановить прокрутку до запуска скрипта.
    schedule();

    return () => {
      mutations.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('beforeprint', revealAll);
      cancelAnimationFrame(frame);
      // Ничего не остаётся спрятанным.
      for (const animation of pending.values()) animation.cancel();
    };
  }, []);

  return null;
}

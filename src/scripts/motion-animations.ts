import { inView, animate, stagger, scroll } from 'motion';

/**
 * Animações declarativas via data-attributes, usando a biblioteca Motion (JS puro).
 *
 * Uso nos componentes Astro:
 *  - data-animate="fade-up|fade|scale"       -> anima o elemento quando entra na viewport
 *  - data-animate-delay="0.15"               -> atraso em segundos (opcional)
 *  - data-animate-stagger="0.06"             -> aplica stagger aos filhos com [data-animate-item]
 *  - data-parallax="0.15"                    -> parallax por rolagem (fator de deslocamento)
 *
 * Tudo é desativado quando o usuário prefere movimento reduzido.
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function applyReveal(el: HTMLElement): void {
  const type = el.dataset.animate || 'fade-up';
  const delay = parseFloat(el.dataset.animateDelay || '0');

  const fromMap: Record<string, { opacity: number; y?: number; scale?: number }> = {
    'fade-up': { opacity: 0, y: 24 },
    fade: { opacity: 0 },
    scale: { opacity: 0, scale: 0.94 },
  };
  const from = fromMap[type] || fromMap['fade-up'];

  el.style.opacity = String(from.opacity);
  if (from.y !== undefined) {
    el.style.transform = `translateY(${from.y}px)`;
  } else if (from.scale !== undefined) {
    el.style.transform = `scale(${from.scale})`;
  }
  el.style.willChange = 'opacity, transform';

  inView(
    el,
    () => {
      animate(el, { opacity: 1, y: 0, scale: 1 }, {
        delay,
        duration: 0.7,
        ease: EASE,
      });
    },
    { margin: '-15% 0px -15% 0px' },
  );
}

function applyStagger(container: HTMLElement): void {
  const step = parseFloat(container.dataset.animateStagger || '0.06');
  const items = Array.from(container.querySelectorAll<HTMLElement>('[data-animate-item]'));

  items.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(24px)';
    item.style.willChange = 'opacity, transform';
  });

  inView(
    container,
    () => {
      animate(
        items,
        { opacity: 1, y: 0 },
        { duration: 0.6, ease: EASE, delay: stagger(step, { startDelay: 0.05 }) },
      );
    },
    { margin: '-10% 0px -10% 0px' },
  );
}

function applyParallax(el: HTMLElement): void {
  const factor = parseFloat(el.dataset.parallax || '0.15');
  scroll(
    animate(el, { y: [0, factor * 120] }, { ease: 'linear', duration: 1 }),
    { target: el },
  );
}

function init(): void {
  if (prefersReducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-animate]').forEach(applyReveal);
  document.querySelectorAll<HTMLElement>('[data-animate-stagger]').forEach(applyStagger);
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach(applyParallax);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { autoVideo } from '@/lib/env';

export function initIntro() {
  const text = document.querySelector<HTMLElement>('[data-words]');
  if (!text) return;
  const split = SplitText.create(text, { type: 'words', wordsClass: 'word', aria: 'none' });
  const seq = [...text.querySelectorAll<HTMLElement>('.word, .pill')];
  const pills = seq.filter((el) => el.classList.contains('pill'));
  pills.forEach((p) => autoVideo(p.querySelector<HTMLVideoElement>('video')));

  gsap.set(split.words, { opacity: 0.13 });
  gsap.set(pills, { scale: 0, opacity: 0 });

  // words light up as you read; footage pills open where they sit in the sentence
  const tl = gsap.timeline({
    scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
  });
  seq.forEach((el, i) => {
    const at = i / seq.length;
    if (el.classList.contains('pill')) {
      tl.to(el, { scale: 1, opacity: 1, duration: 0.07, ease: 'back.out(2.2)' }, at);
    } else {
      tl.to(el, { opacity: 1, duration: 0.035, ease: 'none' }, at);
    }
  });

  // counters
  document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
    const to = Number(el.dataset.countTo);
    const pad = Number(el.dataset.pad || 0);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, {
        v: to, duration: 1.8, ease: 'expo.out',
        onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(pad, '0')),
      }),
    });
  });

  gsap.from('.fact', {
    y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.intro__facts', start: 'top 90%' },
  });
}

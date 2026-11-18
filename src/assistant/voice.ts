/*
  Voice for the Arifa assistant — the browser's own speech services, no downloads.

  Ears: SpeechRecognition in continuous mode. Browsers stop it after a pause or a
  minute of silence; it is restarted every time, so once switched on the mic stays
  open until the visitor turns it off. It is paused while Arifa speaks, so she never
  answers her own voice.

  Mouth: speechSynthesis with the most natural voice installed (Edge's "Natural"
  voices are close to human; Chrome's Google voices are next best).

  Both need a secure page (https or localhost) and Chrome or Edge for the ears.
  Browsers only allow speech after a click or tap on the page, and every new page
  needs its own: `speak()` resolves false when it was blocked.
*/

import { isArPage } from '@/i18n/client';

// the page's language: English voices on the English site, Arabic (UAE first) on /ar
const LANG = () => (isArPage() ? /^ar[-_]/i : /^en[-_]/i);

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

function rankVoice(v) {
  let s = 0;
  if (/natural|neural/i.test(v.name)) s += 40;
  if (/online/i.test(v.name)) s += 12;
  if (/google/i.test(v.name)) s += 10;
  if (/aria|jenny|sonia|libby|ava|emma|samantha/i.test(v.name)) s += 4;
  if (/en-GB|ar-AE/i.test(v.lang)) s += 2;
  if (/ar-SA/i.test(v.lang)) s += 1;
  if (!v.localService) s += 1;
  return s;
}

// how many microphones the computer is offering the browser right now (0 = none switched on,
// e.g. headphones without a mic or a Bluetooth headset that isn't connected; -1 = can't tell)
async function micCount() {
  try { return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput').length; } catch { return -1; }
}

// a live mic level (0–1) for the visuals; `onLost` fires if the mic disappears mid-use (unplugged)
async function startMeter(onLevel, onLost) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  stream.getAudioTracks().forEach((t) => t.addEventListener('ended', () => onLost?.(), { once: true }));
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 512;
  src.connect(an);
  const buf = new Float32Array(an.fftSize);
  let raf = 0;
  let smooth = 0;
  const tick = () => {
    an.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    smooth += (Math.min(1, rms * 9) - smooth) * 0.25;
    onLevel?.(smooth);
    raf = requestAnimationFrame(tick);
  };
  tick();
  return {
    resume: () => ctx.state === 'suspended' && ctx.resume(),
    stop: () => { cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); ctx.close(); onLevel?.(0); },
  };
}

export function createVoice({ onFinal, onInterim, onState, onWord, onLevel }) {
  const canListen = !!SR && window.isSecureContext;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  let rec = null;
  let on = false;
  let speaking = false;
  let voice = null;
  let meter = null;
  let current = null; // keep the utterance referenced: Chrome drops events of collected ones
  let restart = 0;
  const state = (s) => onState?.(s);

  if (canSpeak) {
    const pickVoice = () => {
      const en = speechSynthesis.getVoices().filter((v) => LANG().test(v.lang));
      voice = en.sort((a, b) => rankVoice(b) - rankVoice(a))[0] || null;
    };
    pickVoice();
    speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  function listen() {
    clearTimeout(restart);
    if (!on || speaking || !rec) return;
    try { rec.start(); } catch { /* already running */ }
    state('listening');
  }

  function build() {
    rec = new SR();
    rec.lang = isArPage() ? 'ar-AE' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const t = r[0].transcript.trim();
          if (t) onFinal?.(t);
        } else {
          interim += r[0].transcript;
        }
      }
      if (interim.trim()) onInterim?.(interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { on = false; state('denied'); }
      else if (e.error === 'audio-capture') lost(); // the mic went away: stop, instead of restarting forever
      else if (e.error === 'network') state('offline');
      // 'no-speech' and 'aborted' are routine: onend restarts
    };
    // always on: whenever the browser ends the session, open it again
    rec.onend = () => { if (on && !speaking) restart = window.setTimeout(listen, 220); };
  }

  // `prompt: false` only resumes a mic that is already allowed — it never asks. Browsers
  // auto-block sites that ask without a tap, so only a click on the mic may ask.
  async function start({ prompt = true } = {}) {
    if (!canListen) { state('unsupported'); return false; }
    // no microphone switched on at all: say so plainly, before any permission question
    if ((await micCount()) === 0) { on = false; state('nomic'); return false; }
    const perm = await permission();
    if (perm === 'denied') { on = false; state('denied'); return false; }
    if (perm !== 'granted' && !prompt) return false;
    on = true;
    if (!rec) build();
    if (!meter && navigator.mediaDevices?.getUserMedia) {
      try { meter = await startMeter(onLevel, lost); } catch (err) {
        on = false;
        const name = err?.name;
        // the browser said no, Windows said no, there is no mic, or the mic is there but won't open
        if (name === 'NotAllowedError' || name === 'SecurityError') state(/system/i.test(err.message) ? 'system' : 'denied');
        else if (name === 'NotFoundError' || name === 'OverconstrainedError') state('nomic');
        else state('busy'); // NotReadableError / AbortError: held by another app, or the driver failed
        return false;
      }
    }
    meter?.resume();
    listen();
    return on;
  }

  // 'granted' | 'denied' | 'prompt' | 'unknown'
  async function permission() {
    try { return (await navigator.permissions.query({ name: 'microphone' })).state; } catch { return 'unknown'; }
  }
  // call back when the visitor changes the mic setting (e.g. Allow from the address bar)
  async function watchPermission(cb) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      status.addEventListener('change', () => cb(status.state));
    } catch { /* no Permissions API: the mic button still works */ }
  }

  // call back with the new microphone count whenever one is plugged in, connected or removed
  function watchDevices(cb) {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    md.addEventListener('devicechange', async () => cb(await micCount()));
  }

  function stop() {
    on = false;
    clearTimeout(restart);
    try { rec?.abort(); } catch { /* idle */ }
    if (canSpeak) speechSynthesis.cancel();
    meter?.stop();
    meter = null;
    state('off');
  }

  // the mic was unplugged (or the headset disconnected) while listening
  function lost() {
    if (!on) return;
    stop();
    state('nomic');
  }

  // speak a line; resolves true when it was heard, false if the browser blocked it
  function speak(text) {
    if (!canSpeak || !text) return Promise.resolve(true);
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      current = u;
      if (voice) { u.voice = voice; u.lang = voice.lang; } else if (isArPage()) u.lang = 'ar-AE';
      u.rate = 1.02;
      u.pitch = 1;
      speaking = true;
      try { rec?.abort(); } catch { /* idle */ }
      state('speaking');
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        speaking = false;
        current = null;
        if (on) restart = window.setTimeout(listen, 260);
        else state('off');
        resolve(ok);
      };
      // Chrome sometimes never fires onend — don't hang on it
      const guard = setTimeout(() => done(true), 2500 + text.length * 85);
      u.onboundary = (e) => { if (e.name === 'word') onWord?.(); };
      u.onend = () => done(true);
      u.onerror = (e) => done(e.error !== 'not-allowed');
      speechSynthesis.speak(u);
    });
  }

  // the visitor talks over Arifa (or taps): stop talking and listen
  function hush() {
    if (canSpeak) speechSynthesis.cancel();
  }

  return {
    start, stop, speak, hush, permission, watchPermission, watchDevices, micCount,
    resumeAudio: () => meter?.resume(),
    get on() { return on; },
    get speaking() { return speaking; },
    canListen, canSpeak,
  };
}

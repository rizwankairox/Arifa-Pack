// Browser features the site uses that TypeScript's built-in types don't describe.

interface Window {
  // speech recognition (Chrome and Edge ship it with a webkit prefix)
  SpeechRecognition?: new () => any;
  webkitSpeechRecognition?: new () => any;
  webkitAudioContext?: typeof AudioContext;
  // development-only handles for poking at the page from the browser console
  __arifa?: unknown;
  __hero?: unknown;
  __about?: unknown;
  __press?: unknown;
  __range?: unknown;
  __reach?: unknown;
  __route?: unknown;
}

// lets style={{ '--i': 3 }} be written for CSS custom properties
type CSSVars = import('react').CSSProperties & Record<`--${string}`, string | number>;

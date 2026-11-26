// Can this browser draw the 3D well? Asked once. The test context is released straight away: browsers
// keep only about 16 WebGL contexts alive, and a leaked test one can push a real scene out.
//
// "No" also covers WebGL that is drawn by the processor instead of a graphics card (SwiftShader,
// llvmpipe, Microsoft Basic Render…). That is what a virtual machine, a remote desktop, a Docker
// browser or Chrome with hardware acceleration switched off gives you: the scenes run at a few frames
// a second there and freeze the scroll, so those visitors get the page's photographs instead.
// Add ?3d=on to a URL to force the 3D anyway (for testing), ?3d=off to force the photographs.
let answer: boolean | undefined;
let soft = false;
let hadGL = false;

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|lavapipe/i;

function override(): boolean | undefined {
  try {
    const q = new URLSearchParams(location.search).get('3d');
    if (q === 'on' || q === 'off') sessionStorage.setItem('arifa-3d', q);
    const v = q || sessionStorage.getItem('arifa-3d');
    if (v === 'on') return true;
    if (v === 'off') return false;
  } catch { /* storage blocked: no override */ }
  return undefined;
}

export function hasWebGL(): boolean {
  if (answer !== undefined) return answer;
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
      soft = SOFTWARE.test(name);
      if (soft) console.info(`3D off: this browser draws WebGL in software (${name}); showing the photographs. Add ?3d=on to force it.`);
    }
    hadGL = !!gl;
    answer = hadGL && !soft;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    answer = false;
  }
  const forced = override();
  if (forced === false) answer = false;
  if (forced === true) answer = hadGL;
  return answer;
}

/** true when WebGL exists but is drawn by the processor (set after hasWebGL() has run) */
export const softwareGL = () => soft;

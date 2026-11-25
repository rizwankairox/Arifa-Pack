// Can this browser draw WebGL? Asked once. The test context is released straight away: browsers
// keep only about 16 WebGL contexts alive, and a leaked test one can push a real scene out.
let answer: boolean | undefined;

export function hasWebGL(): boolean {
  if (answer !== undefined) return answer;
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    answer = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    answer = false;
  }
  return answer;
}

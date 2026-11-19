/*
  Which file a factory clip loads. Every clip in public/media/clips/ has two sizes:

    <name>.mp4       1280 px — for clips shown large (the factory floor cards, full-width scenes)
    <name>-640.mp4    640 px — about a third of the size, for clips shown small (the clips set
                               into the home page's opening sentence, family panels, phones)

  The page decides by how wide the clip actually shows on this screen, so one <video data-src>
  works everywhere. The 640 px copies are made with ffmpeg (see README → Video).
*/

/** device pixels across, up to which the 640 px copy is sharp enough */
const SMALL = 800;

/** the 640 px copy of a clip */
export const smallClip = (src: string) => src.replace(/(\/media\/clips\/[^/]+)\.mp4$/, '$1-640.mp4');

/** the clip a <video data-src="…"> should load, for the size it shows at */
export function clipFor(v: HTMLVideoElement): string {
  const src = v.dataset.src || '';
  // always small (e.g. the clips set into the home page's sentence, which open from zero width)
  if (v.dataset.clip === 'small') return smallClip(src);
  const shown = v.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2);
  return shown > 0 && shown <= SMALL ? smallClip(src) : src;
}

/*
  An image in the best format the browser takes: AVIF, then WebP. With `widths`, a phone also gets
  a smaller copy instead of the full-size file.

    <Picture src="/images/stories/bakery-counter.webp" widths={[768]} sizes="(max-width: 900px) 100vw, 50vw"
             width={1536} height={1024} alt="…" />

  `src` is the full-size WebP. The AVIF beside it (and the -768 copies) are made by
  `npm run images` (scripts/optimize-images.mjs). Every other prop goes to the <img>.
*/
import type { ImgHTMLAttributes } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height'> & {
  /** the full-size .webp */
  src: string;
  /** the image's own size, in pixels (reserves its space before it loads) */
  width: number;
  height: number;
  /** widths of the smaller copies that exist (e.g. [640] for <name>-640.webp / .avif) */
  widths?: number[];
};

export function Picture({ src, width, height, widths = [], sizes, alt = '', ...img }: Props) {
  // a photo from the CMS (a full https address on its media store): no AVIF or smaller copies exist
  // beside it, so it is shown as it is (a <source> pointing at a missing .avif would show nothing)
  if (/^(https?:)?\/\//.test(src) || !src.endsWith('.webp')) {
    return <img src={src} width={width} height={height} alt={alt} {...img} />;
  }
  const base = src.replace(/\.webp$/, '');
  const set = (ext: string) => [...widths.map((w) => `${base}-${w}.${ext} ${w}w`), `${base}.${ext} ${width}w`].join(', ');
  const responsive = widths.length > 0;
  return (
    <picture>
      <source type="image/avif" srcSet={responsive ? set('avif') : `${base}.avif`} sizes={responsive ? sizes : undefined} />
      <img
        src={src}
        srcSet={responsive ? set('webp') : undefined}
        sizes={responsive ? sizes : undefined}
        width={width}
        height={height}
        alt={alt}
        {...img}
      />
    </picture>
  );
}

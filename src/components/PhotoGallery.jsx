import { useEffect, useRef, useState } from 'react';
import ProductImage from './ProductImage';

/** Swipeable product photos with thumbnails (phones swipe, computers click arrows or thumbnails). */
export default function PhotoGallery({ photos, alt }) {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const list = photos.length ? photos : [''];

  // A different product (or extra photos arriving) starts at the first photo.
  useEffect(() => {
    setActive(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [list.length, list[0]]);

  function go(i) {
    const track = trackRef.current;
    if (!track) return;
    const next = (i + list.length) % list.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    setActive(next);
  }

  const onScroll = () => {
    const track = trackRef.current;
    if (track?.clientWidth) setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  const arrow =
    'absolute top-1/2 hidden size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-gray-200 bg-white/90 text-lg text-ink shadow hover:bg-white sm:grid';

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gray-50">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((src, i) => (
            <div key={i} className="w-full flex-none snap-center">
              <ProductImage
                src={src}
                alt={list.length > 1 ? `${alt} — photo ${i + 1} of ${list.length}` : alt}
                className="aspect-square max-h-[560px] w-full object-contain p-6 text-6xl"
              />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(active - 1)} className={`${arrow} left-3`}>
              ‹
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(active + 1)} className={`${arrow} right-3`}>
              ›
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white">
              {active + 1}/{list.length}
            </span>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              onClick={() => go(i)}
              className={`size-16 flex-none cursor-pointer overflow-hidden rounded-lg border-2 bg-gray-50 p-0 sm:size-20 ${
                i === active ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <ProductImage src={src} alt="" className="size-full object-contain p-1 text-xl" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

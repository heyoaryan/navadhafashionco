import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

interface GalleryItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

interface ImageLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ImageLightbox({
  items,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}: ImageLightboxProps) {
  useScrollLock(true);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - (touchStartY.current ?? 0);
    // only horizontal drag
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      setDragOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset < -SWIPE_THRESHOLD) onNext();
    else if (dragOffset > SWIPE_THRESHOLD) onPrevious();
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentItem = items[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 z-10 flex-shrink-0">
        <span className="text-white/70 text-sm">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main image area with swipe */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
          }}
        >
          {currentItem?.type === 'video' ? (
            <video
              src={currentItem.url}
              className="w-full h-full object-contain"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={currentItem?.url}
              alt={currentItem?.alt || `Image ${currentIndex + 1}`}
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
          )}
        </div>

        {/* Desktop prev/next arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={onNext}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators (mobile) / Thumbnail strip (desktop) */}
      {items.length > 1 && (
        <>
          {/* Mobile dots */}
          <div className="flex sm:hidden justify-center gap-2 py-4 flex-shrink-0">
            {items.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i === currentIndex ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Desktop thumbnails */}
          <div className="hidden sm:flex justify-center gap-2 py-4 px-4 flex-shrink-0 overflow-x-auto">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  const diff = index - currentIndex;
                  if (diff > 0) for (let i = 0; i < diff; i++) onNext();
                  else if (diff < 0) for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                }}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all relative ${
                  currentIndex === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} alt={item.alt || `Thumb ${index + 1}`} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

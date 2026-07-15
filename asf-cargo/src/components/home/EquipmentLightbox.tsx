import { useEffect, useRef, useState } from 'react';
import type { EquipmentItem } from '../../types';

type EquipmentLightboxProps = {
  item: EquipmentItem | null;
  onClose: () => void;
};

export default function EquipmentLightbox({ item, onClose }: EquipmentLightboxProps) {
  const [rendered, setRendered] = useState<EquipmentItem | null>(null);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (item) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setRendered(item);
      // Two rAFs: first lets the "closed" starting styles paint, second then
      // flips to "entered" so the transition actually has something to animate
      // from — a single rAF sometimes lands before the initial paint.
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    } else if (rendered) {
      setEntered(false);
      closeTimerRef.current = setTimeout(() => setRendered(null), 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(() => {
    if (!rendered) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div
      className={`equip-lightbox${entered ? ' show' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={rendered.title}
    >
      <div className="equip-lightbox-content">
        {rendered.image && (
          <img src={rendered.image} alt={rendered.title} className="equip-lightbox-img" />
        )}
        <div className="equip-lightbox-caption">
          <div className={`tag${rendered.soon ? ' soon-tag' : ''}`}>{rendered.tag}</div>
          <h3>{rendered.title}</h3>
          <p>{rendered.description}</p>
        </div>
      </div>
    </div>
  );
}

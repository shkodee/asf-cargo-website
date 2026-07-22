import { useEffect, useRef, useState } from 'react';
import type { TeamMember } from '../../types';

type TeamLightboxProps = {
  member: TeamMember | null;
  onClose: () => void;
};

export default function TeamLightbox({ member, onClose }: TeamLightboxProps) {
  const [rendered, setRendered] = useState<TeamMember | null>(null);
  const [entered, setEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (member) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setRendered(member);
      // Two rAFs: first lets the "closed" starting styles paint, second then
      // flips to "entered" so the transition actually has something to animate
      // from — a single rAF sometimes lands before the initial paint.
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    } else if (rendered) {
      setEntered(false);
      closeTimerRef.current = setTimeout(() => setRendered(null), 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

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
      className={`team-lightbox${entered ? ' show' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={rendered.name}
    >
      <div className="team-lightbox-content">
        <img src={rendered.image} alt={rendered.name} className="team-lightbox-img" />
        <div className="team-lightbox-caption">
          <h3>{rendered.name}</h3>
          <p>{rendered.role}</p>
          {rendered.experience && <p className="team-lightbox-exp">{rendered.experience}</p>}
          {rendered.bio && <p className="team-lightbox-bio">{rendered.bio}</p>}
        </div>
      </div>
    </div>
  );
}

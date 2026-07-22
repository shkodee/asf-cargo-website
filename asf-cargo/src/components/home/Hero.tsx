import { useRef, useEffect, useState } from 'react';
import { payTiers, company } from '../../data/content';
import { useLanes } from '../../hooks/useLanes';

// Crossfades two copies of the same clip so the loop point never shows as a jump-cut.
const LOOP_CROSSFADE_SECONDS = 0.5;
// The source clip opens on a white flash before the scene settles — start past it, every loop.
const CLIP_START_SECONDS = 0.3;

export default function Hero() {
  const solo = payTiers[0];
  const team = payTiers[1];
  const lanes = useLanes();
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeIsA, setActiveIsA] = useState(true);

  useEffect(() => {
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = () => {
      a.currentTime = CLIP_START_SECONDS;
      if (!reduced) a.play().catch(() => {});
    };
    if (a.readyState >= 1) start();
    else a.addEventListener('loadedmetadata', start, { once: true });

    if (reduced) return;
    let swapping = false;

    const handleTimeUpdate = (e: Event) => {
      const current = e.currentTarget as HTMLVideoElement;
      if (swapping || !current.duration) return;
      if (current.duration - current.currentTime > LOOP_CROSSFADE_SECONDS) return;

      swapping = true;
      const next = current === a ? b : a;
      next.currentTime = CLIP_START_SECONDS;
      next.play().catch(() => {});
      setActiveIsA(current === b);
      window.setTimeout(() => {
        current.pause();
        swapping = false;
      }, LOOP_CROSSFADE_SECONDS * 1000);
    };

    a.addEventListener('timeupdate', handleTimeUpdate);
    b.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      a.removeEventListener('timeupdate', handleTimeUpdate);
      b.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  return (
    <section className="hero">
      <div className="aurora-bg" aria-hidden="true" />
      <div className="wrap hero-grid">
        <div className="hero-anim">
          <div className="eyebrow" style={{ color: '#ff6b7a' }}>Now hiring · Solo & Team</div>
          <h1>Keep the freight<br /><em>moving</em> with ASF.</h1>
          <p className="lede">
            CDL-A driving jobs running power-only and dry van freight across the U.S. — steady
            East Coast to Midwest round trips, every day of the week. No experience required —
            we train you right.
          </p>
          <div className="hero-actions">
            <a href="/apply.html" className="btn btn-primary">Apply Now</a>
            <a href={company.officePhoneHref} className="btn btn-outline">Call {company.officePhone}</a>
          </div>
          <div className="hero-badge-row">
            <div className="hero-badge"><b>{solo.rate}$</b>per mile · solo</div>
            <div className="hero-badge"><b>{team.rate}$</b>per mile · team</div>
            <div className="hero-badge"><b>{lanes.length}</b>daily lanes</div>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-truck-stack">
            <video
              ref={videoARef}
              className={`hero-truck-video ${activeIsA ? 'is-active' : ''}`}
              src="/hero-truck.mp4"
              muted
              preload="auto"
              playsInline
              aria-hidden="true"
            />
            <video
              ref={videoBRef}
              className={`hero-truck-video ${activeIsA ? '' : 'is-active'}`}
              src="/hero-truck.mp4"
              muted
              preload="auto"
              playsInline
              aria-hidden="true"
            />
          </div>
          <div className="hero-truck-fade" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

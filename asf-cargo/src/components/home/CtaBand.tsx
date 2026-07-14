import Reveal from '../UI/Reveal';

export default function CtaBand() {
  return (
    <section className="cta-band">
      <Reveal className="wrap">
        <h2>Ready to get on the road?</h2>
        <p>Applications take about 5 minutes. We&apos;ll reach out fast.</p>
        <a href="/apply.html" className="btn" style={{ background: 'var(--navy)', color: 'var(--white)' }}>
          Apply Now →
        </a>
      </Reveal>
    </section>
  );
}

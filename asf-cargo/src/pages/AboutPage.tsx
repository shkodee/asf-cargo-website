import SiteLayout from '../layouts/SiteLayout';
import AboutSection from '../components/about/AboutSection';
import TeamSection from '../components/about/TeamSection';
import CtaBand from '../components/home/CtaBand';

export default function AboutPage() {
  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="wrap hero-anim">
          <div className="eyebrow" style={{ color: '#ff6b7a' }}>About us</div>
          <h1>Who we are.</h1>
          <p>A licensed carrier running daily freight lanes for CDL-A drivers, solo and team.</p>
        </div>
      </section>

      <AboutSection />
      <TeamSection />
      <CtaBand />
    </SiteLayout>
  );
}

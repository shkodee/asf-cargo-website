import SiteLayout from '../layouts/SiteLayout';
import ApplicationForm from '../components/apply/ApplicationForm';

export default function ApplyPage() {
  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="wrap hero-anim">
          <div className="eyebrow" style={{ color: '#ff6b7a' }}>Driver application</div>
          <h1>Let&apos;s get you rolling.</h1>
          <p>Fill this out in about 5 minutes. Our team will call or text you back fast.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <ApplicationForm />
        </div>
      </section>
    </SiteLayout>
  );
}

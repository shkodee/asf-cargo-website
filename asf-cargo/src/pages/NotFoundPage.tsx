import SiteLayout from '../layouts/SiteLayout';
import Button from '../components/UI/Button';
import { company } from '../data/content';

export default function NotFoundPage() {
  return (
    <SiteLayout>
      <section className="section" style={{ textAlign: 'center', padding: '120px 20px' }}>
        <p className="eyebrow">404</p>
        <h1>Page not found.</h1>
        <p style={{ maxWidth: 480, margin: '16px auto 32px', color: 'var(--steel)' }}>
          That page doesn&apos;t exist or may have moved. Head back to the homepage, or apply to
          drive if that&apos;s what brought you here.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button href="/" variant="primary">Back to Homepage</Button>
          <Button href="/apply" variant="outline-dark">Apply Now</Button>
        </div>
        <p className="mono" style={{ marginTop: 40, color: 'var(--steel)' }}>
          Need help? Call us at {company.officePhone}.
        </p>
      </section>
    </SiteLayout>
  );
}

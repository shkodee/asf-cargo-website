import SiteLayout from '../layouts/SiteLayout';
import { company } from '../data/content';

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="aurora-bg" aria-hidden="true" />
        <div className="wrap hero-anim">
          <div className="eyebrow" style={{ color: '#ff6b7a' }}>Legal</div>
          <h1>Privacy Policy.</h1>
          <p>How we collect, use, and protect the information you share with us.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="legal-content">
            <p className="legal-updated">Last updated: July 22, 2026</p>

            <p>
              {company.name} ({company.mcNum} / {company.dotNum}) operates asfcargollc.com. This
              page explains what information we collect when you apply to drive for us, how we
              use it, and how it's protected. It covers this website only — it isn't a substitute
              for legal advice about your own rights.
            </p>

            <h3>Information we collect</h3>
            <p>When you submit our driver application form, we collect:</p>
            <ul>
              <li>Your name, phone number, and email address</li>
              <li>The position you're applying for and your driving experience</li>
              <li>Your CDL number and issuing state</li>
              <li>Your city, and the same details for a co-driver if you're applying as a team</li>
              <li>Any message you choose to add</li>
              <li>Optionally, a photo or file of your CDL — this field is not required to apply</li>
            </ul>
            <p>
              We don't currently run analytics or advertising cookies on this site, so we don't
              collect browsing behavior beyond standard web server logs.
            </p>

            <h3>How we use it</h3>
            <p>
              We use what you submit solely to evaluate your application, verify you meet our
              driving requirements, and contact you about the position. We don't sell your
              information or use it for advertising, and we don't share it with anyone outside
              {' '}{company.name}'s hiring team.
            </p>

            <h3>How it's handled and stored</h3>
            <p>
              Application text (your name, contact details, experience, etc.) is sent directly to
              our dispatch and hiring team via a private Telegram channel at the moment you
              submit — it is not saved into a database on our end.
            </p>
            <p>
              If you choose to upload a CDL photo or document, it's stored in a private cloud
              storage bucket that has no public URL and isn't accessible to anyone outside our
              registered hiring team. It's kept only as long as needed for the hiring process; you
              can request its removal at any time using the contact details below.
            </p>

            <h3>Third parties we use</h3>
            <p>
              We rely on a small set of infrastructure providers to run this site and process
              applications: Cloudflare (hosting and storage) and the Telegram Bot API (delivering
              your application to our team). None of these providers use your information for
              their own purposes — they process it only to deliver our service.
            </p>

            <h3>Security</h3>
            <p>
              This site is served over HTTPS end to end, including the connection between the
              application form and our servers. Uploaded CDL documents live in access-controlled
              storage, gated to our registered hiring team only.
            </p>

            <h3>Your choices</h3>
            <p>
              You can ask us to review, correct, or delete the information you've submitted at any
              time — reach out using the contact details below and we'll take care of it.
            </p>

            <h3>Changes to this policy</h3>
            <p>
              If how we handle your information changes — for example, if we add site analytics
              or a new hiring tool — we'll update this page and the "Last updated" date above.
            </p>

            <h3>Contact us</h3>
            <p>
              Questions about this policy or your information? Reach us at{' '}
              <a href={company.officePhoneHref}>{company.officePhone}</a> or by mail at{' '}
              {company.address1}, {company.address2}.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

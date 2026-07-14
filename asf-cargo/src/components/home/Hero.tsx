import { payTiers, company } from '../../data/content';

export default function Hero() {
  const solo = payTiers[0];
  const team = payTiers[1];

  return (
    <section className="hero">
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
            <div className="hero-badge"><b>8</b>daily lanes</div>
          </div>
        </div>
        <div className="hero-art">
          <img src="/logo.png" alt="ASF Cargo truck badge" />
        </div>
      </div>
    </section>
  );
}

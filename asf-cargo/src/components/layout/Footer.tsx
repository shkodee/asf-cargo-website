import { company } from '../../data/content';

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="foot-brand">
              <img src="/logo.png" alt="ASF Cargo logo" />
              <div className="brand-text" style={{ color: 'var(--white)' }}>ASF CARGO</div>
            </div>
            <p style={{ maxWidth: '34ch' }}>
              CDL-A driving jobs running power-only and dry van freight, East Coast to Midwest.
            </p>
          </div>
          <div>
            <h4>Navigate</h4>
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/#lanes">Lanes</a>
            <a href="/apply.html">Apply Now</a>
            <a href="/#contact">Contact</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href={company.officePhoneHref}>{company.officePhone}</a>
            <a href={company.dispatchPhoneHref}>{company.dispatchPhone}</a>
            <span style={{ display: 'block', fontSize: '0.9rem' }}>
              {company.address1}<br />{company.address2}
            </span>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {company.name} — Est. {company.foundedYear} — {company.mc} · {company.dot}</span>
          <span>All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

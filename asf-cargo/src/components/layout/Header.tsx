import { useEffect, useState } from 'react';
import { company } from '../../data/content';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = (
    <>
      <a href="/">Home</a>
      <a href="/#lanes">Lanes</a>
      <a href="/#equipment">Equipment</a>
      <a href="/#requirements">Requirements</a>
      <a href="/#contact">Contact</a>
    </>
  );

  return (
    <header className={`site${scrolled ? ' scrolled' : ''}`}>
      <div className="nav">
        <a href="/" className="brand">
          <img src="/logo.png" alt="ASF Cargo LLC logo" />
          <div className="brand-text">
            ASF CARGO
            <span>{company.mc} · {company.dot}</span>
          </div>
        </a>
        <nav className={`nav-links${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          {navLinks}
        </nav>
        <div className="nav-cta">
          <a href={company.officePhoneHref} className="nav-phone">{company.officePhone}</a>
          <a href="/apply.html" className="btn btn-primary">Apply Now</a>
          <button className="burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}

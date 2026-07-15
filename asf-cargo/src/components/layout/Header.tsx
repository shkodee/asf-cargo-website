import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { company } from '../../data/content';

type SectionLink = { name: string; href: string; id: string | null };

const sectionLinks: SectionLink[] = [
  { name: 'Home', href: '/', id: null },
  { name: 'Lanes', href: '/#lanes', id: 'lanes' },
  { name: 'Equipment', href: '/#equipment', id: 'equipment' },
  { name: 'Requirements', href: '/#requirements', id: 'requirements' },
  { name: 'Contact', href: '/#contact', id: 'contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);

      const headerHeight = document.querySelector('header.site')?.getBoundingClientRect().height ?? 90;
      const scrollPos = window.scrollY + headerHeight + 24;
      let current: string | null = null;
      for (const link of sectionLinks) {
        if (!link.id) continue;
        const el = document.getElementById(link.id);
        if (el && el.offsetTop <= scrollPos) {
          current = link.id;
        }
      }

      // The last section can be short enough that its top never reaches the
      // threshold above (nothing left to scroll past once the footer
      // follows immediately) — force it active once we've hit the true
      // bottom of the page instead of leaving the previous section stuck.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        const lastSectionLink = [...sectionLinks].reverse().find((link) => link.id);
        if (lastSectionLink) current = lastSectionLink.id;
      }

      setActiveId(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          <a href="/apply.html" className="btn btn-primary nav-links-apply">Apply Now</a>
          {sectionLinks.map((link) => {
            const isActive = link.id === activeId;
            return (
              <a
                key={link.name}
                href={link.href}
                className={`nav-pill-link${isActive ? ' active' : ''}`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-lamp"
                    className="nav-lamp"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
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

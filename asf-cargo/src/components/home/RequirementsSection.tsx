import { requirements, company } from '../../data/content';
import Reveal from '../UI/Reveal';
import RequirementItem from './RequirementItem';

export default function RequirementsSection() {
  return (
    <section className="section section-dark" id="requirements">
      <div className="wrap two-col">
        <Reveal>
          <div className="eyebrow" style={{ color: '#ff6b7a' }}>Requirements</div>
          <h2>What it takes to drive for ASF.</h2>
          <p>We keep the bar simple — hold the license, show up ready to work.</p>
          <ul className="check-list">
            {requirements.map((item) => (
              <RequirementItem key={item.num} item={item} />
            ))}
          </ul>
        </Reveal>
        <Reveal style={{ alignSelf: 'center' }}>
          <div className="board" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="board-head" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <span>Company file</span>
            </div>
            <div style={{ padding: '22px' }} className="mono">
              <p style={{ color: 'var(--chrome)', marginBottom: '14px' }}>
                <strong style={{ color: 'var(--white)' }}>{company.name}</strong><br />
                {company.address1}<br />{company.address2}
              </p>
              <p style={{ color: 'var(--chrome)', marginBottom: '14px' }}>
                {company.mcNum}<br />{company.dotNum}
              </p>
              <p style={{ color: 'var(--chrome)', marginBottom: 0 }}>
                Office: {company.officePhone}<br />Dispatch: {company.dispatchPhone}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

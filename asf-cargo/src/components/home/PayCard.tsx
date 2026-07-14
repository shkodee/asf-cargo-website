import type { PayTier } from '../../types';
import Reveal from '../UI/Reveal';

export default function PayCard({ tier }: { tier: PayTier }) {
  return (
    <Reveal className="pay-card">
      <div className="role">{tier.role}</div>
      <div className="rate" style={tier.rateFontSize ? { fontSize: tier.rateFontSize } : undefined}>
        {tier.rate}
        {tier.rateSuffix && <span>{tier.rateSuffix}</span>}
      </div>
      <p style={{ marginTop: '10px' }}>{tier.description}</p>
      <ul>
        {tier.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </Reveal>
  );
}

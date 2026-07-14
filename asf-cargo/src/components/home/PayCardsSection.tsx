import { payTiers } from '../../data/content';
import SectionHeading from '../UI/SectionHeading';
import PayCard from './PayCard';

export default function PayCardsSection() {
  return (
    <section className="section">
      <div className="wrap">
        <SectionHeading
          eyebrow="Pay & positions"
          description="Whether you run solo or split the wheel with a partner, ASF keeps you loaded and moving on consistent East-to-Midwest freight."
        >
          Drive your way, get paid for it.
        </SectionHeading>
        <div className="pay-grid">
          {payTiers.map((tier) => (
            <PayCard key={tier.role} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}

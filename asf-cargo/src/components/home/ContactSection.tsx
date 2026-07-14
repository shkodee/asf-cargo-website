import { contactItems } from '../../data/content';
import SectionHeading from '../UI/SectionHeading';
import ContactCard from './ContactCard';

export default function ContactSection() {
  return (
    <section className="section" id="contact">
      <div className="wrap">
        <SectionHeading
          eyebrow="Get in touch"
          eyebrowColor="#ff6b7a"
          description="Questions about driving with us, or a shipper looking to book freight — reach out."
        >
          Talk to ASF Cargo.
        </SectionHeading>
        <div className="contact-grid">
          {contactItems.map((item) => (
            <ContactCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

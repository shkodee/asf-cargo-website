import { Fragment } from 'react';
import type { ContactItem } from '../../types';
import Reveal from '../UI/Reveal';

export default function ContactCard({ item }: { item: ContactItem }) {
  const lines = item.value.split('<br>');
  return (
    <Reveal className="contact-card">
      <div className="eyebrow">{item.label}</div>
      {item.type === 'tel' ? (
        <a href={item.href}>{item.value}</a>
      ) : (
        <div className="val">
          {lines.map((line, i) => (
            <Fragment key={line}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </div>
      )}
    </Reveal>
  );
}

import type { ReactNode } from 'react';
import Reveal from './Reveal';

interface SectionHeadingProps {
  eyebrow: string;
  eyebrowColor?: string;
  children: ReactNode; // heading text
  description: string;
}

export default function SectionHeading({ eyebrow, eyebrowColor, children, description }: SectionHeadingProps) {
  return (
    <Reveal className="section-head">
      <div className="eyebrow" style={eyebrowColor ? { color: eyebrowColor } : undefined}>
        {eyebrow}
      </div>
      <h2>{children}</h2>
      <p>{description}</p>
    </Reveal>
  );
}

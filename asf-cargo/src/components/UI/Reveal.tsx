import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface RevealProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

export default function Reveal({ as, children, className = '', style, ...rest }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useScrollReveal<HTMLElement>();
  return (
    <Tag ref={ref as never} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}

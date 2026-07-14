import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'outline-dark';

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  block?: boolean;
  style?: CSSProperties;
}

export default function Button({ children, variant, block, className = '', style, ...rest }: ButtonProps) {
  const classes = ['btn'];
  if (variant === 'primary') classes.push('btn-primary');
  if (variant === 'outline') classes.push('btn-outline');
  if (variant === 'outline-dark') classes.push('btn-outline-dark');
  if (block) classes.push('btn-block');
  if (className) classes.push(className);

  return (
    <a className={classes.join(' ')} style={style} {...rest}>
      {children}
    </a>
  );
}

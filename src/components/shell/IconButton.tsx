import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  children: ReactNode;
}

/** 44×44 hit area; the visible face shrinks to 40×40 under 360px. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, type = 'button', className = '', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} aria-label={label} className={`ge-icon-btn ${className}`} {...props}>
      <span className="ge-icon-btn__face" aria-hidden="true">{children}</span>
    </button>
  );
});

export function IconLink({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <Link to={to} aria-label={label} className="ge-icon-btn">
      <span className="ge-icon-btn__face" aria-hidden="true">{children}</span>
    </Link>
  );
}

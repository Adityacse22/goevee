import type { SVGProps } from 'react';

/**
 * CCS2 connector: a Type 2 head with seven pin dots above two larger DC pins.
 * 24×24, 1.75 stroke, round caps — matches lucide-react icons.
 */
export function Ccs2Icon({ strokeWidth = 1.75, ...props }: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M6.2 3.2h11.6a6.6 6.6 0 0 1 1.1 3.7 6.9 6.9 0 0 1-13.8 0 6.6 6.6 0 0 1 1.1-3.7Z" />
      <path d="M7 15.6h10a3 3 0 0 1 0 6H7a3 3 0 0 1 0-6Z" />
      <g fill="currentColor" stroke="none">
        <circle cx="10" cy="5.3" r="0.95" />
        <circle cx="14" cy="5.3" r="0.95" />
        <circle cx="8.3" cy="8.2" r="0.95" />
        <circle cx="12" cy="8.2" r="0.95" />
        <circle cx="15.7" cy="8.2" r="0.95" />
        <circle cx="10" cy="11" r="0.95" />
        <circle cx="14" cy="11" r="0.95" />
      </g>
      <circle cx="9" cy="18.6" r="1.35" />
      <circle cx="15" cy="18.6" r="1.35" />
    </svg>
  );
}

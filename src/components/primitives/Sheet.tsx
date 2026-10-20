/**
 * Sheet — bottom or right drawer on vaul (Radix Dialog underneath): focus trap,
 * Esc and scrim close, drag-to-dismiss on the handle. A close button gives a
 * single-pointer alternative to dragging.
 *
 * Focus: vaul disables Radix's open auto-focus by default, and Radix only returns
 * focus to a <Dialog.Trigger>. Our sheets open from plain buttons, so focus is moved
 * in and handed back explicitly: in on open (to the checked option when asked),
 * back to whatever opened the sheet on close.
 */
import { useRef, type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { t } from '@/lib/messages';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'bottom' | 'right';
  title: string;
  description?: string;
  /** 'checked' focuses the selected radio option; 'first' the first control (the close button). */
  initialFocus?: 'first' | 'checked';
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, side = 'bottom', title, description, initialFocus = 'first', children }: SheetProps) {
  const returnTo = useRef<HTMLElement | null>(null);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={side} shouldScaleBackground={false} autoFocus>
      <Drawer.Portal>
        <Drawer.Overlay className="ge-sheet-overlay" />
        <Drawer.Content
          className="ge-sheet"
          data-side={side}
          {...(description ? {} : { 'aria-describedby': undefined })}
          onOpenAutoFocus={event => {
            // Runs before focus moves, so this is still the control that opened the sheet.
            returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (initialFocus !== 'checked') return;
            const checked = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[role="radio"][data-state="checked"]');
            if (checked) {
              event.preventDefault();
              checked.focus({ preventScroll: true });
            }
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            const target = returnTo.current;
            if (target?.isConnected) target.focus({ preventScroll: true });
          }}
        >
          {side === 'bottom' && <div className="ge-sheet__handle" aria-hidden="true" />}
          <div className="ge-sheet__head">
            <Drawer.Title className="ge-sheet__title">{title}</Drawer.Title>
            <Drawer.Close className="ge-sheet__close ge-press" aria-label={t.shell.close}>
              <X aria-hidden="true" strokeWidth={1.75} />
            </Drawer.Close>
          </div>
          {description && <Drawer.Description className="ge-sheet__desc">{description}</Drawer.Description>}
          <div className="ge-sheet__body">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

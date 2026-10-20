import { Link } from 'react-router-dom';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { CircleHelp, Cookie, FileText, Handshake, Info, Languages, Shield, TriangleAlert } from 'lucide-react';
import { Sheet } from '@/components/primitives/Sheet';
import { SUPPORT_EMAIL } from '@/config/site';
import { openCookieSettings } from '@/services/consent';
import { t } from '@/lib/messages';

interface MenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mail = (subject: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export default function MenuSheet({ open, onOpenChange }: MenuSheetProps) {
  const close = () => onOpenChange(false);
  const links = [
    { to: '/help', label: t.menu.help, icon: CircleHelp },
    { href: mail('Charger issue report'), label: t.menu.reportIssue, icon: TriangleAlert },
    { href: mail('Partner with GoEvee'), label: t.menu.partner, icon: Handshake },
    { to: '/about', label: t.menu.about, icon: Info },
    { to: '/terms', label: t.menu.terms, icon: FileText },
    { to: '/privacy', label: t.menu.privacy, icon: Shield },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title={t.shell.menuTitle}>
      <div className="ge-menu-label" id="menu-language-label">
        <span className="inline-flex items-center gap-2"><Languages aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />{t.menu.language}</span>
      </div>
      <RadioGroup.Root className="flex flex-col gap-1 px-1" defaultValue="en-IN" aria-labelledby="menu-language-label">
        <RadioGroup.Item value="en-IN" className="ge-radio">
          <span className="ge-radio__label" lang="en-IN">{t.menu.english}</span>
          <span className="ge-radio__dot" aria-hidden="true" />
        </RadioGroup.Item>
        <RadioGroup.Item value="hi-IN" className="ge-radio" disabled aria-describedby="menu-hindi-soon">
          <span className="flex flex-col">
            <span className="ge-radio__label" lang="hi-IN">{t.menu.hindi}</span>
            <span className="ge-radio__detail" id="menu-hindi-soon">{t.menu.hindiSoon}</span>
          </span>
          <span className="ge-radio__dot" aria-hidden="true" />
        </RadioGroup.Item>
      </RadioGroup.Root>
      <div className="ge-menu-divider" role="presentation" />
      <nav aria-label={t.shell.menu}>
        <ul className="ge-menu-list">
          {links.map(({ to, href, label, icon: Icon }) => (
            <li key={label}>
              {to ? (
                <Link className="ge-menu-item" to={to} onClick={close}>
                  <Icon aria-hidden="true" strokeWidth={1.75} />{label}
                </Link>
              ) : (
                <a className="ge-menu-item" href={href} onClick={close}>
                  <Icon aria-hidden="true" strokeWidth={1.75} />{label}
                </a>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              className="ge-menu-item"
              onClick={() => {
                close();
                // Let the sheet hand focus back before the consent dialog takes it.
                window.setTimeout(openCookieSettings, 360);
              }}
            >
              <Cookie aria-hidden="true" strokeWidth={1.75} />{t.menu.cookieSettings}
            </button>
          </li>
        </ul>
      </nav>
    </Sheet>
  );
}

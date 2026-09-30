export const SITE_URL = 'https://www.goevee.in';
export const SUPPORT_EMAIL = 'contact.goevee@gmail.com';
export const POLICY_DATE = '1 October 2026';

export const pageMetadata: Record<string, { title: string; description: string; index?: boolean }> = {
  '/': { title: 'Evee | Find EV charging stations in India', description: 'Find nearby EV charging stations with Evee. Explore locations, compare connector options and plan your next electric journey.', index: true },
  '/ev-charger-station': { title: 'Find EV charging stations near you | Evee', description: 'Search for EV chargers by city or location. Explore charging stations on the map and check details before your next trip.', index: true },
  '/stations': { title: 'Browse EV charging stations | Evee', description: 'Explore nearby electric vehicle charging stations, connector options and station details with Evee.', index: true },
  '/about': { title: 'About Evee | EV charging made easier', description: 'Learn how Evee helps electric vehicle drivers discover charging stations and plan charging stops across India.', index: true },
  '/help': { title: 'Help & contact | Evee', description: 'Get help with Evee station search, accounts and bookings. Contact the Evee team for support or privacy requests.', index: true },
  '/privacy': { title: 'Privacy policy | Evee', description: 'How Evee handles account information, location searches, bookings and optional analytics, and how to contact us about your data.', index: true },
  '/terms': { title: 'Terms & conditions | Evee', description: 'Read the terms for using Evee, including accounts, charging station information, booking responsibilities and acceptable use.', index: true },
  '/cookies': { title: 'Cookies & storage | Evee', description: 'Understand essential browser storage and optional analytics on Evee, and manage your cookie preferences.', index: true },
  '/login': { title: 'Sign in | Evee', description: 'Sign in to your Evee account to manage your charging journey.' },
  '/signup': { title: 'Create an account | Evee', description: 'Create your Evee account to save stations and manage charging bookings.' },
  '/booking': { title: 'Book a charging slot | Evee', description: 'Choose your charging station and review your booking details.' },
  '/bookings': { title: 'My bookings | Evee', description: 'Manage your Evee charging bookings.' },
  '/bookings/history': { title: 'Booking history | Evee', description: 'Your past charging bookings.' },
  '/favorites': { title: 'Saved stations | Evee', description: 'Your saved EV charging stations.' },
  '/profile': { title: 'My profile | Evee', description: 'Manage your Evee profile and vehicle details.' },
  '/vehicle': { title: 'My vehicle | Evee', description: 'Your electric vehicle details.' },
  '/settings': { title: 'Settings | Evee', description: 'Manage your Evee preferences.' },
  '/operator': { title: 'Operator dashboard | Evee', description: 'Manage your charging stations.' },
  '/admin': { title: 'Admin dashboard | Evee', description: 'Evee administration.' },
};

export function getPageMetadata(pathname: string) {
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  if (path === '/search') return { ...pageMetadata['/stations'], index: false, path: '/stations' };
  if (/^\/stations\/[^/]+$/.test(path)) return { title: 'Charging station details | Evee', description: 'Review this EV charging station and its connector options.', index: false, path };
  return { ...(pageMetadata[path] ?? { title: 'Page not found | Evee', description: 'Find your way back to Evee and discover nearby EV charging stations.' }), path };
}

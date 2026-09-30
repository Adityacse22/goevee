import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicPage({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return <div className="min-h-screen bg-black text-white">
    <Navbar hasScrolled />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8">
      {eyebrow && <p className="mb-4 text-sm font-medium text-ev-green">{eyebrow}</p>}
      <h1 className="mb-8 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-cyan-300 prose-a:underline prose-strong:text-white">{children}</div>
    </main>
    <Footer />
  </div>;
}

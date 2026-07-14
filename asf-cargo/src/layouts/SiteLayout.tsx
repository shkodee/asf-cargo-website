import type { ReactNode } from 'react';
import ScrollProgressBar from '../components/layout/ScrollProgressBar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollProgressBar />
      <Header />
      {children}
      <Footer />
    </>
  );
}

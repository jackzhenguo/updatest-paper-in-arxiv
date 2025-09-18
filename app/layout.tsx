import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/layout/ClientProviders';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Paper Assistant',
  description: 'Search arXiv and curate a personal reading list locally.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <Header />
          <main className="pt-24 pb-12 px-4">{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}

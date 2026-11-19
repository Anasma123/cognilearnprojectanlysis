import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context/AppContext';

export const metadata: Metadata = {
  title: 'Cognilearn - Student Project Tracking & Management System',
  description: 'Academic project monitoring and management platform for MES College by Cognilearn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

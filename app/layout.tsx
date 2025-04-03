import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { Header } from './components/Header';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Network Brain',
  description: 'Admin tool for managing network profiles and introductions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-[rgb(243,244,246)]">
          <Sidebar />
          <div className="flex-1 overflow-auto flex flex-col">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
} 
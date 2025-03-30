import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { Header } from './components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Network Brain v4',
  description: 'Admin tool for managing network profiles and introductions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
} 
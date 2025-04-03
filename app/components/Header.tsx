'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const pathname = usePathname() || '/';
  
  // Get the page title based on the current route
  const getPageTitle = () => {
    if (pathname === '/') return 'Directory';
    if (pathname === '/context' || pathname.startsWith('/context/')) return 'Context';
    if (pathname === '/dashboard/calendar' || pathname.startsWith('/dashboard/calendar/')) return 'Events';
    if (pathname === '/intros' || pathname.startsWith('/intros/')) return 'Introductions';
    if (pathname === '/import' || pathname.startsWith('/import/')) return 'Import Data';
    if (pathname === '/auth/google' || pathname.startsWith('/auth/google/')) return 'Connect Google';
    if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'Settings';
    return 'Network Brain';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <h1 className="text-xl font-semibold text-[rgb(66,66,69)]">{getPageTitle()}</h1>
      </div>
    </header>
  );
}; 
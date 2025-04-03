'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  UserPlusIcon, 
  CalendarIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  ArrowUpOnSquareIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

const menuItems = [
  { name: 'Directory', href: '/', icon: HomeIcon },
  { name: 'Add Context', href: '/context', icon: UserPlusIcon },
  { name: 'Events', href: '/dashboard/calendar', icon: CalendarIcon },
  { name: 'Intros', href: '/intros', icon: UsersIcon },
  { name: 'Import Data', href: '/import', icon: ArrowUpOnSquareIcon },
  { name: 'Connect Google', href: '/auth/google', icon: CloudIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname() || '/';

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-[rgb(66,66,69)]">Network Brain</h1>
      </div>
      <nav className="flex-1 px-4 pt-4 pb-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md group ${
                isActive
                  ? 'bg-[rgb(255,196,3)] text-black'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon
                className={`flex-shrink-0 w-5 h-5 mr-3 ${
                  isActive ? 'text-black' : 'text-gray-500 group-hover:text-gray-600'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 
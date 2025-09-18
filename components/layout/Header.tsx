'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Header = () => {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  const baseButtonClass =
    'px-4 py-2 rounded-full transition font-medium text-white';

  const indexClass =
    baseButtonClass +
    (pathname === '/' ? ' bg-gray-700' : ' bg-gray-600 hover:bg-gray-700');

  const profileClass =
    baseButtonClass +
    (pathname?.startsWith('/my-papers')
      ? ' bg-blue-700'
      : ' bg-blue-600 hover:bg-blue-700');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white/70 backdrop-blur">
      <div className="flex items-center space-x-4">
        <BookOpen className="h-12 w-12 text-blue-500" />
        <h1 className="text-lg font-bold">Paper Assistant</h1>
      </div>
      <nav className="flex space-x-4">
        <Link href="/" className={indexClass}>
          Index
        </Link>
        <Link href="/my-papers" className={profileClass}>
          {isLoggedIn ? 'Me' : 'Login'}
        </Link>
      </nav>
    </header>
  );
};

export default Header;

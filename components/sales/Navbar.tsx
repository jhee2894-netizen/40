'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, LayoutDashboard, PenLine } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#eaddd7] bg-[#fdf8f6]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/sales" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7f5539] text-white shadow-sm">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-[#4a3528]">
              오늘의원두
            </div>
            <div className="text-xs text-[#8c7060]">지점 매출 및 공휴일 관리판</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/sales"
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname === '/sales'
                ? 'bg-[#7f5539] text-white shadow-sm'
                : 'text-[#6f5647] hover:bg-[#f2e8e5] hover:text-[#4a3528]'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>대시보드</span>
          </Link>

          <Link
            href="/sales/entry"
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname === '/sales/entry'
                ? 'bg-[#7f5539] text-white shadow-sm'
                : 'text-[#6f5647] hover:bg-[#f2e8e5] hover:text-[#4a3528]'
            }`}
          >
            <PenLine className="h-4 w-4" />
            <span>실적 등록</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

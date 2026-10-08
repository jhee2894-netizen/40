'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Home,
  ShieldCheck,
  TrendingUp,
  MessageSquareText,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: '홈', href: '/', icon: Home },
  { name: '경비 정산', href: '/expense', icon: ShieldCheck },
  { name: '지점 매출', href: '/sales', icon: TrendingUp },
  { name: '리뷰 분석', href: '/reviews', icon: MessageSquareText },
];

export default function GlobalNavbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 서비스 로고 및 타이틀 */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">
              내 업무 도구함
            </div>
            <div className="text-xs text-slate-500">통합 업무 웹 서비스</div>
          </div>
        </Link>

        {/* 상단 글로벌 메뉴 (GNB) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

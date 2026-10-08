import type { Metadata } from 'next';
import './globals.css';
import GlobalNavbar from '@/components/common/Navbar';

export const metadata: Metadata = {
  title: '내 업무 도구함',
  description: '경비 정산 검사기 · 지점 매출 관리판 · 리뷰 분석기 통합 업무 웹 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        <GlobalNavbar />
        {children}
      </body>
    </html>
  );
}

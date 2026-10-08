import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  TrendingUp,
  MessageSquareText,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';

export default function HubPage() {
  const tools = [
    {
      title: '경비 정산 검사기',
      path: '/expense',
      badge: '회계 / 규정 검증',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: ShieldCheck,
      iconBg: 'bg-blue-600',
      description:
        '매월 말 제출된 경비 CSV를 업로드하여 사내 규정(제5조~제9조) 위반 여부와 중복 제출을 즉시 대조·검증하고, 반려 사유를 원클릭으로 복사합니다.',
      features: [
        'CSV 드래그 & 드롭 즉시 파싱',
        '사내 규정 제5조~제9조 실시간 자동 검증',
        '중복 청구 및 한도 초과 정밀 감지',
        '제출자별 반려 안내문 일괄 생성 및 복사',
      ],
      buttonText: '경비 정산 바로가기',
      accentColor: 'hover:border-blue-500',
    },
    {
      title: '지점 매출 관리판',
      path: '/sales',
      badge: '영업 / 대시보드',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: TrendingUp,
      iconBg: 'bg-[#7f5539]',
      description:
        '오늘의원두 5개 직영점(용산역·삼각지·이태원·효창공원·한남점)의 일별·월별 매출 실적과 법정 공휴일 공공데이터를 연계 분석하고 신규 실적을 등록합니다.',
      features: [
        '5개 직영점 월별 매출 실적 및 KPI 요약',
        '공공데이터포털 법정 공휴일 연동 비교',
        'Recharts 기반 매출 및 객수 추이 차트',
        '지점별 간편 실적 등록 및 덮어쓰기 방지',
      ],
      buttonText: '지점 매출 바로가기',
      accentColor: 'hover:border-amber-500',
    },
    {
      title: '리뷰 분석기',
      path: '/reviews',
      badge: 'AI 분석 / CS 관리',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: MessageSquareText,
      iconBg: 'bg-emerald-600',
      description:
        '생활가전 쇼핑몰 「하루살림」 무선 청소기 고객 리뷰를 Gemini AI로 일괄 분석하여 감성 분류, 개선 요청 사항, 안전 이슈 및 소비자 위해정보를 확인합니다.',
      features: [
        '리뷰 텍스트 및 CSV/엑셀 일괄 업로드',
        'Gemini 3.8 Flash 기반 정밀 감성·카테고리 분석',
        '한국소비자원 위해정보 실시간 공공데이터 연동',
        '일자별 분석 이력 Supabase 저장 및 즉시 갱신',
      ],
      buttonText: '리뷰 분석 바로가기',
      accentColor: 'hover:border-emerald-500',
    },
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/60 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* 상단 헤더 영역 */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wide mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>내 업무 도구함 통합 포털</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            업무에 필요한 모든 도구를 <br className="hidden sm:inline" />
            <span className="text-blue-600">한곳에서 즉시</span> 실행하세요
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            별도의 링크 공유나 분산된 저장소 없이, 단 하나의 웹 주소에서
            경비 정산 검증부터 지점 매출 통계, 고객 리뷰 AI 분석까지 편리하게 관리합니다.
          </p>
        </div>

        {/* 3대 도구 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.path}
                className={`group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${tool.accentColor}`}
              >
                <div>
                  {/* 상단 아이콘 및 배지 */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-xs ${tool.iconBg}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tool.badgeColor}`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  {/* 도구 제목 및 설명 */}
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h2>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed min-h-[4.5rem]">
                    {tool.description}
                  </p>

                  {/* 주요 기능 리스트 */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      주요 기능
                    </h3>
                    <ul className="space-y-2">
                      {tool.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-600"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 하단 바로가기 버튼 */}
                <div className="mt-8 pt-4">
                  <Link
                    href={tool.path}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 px-4 text-sm font-semibold text-white shadow-xs transition-all group-hover:bg-blue-600"
                  >
                    <span>{tool.buttonText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 안내 배너 */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white/70 p-6 sm:p-8 backdrop-blur-xs text-center sm:text-left sm:flex sm:items-center sm:justify-between shadow-xs">
          <div>
            <div className="text-base font-bold text-slate-900">
              💡 새로운 업무 도구가 추가되나요?
            </div>
            <div className="text-sm text-slate-600 mt-1">
              상단 내비게이션 바와 허브 메뉴에 한 칸만 더해 언제든 새로운 업무 화면을 확장할 수 있도록 설계되어 있습니다.
            </div>
          </div>
          <div className="mt-4 sm:mt-0 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 py-2 px-3.5 rounded-lg">
              <CalendarCheck className="w-4 h-4 text-slate-600" />
              업무 도구함 통합 준비 완료
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

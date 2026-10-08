import React from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  하루살림 마케팅팀
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500 font-medium">자동화 분석 시스템</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                「클린핏 미니」 리뷰 분석기
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>기기 스펙: <strong>0.9kg / 최대 25분 / 전용 어댑터 4~5시간 충전</strong></span>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>소비자원 위해정보 연동</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

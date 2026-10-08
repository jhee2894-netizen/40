'use client';

import React, { useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  MinusCircle,
  Megaphone,
  AlertOctagon,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Cpu
} from 'lucide-react';
import { AnalyzedReview } from '@/types';
import { ConsumerSafetyCard } from './ConsumerSafetyCard';

interface AnalysisSummaryProps {
  results: AnalyzedReview[];
  modelUsed: string;
  analyzedOn: string;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  results,
  modelUsed,
  analyzedOn,
}) => {
  // Aggregate stats
  const stats = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let ads = 0;

    const categoryCounts: Record<string, number> = {};
    const safetyIssues: AnalyzedReview[] = [];
    const improvementRequests: AnalyzedReview[] = [];

    for (const r of results) {
      if (r.sentiment === '긍정') positive++;
      else if (r.sentiment === '부정') negative++;
      else if (r.sentiment === '중립') neutral++;
      else if (r.sentiment === '광고') ads++;

      // Count categories for complaints (or all reviews)
      // PRD: 불만 유형별 건수 집계
      if (r.categories) {
        const catList = r.categories.split(',').map((c) => c.trim()).filter(Boolean);
        for (const cat of catList) {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }

      if (r.is_safety_issue) {
        safetyIssues.push(r);
      }

      if (r.improvement_request && r.improvement_request.trim().length > 0) {
        improvementRequests.push(r);
      }
    }

    const totalValid = results.length - ads;
    const negativeRatio = totalValid > 0
      ? Math.round((negative / totalValid) * 1000) / 10
      : 0;
    const positiveRatio = totalValid > 0
      ? Math.round((positive / totalValid) * 1000) / 10
      : 0;

    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      total: results.length,
      positive,
      negative,
      neutral,
      ads,
      totalValid,
      negativeRatio,
      positiveRatio,
      sortedCategories,
      safetyIssues,
      improvementRequests,
    };
  }, [results]);

  return (
    <div className="space-y-8 mb-8">
      {/* Top Banner: Overview & Model Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">분석 기준일</p>
              <h2 className="text-xl font-bold text-slate-900">{analyzedOn} 분석 결과 보고서</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">실제 응답 AI 모델:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              {modelUsed || 'gemini-3.8-flash'}
            </span>
          </div>
        </div>

        {/* 4 Sentiment Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Negative Card (Highlighted) */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700">부정 리뷰</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-900">{stats.negative}건</span>
              <span className="text-xs font-bold text-rose-600">
                ({stats.negativeRatio}% <span className="font-normal text-[10px] text-rose-500">광고제외</span>)
              </span>
            </div>
            <p className="text-[11px] text-rose-600/80 mt-1">반어법 포함 실질적 불만</p>
          </div>

          {/* Positive Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">긍정 리뷰</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-900">{stats.positive}건</span>
              <span className="text-xs font-bold text-emerald-600">
                ({stats.positiveRatio}% <span className="font-normal text-[10px] text-emerald-500">광고제외</span>)
              </span>
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1">실제 만족 고객 비율</p>
          </div>

          {/* Neutral Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">중립 리뷰</span>
              <MinusCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{stats.neutral}건</span>
              <span className="text-xs text-slate-500">
                ({stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">칭찬/불만 대등 또는 일반</p>
          </div>

          {/* Ad Card (Excluded) */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">광고 / 체험단</span>
              <Megaphone className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-900">{stats.ads}건</span>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">
                집계 자동 제외
              </span>
            </div>
            <p className="text-[11px] text-purple-600/80 mt-1">원고료, 무상제공, 체험단</p>
          </div>
        </div>
      </div>

      {/* Side-by-side: Category Analysis & Consumer Safety Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Complaint / Mention Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">유형별 언급 및 불만 건수 순위</h3>
              <p className="text-xs text-slate-400 mt-0.5">복수 적용된 주제별 발생 빈도</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              총 {stats.sortedCategories.length}개 유형
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {stats.sortedCategories.slice(0, 8).map(([cat, count], idx) => {
              const maxCount = stats.sortedCategories[0]?.[1] || 1;
              const percent = Math.round((count / maxCount) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <span className="w-4 text-slate-400 text-[11px]">{idx + 1}.</span>
                      {cat}
                    </span>
                    <span className="text-slate-700 font-bold">{count}건</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx === 0
                          ? 'bg-rose-500'
                          : idx === 1
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Consumer Safety Agency Integration */}
        <ConsumerSafetyCard />
      </div>

      {/* Safety Issues (Red Alert Box) & Improvement Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Safety Issues (조건 없이 무조건 표시) */}
        <div className="bg-red-50/60 rounded-2xl border-2 border-red-300 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-red-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-950 text-base flex items-center gap-1.5">
                  긴급 안전 이슈 ({stats.safetyIssues.length}건 감지)
                </h3>
                <span className="text-xs text-red-700">뜨거움, 발열, 과열, 냄새, 연기, 감전 등 무조건 추출</span>
              </div>
            </div>
            {stats.safetyIssues.length > 0 && (
              <span className="text-xs font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse">
                즉시 확인 필요
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {stats.safetyIssues.length > 0 ? (
              stats.safetyIssues.map((issue) => (
                <div
                  key={issue.review_no}
                  className="p-3 bg-white rounded-xl border border-red-200 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-700">
                      [리뷰 #{issue.review_no}] 별점 {issue.rating}점 · {issue.written_on}
                    </span>
                    <span className="text-[10px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      안전 위해 항목
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    "{issue.review_text}"
                  </p>
                  {issue.improvement_request && (
                    <p className="text-[11px] text-blue-700 bg-blue-50 p-1.5 rounded">
                      요구: {issue.improvement_request}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-red-600/70 text-xs font-medium">
                발열, 화재, 감전 등 안전 이슈 관련 키워드가 감지되지 않았습니다.
              </div>
            )}
          </div>
        </div>

        {/* Customer Improvement Requests ("~면 좋겠어요", "~해 주세요") */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  고객 개선 요청 사항 ({stats.improvementRequests.length}건)
                </h3>
                <span className="text-xs text-slate-400">"~면 좋겠어요", "~해 주세요" 요구사항 자동 추출</span>
              </div>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
              피드백 목록
            </span>
          </div>

          <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {stats.improvementRequests.length > 0 ? (
              stats.improvementRequests.map((req) => (
                <div
                  key={req.review_no}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-600">
                      #{req.review_no} (유형: {req.categories || '기타'})
                    </span>
                    <span className="text-[11px] text-slate-400">별점 {req.rating}점</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mb-1">
                    👉 {req.improvement_request}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    원문: "{req.review_text}"
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                추출된 개선 요청 사항이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

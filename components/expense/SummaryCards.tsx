'use client';

import React from 'react';
import { AuditSummary, ArticleCode } from '@/lib/types';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  BadgeAlert,
  HelpCircle,
} from 'lucide-react';
import { POLICY_RULES } from '@/constants/policyRules';

interface SummaryCardsProps {
  summary: AuditSummary;
  selectedArticle?: ArticleCode | null;
  onSelectArticle?: (article: ArticleCode | null) => void;
}

export default function SummaryCards({
  summary,
  selectedArticle,
  onSelectArticle,
}: SummaryCardsProps) {
  const {
    totalCount,
    compliantCount,
    violationCount,
    totalAmount,
    violationAmount,
    articleBreakdown,
  } = summary;

  // 위반율 계산
  const violationRate = totalCount > 0 ? ((violationCount / totalCount) * 100).toFixed(1) : '0';

  // 조항 메타데이터 정의
  const articlesList: { code: ArticleCode; title: string; desc: string }[] = [
    {
      code: '제5조',
      title: POLICY_RULES.ARTICLE_5.title,
      desc: '1인 12,000원 한도 초과',
    },
    {
      code: '제6조',
      title: POLICY_RULES.ARTICLE_6.title,
      desc: '22시 이전 퇴근 택시 / 목적 누락',
    },
    {
      code: '제7조',
      title: POLICY_RULES.ARTICLE_7.title,
      desc: '3만원 이상 간이영수증',
    },
    {
      code: '제8조',
      title: POLICY_RULES.ARTICLE_8.title,
      desc: '30만원 초과 접대비 품의 누락',
    },
    {
      code: '제9조 1항',
      title: POLICY_RULES.ARTICLE_9_1.title,
      desc: '30일 초과 지연 제출',
    },
    {
      code: '제9조 2항',
      title: POLICY_RULES.ARTICLE_9_2.title,
      desc: '동일 건 2중 중복 제출',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. 핵심 지표 카드 3종 (PRD 3.3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 전체 건수 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              전체 접수 건수
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-500">건</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>총 지출액</span>
            <span className="font-semibold text-slate-800 font-mono">₩{totalAmount.toLocaleString()}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200" />
        </div>

        {/* 정상 건수 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              규정 준수 (정상)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">
              {compliantCount.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-500">건</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>정상 비율</span>
            <span className="font-semibold text-emerald-700 font-mono">
              {totalCount > 0 ? ((compliantCount / totalCount) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* 총 위반 건수 */}
        <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-2xs relative overflow-hidden bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              규정 위반 의심 건수
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">
              {violationCount.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-rose-600">건</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
              위반율 {violationRate}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>위반 지출 금액</span>
            <span className="font-bold text-rose-700 font-mono">₩{violationAmount.toLocaleString()}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* 2. 조항별 위반 통계 배지 칩 바 (PRD 3.3) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <BadgeAlert className="w-4 h-4 text-rose-500" />
            <span>사내 경비규정(제5조~제9조) 조항별 위반 통계</span>
          </div>
          {selectedArticle && (
            <button
              type="button"
              onClick={() => onSelectArticle?.(null)}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
            >
              조항 필터 해제
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {articlesList.map((art) => {
            const count = articleBreakdown[art.code] || 0;
            const isSelected = selectedArticle === art.code;
            const hasViolation = count > 0;

            return (
              <button
                key={art.code}
                type="button"
                onClick={() => {
                  if (onSelectArticle) {
                    onSelectArticle(isSelected ? null : art.code);
                  }
                }}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                    : hasViolation
                    ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${hasViolation ? 'text-rose-800' : 'text-slate-600'}`}>
                    {art.code}
                  </span>
                  <span
                    className={`text-xs font-extrabold px-1.5 py-0.2 rounded font-mono ${
                      hasViolation
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}건
                  </span>
                </div>

                <span className="text-[11px] font-medium text-slate-800 mt-1 truncate w-full" title={art.title}>
                  {art.title.replace(' 규정', '')}
                </span>

                <span className="text-[10px] text-slate-500 truncate w-full mt-0.5" title={art.desc}>
                  {art.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

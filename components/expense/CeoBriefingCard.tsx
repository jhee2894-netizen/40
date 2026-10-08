'use client';

import React, { useState } from 'react';
import { AuditedExpenseItem, AuditSummary } from '@/lib/types';
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCheck,
  AlertCircle,
  TrendingDown,
  DollarSign,
  AlertOctagon,
} from 'lucide-react';

interface CeoBriefingCardProps {
  summary: AuditSummary;
  items: AuditedExpenseItem[];
}

export default function CeoBriefingCard({ summary, items }: CeoBriefingCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const duplicateItems = items.filter((i) =>
    i.violations.some((v) => v.article === '제9조 2항')
  );

  const entertainmentViolations = items.filter((i) =>
    i.violations.some((v) => v.article === '제8조')
  );

  const payableAmount = summary.totalAmount - summary.violationAmount;

  return (
    <div className="bg-white border-2 border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* 아코디언 헤더 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-900 text-white hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">
                [대표/결재자 전용] 지출 결재 전 핵심 리스크 브리핑
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-600 text-white rounded">
                위반 {summary.violationCount}건 감지
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              클릭하여 2중 지급 사고 예방 및 고액 미승인 항목 결재 가이드를 확인하세요.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-xs font-medium hidden sm:inline">
            {isOpen ? '브리핑 접기' : '브리핑 열기'}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* 브리핑 내용 */}
      {isOpen && (
        <div className="p-6 bg-slate-50/70 border-t border-slate-200 space-y-4">
          {/* 금액 결재 비교 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">신청 총액</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                ₩{summary.totalAmount.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">전체 {summary.totalCount}건 청구</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30">
              <span className="text-xs font-semibold text-rose-700">보류/반려 대상 금액</span>
              <div className="text-xl font-extrabold text-rose-600 font-mono mt-1">
                ₩{summary.violationAmount.toLocaleString()}
              </div>
              <span className="text-[11px] text-rose-600 font-medium">규정 위반 {summary.violationCount}건</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <span className="text-xs font-semibold text-emerald-700">실지급 권장 승인액</span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                ₩{payableAmount.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">정상 규정 준수 {summary.compliantCount}건</span>
            </div>
          </div>

          {/* 중점 리스크 요약 안내 */}
          <div className="space-y-2.5 text-xs text-slate-700">
            {/* 중복 제출 경보 */}
            {duplicateItems.length > 0 && (
              <div className="p-3 bg-red-100/70 border border-red-300 rounded-xl flex items-start gap-2.5 text-red-900">
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">중복 청구 사고 주의 (제9조 2항 위반 {duplicateItems.length}건):</strong>
                  <p className="mt-0.5 text-red-800 leading-relaxed">
                    지난달 사고와 유사한 <strong>동일 지출 2중 청구</strong> 건이 감지되었습니다.
                    (예: No.25 박민수 택시비 24,300원 — No.8 건과 완전 동일). 이 건은 지급에서 반드시 제외해야 합니다.
                  </p>
                </div>
              </div>
            )}

            {/* 고액 미승인 접대비 경보 */}
            {entertainmentViolations.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-purple-900">
                <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">사전 품의 누락 접대비 (제8조 위반 {entertainmentViolations.length}건):</strong>
                  <p className="mt-0.5 text-purple-800 leading-relaxed">
                    30만원을 초과하는 고액 접대비 중 사전 품의번호가 누락된 건이 있습니다 (예: No.7 한도윤 한우명가 420,000원).
                    사전 품의서 첨부 전까지 결재 보류를 권장합니다.
                  </p>
                </div>
              </div>
            )}

            {/* 식대 및 증빙 관리 */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">회계 처리 조치 권고사항:</strong>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  식대 한도 초과분(12,000원 초과) 및 3만원 이상 간이영수증(적격증빙 미비) 건은 하단의
                  <strong> "제출자별 반려 사유 복사"</strong> 기능을 이용해 각 팀원에게 수정 또는 개인 부담 처리를 통보하십시오.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

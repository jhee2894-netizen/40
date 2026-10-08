'use client';

import React, { useState, useMemo } from 'react';
import { ExpenseItem, ParseResult, ArticleCode } from '@/lib/types';
import { auditExpenseItems, calculateAuditSummary } from '@/lib/rules';
import { exportViolationsToCSV } from '@/lib/exportUtils';
import FileUploader from '@/components/expense/FileUploader';
import ExpenseTable from '@/components/expense/ExpenseTable';
import SummaryCards from '@/components/expense/SummaryCards';
import RejectCopyModal from '@/components/expense/RejectCopyModal';
import CeoBriefingCard from '@/components/expense/CeoBriefingCard';
import {
  FileSpreadsheet,
  ShieldCheck,
  Building,
  CreditCard,
  Users,
  Layers,
  Info,
  Sparkles,
  Share2,
  Download,
} from 'lucide-react';

export default function ExpensePage() {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedArticleFilter, setSelectedArticleFilter] = useState<ArticleCode | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  // CSV 데이터 로드 핸들러
  const handleDataLoaded = (result: ParseResult) => {
    setItems(result.items);
    setFileName(result.fileName);
    setSelectedArticleFilter(null); // 필터 리셋
  };

  // 룰 엔진 실행 (PRD 3.2: 제5조 ~ 제9조 실시간 자동 검증)
  const auditedItems = useMemo(() => {
    if (items.length === 0) return [];
    return auditExpenseItems(items);
  }, [items]);

  // 대시보드 요약 통계 집계 (PRD 3.3)
  const auditSummary = useMemo(() => {
    return calculateAuditSummary(auditedItems);
  }, [auditedItems]);

  return (
    <main className="min-h-screen bg-slate-50/80 pb-20">
      {/* 서브 헤더 */}
      <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  한결인테리어 경비 정산 검사기
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  v1.5 (Pro)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Expense Policy Auditor — 브라우저 기반 실시간 검사 및 반려 자동화 솔루션
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 위반 내역 CSV 다운로드 버튼 */}
            {auditSummary.violationCount > 0 && (
              <button
                type="button"
                onClick={() => exportViolationsToCSV(auditedItems, fileName)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all"
                title="위반 내역을 CSV 파일로 다운로드"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>위반 목록 CSV 내보내기</span>
              </button>
            )}

            {/* PRD 3.4 반려 사유 일괄 복사 헤더 퀵 액션 버튼 */}
            {auditSummary.violationCount > 0 && (
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span>반려 사유 복사</span>
                <span className="bg-rose-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {auditSummary.violationCount}건
                </span>
              </button>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Zero-Persistence (보안 안전)
            </span>
          </div>
        </div>
      </header>

      {/* 본문 대시보드 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 안내 배너 */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900 text-sm">
              PRD 전 기능 완성: CSV 파싱 + 제5~9조 룰 엔진 + 대시보드 요약 + 반려 사유 원클릭 복사
            </p>
            <p className="text-slate-600 leading-relaxed">
              CSV 업로드 즉시 클라이언트 룰 엔진이 제5조~제9조를 실시간 검사하며, <strong>&quot;위반 건만 보기&quot;</strong> 필터링, <strong>&quot;제출자별 반려 사유 클립보드 복사&quot;</strong>, <strong>&quot;결재자 리스크 브리핑&quot;</strong>을 통해 월말 정산 검토 공수를 10분 이내로 단축하고 중복 청구 지급 사고를 100% 방지합니다.
            </p>
          </div>
        </div>

        {/* 1. 파일 업로더 영역 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                경비 내역 파일 업로드
              </h2>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setFileName('');
                  setSelectedArticleFilter(null);
                }}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors"
              >
                데이터 초기화
              </button>
            )}
          </div>

          <FileUploader
            onDataLoaded={handleDataLoaded}
            currentFileName={fileName}
            totalCount={items.length}
          />
        </section>

        {/* 2. 대표 및 결재자를 위한 핵심 리스크 브리핑 카드 */}
        {auditedItems.length > 0 && (
          <CeoBriefingCard summary={auditSummary} items={auditedItems} />
        )}

        {/* 3. 대시보드 요약 지표 카드 및 조항별 통계 칩 (PRD 3.3) */}
        {auditedItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>규정 준수 검사 요약</span>
                <span className="text-xs font-normal text-slate-500">
                  (총 {auditedItems.length}건 분석 완료)
                </span>
              </h2>

              {auditSummary.violationCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportViolationsToCSV(auditedItems, fileName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>CSV 다운로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>제출자별 반려 사유 복사</span>
                  </button>
                </div>
              )}
            </div>

            <SummaryCards
              summary={auditSummary}
              selectedArticle={selectedArticleFilter}
              onSelectArticle={setSelectedArticleFilter}
            />
          </section>
        )}

        {/* 4. 경비 내역 및 위반 하이라이트 테이블 (PRD 3.1, 3.2, 3.4) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>경비 내역 검사 그리드</span>
              {auditedItems.length > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  (전체 {auditedItems.length}건)
                </span>
              )}
            </h2>
          </div>

          <ExpenseTable
            items={auditedItems}
            selectedArticleFilter={selectedArticleFilter}
            onClearArticleFilter={() => setSelectedArticleFilter(null)}
            onOpenRejectModal={() => setIsRejectModalOpen(true)}
          />
        </section>
      </div>

      {/* 5. 제출자별 반려 사유 클립보드 복사 모달 (PRD 3.4) */}
      <RejectCopyModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        items={auditedItems}
      />

      {/* 푸터 */}
      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        <p>한결인테리어 경영지원팀 회계 경비 정산 검사기 — Expense Policy Auditor v1.5</p>
      </footer>
    </main>
  );
}

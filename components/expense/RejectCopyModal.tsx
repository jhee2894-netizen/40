'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AuditedExpenseItem } from '@/lib/types';
import {
  groupViolationsBySubmitter,
  formatSubmitterRejectMessage,
  formatAllRejectMessages,
  SubmitterViolations,
} from '@/lib/rejectFormatter';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  User,
  Building,
  FileText,
  Share2,
} from 'lucide-react';

interface RejectCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AuditedExpenseItem[];
}

export default function RejectCopyModal({
  isOpen,
  onClose,
  items,
}: RejectCopyModalProps) {
  // 제출자별 위반 그룹
  const violationGroups = useMemo(() => {
    return groupViolationsBySubmitter(items);
  }, [items]);

  const [selectedSubmitter, setSelectedSubmitter] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 모달 열릴 때 첫 번째 제출자 기본 선택
  useEffect(() => {
    if (isOpen && violationGroups.length > 0 && !selectedSubmitter) {
      setSelectedSubmitter(violationGroups[0].submitter);
    }
  }, [isOpen, violationGroups, selectedSubmitter]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 현재 선택된 제출자 그룹
  const currentGroup = useMemo(() => {
    return violationGroups.find((g) => g.submitter === selectedSubmitter) || violationGroups[0];
  }, [violationGroups, selectedSubmitter]);

  // 클립보드 복사 함수
  const handleCopy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                제출자별 반려 사유 클립보드 복사
                <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold">
                  위반 제출자 {violationGroups.length}명
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                사내 메신저(Slack, 카카오톡 등)나 이메일에 바로 전송할 수 있는 정형화된 안내 문구입니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 바디: 2열 레이아웃 (좌: 제출자 목록 / 우: 메시지 미리보기 및 복사) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[480px]">
          {/* 좌측: 제출자 탭 목록 */}
          <div className="w-full md:w-72 border-r border-slate-200 bg-slate-50/40 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
              위반 제출자 목록 ({violationGroups.length})
            </div>

            {violationGroups.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                위반된 제출자가 없습니다.
              </div>
            ) : (
              violationGroups.map((group) => {
                const isSelected = selectedSubmitter === group.submitter;
                const isCopied = copiedId === `list-${group.submitter}`;

                return (
                  <div
                    key={group.submitter}
                    onClick={() => setSelectedSubmitter(group.submitter)}
                    className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {group.submitter}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                          {group.department}
                        </span>
                      </div>
                      <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>위반 {group.items.length}건</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="이 제출자 텍스트 복사"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(
                          formatSubmitterRejectMessage(group),
                          `list-${group.submitter}`
                        );
                      }}
                      className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })
            )}

            {/* 전체 일괄 복사 버튼 */}
            {violationGroups.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      formatAllRejectMessages(violationGroups),
                      'copy-all'
                    )
                  }
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    copiedId === 'copy-all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800 shadow-xs'
                  }`}
                >
                  {copiedId === 'copy-all' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>전체 복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>전체 ({violationGroups.length}명) 일괄 복사</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 우측: 텍스트 미리보기 및 상세 복사 영역 */}
          <div className="flex-1 flex flex-col p-5 bg-white overflow-hidden">
            {currentGroup ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">
                      [{currentGroup.submitter} 님] 반려 안내 텍스트 미리보기
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        formatSubmitterRejectMessage(currentGroup),
                        `preview-${currentGroup.submitter}`
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      copiedId === `preview-${currentGroup.submitter}`
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
                    }`}
                  >
                    {copiedId === `preview-${currentGroup.submitter}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>클립보드에 복사</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 텍스트 박스 */}
                <div className="flex-1 mt-3 relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <textarea
                    readOnly
                    value={formatSubmitterRejectMessage(currentGroup)}
                    className="w-full h-full bg-transparent resize-none font-mono text-xs text-slate-800 leading-relaxed focus:outline-hidden"
                  />
                </div>

                <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>💡 클릭 한 번으로 복사하여 메신저(Slack/카톡/잔디)에 바로 붙여넣기하세요.</span>
                  <span>위반 항목 {currentGroup.items.length}건 포함</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                선택된 제출자가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 모달 풋터 */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>한결인테리어 경비 정산 감사 도구 — PRD 3.4 원클릭 복사</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-medium text-slate-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

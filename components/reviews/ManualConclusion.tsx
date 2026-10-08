'use client';

import React, { useState, useEffect } from 'react';
import { PenTool, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface ManualConclusionProps {
  analyzedOn: string;
}

export const ManualConclusion: React.FC<ManualConclusionProps> = ({ analyzedOn }) => {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage based on analyzedOn
  useEffect(() => {
    if (!analyzedOn) return;
    try {
      const stored = localStorage.getItem(`conclusion_${analyzedOn}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLine1(parsed.line1 || '');
        setLine2(parsed.line2 || '');
        setLine3(parsed.line3 || '');
      } else {
        setLine1('');
        setLine2('');
        setLine3('');
      }
    } catch (e) {
      console.warn('Failed to load manual conclusion:', e);
    }
  }, [analyzedOn]);

  const handleSave = () => {
    try {
      localStorage.setItem(
        `conclusion_${analyzedOn}`,
        JSON.stringify({ line1, line2, line3, updatedAt: new Date().toISOString() })
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.warn('Failed to save manual conclusion:', e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              「우리가 고칠 것」 결론 3줄 수기 작성
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                수기 입력 전용
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              분석 결과와 위해 정보 조회를 종합하여 담당자가 직접 보고용 결론 3줄을 작성합니다. (AI 자동 생성 없음)
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors active:scale-95"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>작성 내용 저장됨</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>결론 임시 저장</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {/* Line 1 */}
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
            1
          </span>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              결론 1: 제품 하드웨어 / 성능 개선 (흡입력, 배터리, 충전기 발열 등)
            </label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="예: 충전기 어댑터 발열 및 안전 회로 긴급 점검 및 제조사 품질 리콜 검토"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Line 2 */}
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
            2
          </span>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              결론 2: 상세페이지 안내 및 패키지 / 구성품 개선 (거치대, 설명서 등)
            </label>
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="예: 상세페이지 내 강모드(8분) 사용 시간 명시 및 충전 거치대 기본 번들링 옵션 신설"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Line 3 */}
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
            3
          </span>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              결론 3: 고객 경험 및 운영 / 배송 / CS 대응 개선
            </label>
            <input
              type="text"
              value={line3}
              onChange={(e) => setLine3(e.target.value)}
              placeholder="예: 배송 지연 안내 자동 알림톡 도입 및 초기 불량 전담 교환 프로세스 구축"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

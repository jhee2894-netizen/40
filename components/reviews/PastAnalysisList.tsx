'use client';

import React, { useState, useEffect } from 'react';
import { History, Eye, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { PastAnalysisSummary, AnalyzedReview } from '@/types';

interface PastAnalysisListProps {
  onSelectDate: (date: string, reviews: AnalyzedReview[], modelUsed: string) => void;
  refreshTrigger: number;
}

export const PastAnalysisList: React.FC<PastAnalysisListProps> = ({
  onSelectDate,
  refreshTrigger,
}) => {
  const [summaries, setSummaries] = useState<PastAnalysisSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingDate, setFetchingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/history', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('지난 분석 목록을 불러오지 못했습니다.');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaries(data.summaries || []);
    } catch (err: any) {
      setError(err.message || '불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handleLoadDetail = async (date: string, modelUsed: string) => {
    setFetchingDate(date);
    try {
      const res = await fetch(`/api/history?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('상세 내역을 불러오지 못했습니다.');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onSelectDate(date, data.results || [], modelUsed);
    } catch (err: any) {
      alert(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setFetchingDate(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              지난 분석 결과 이력 (Supabase 연동)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              분석일자별 누적 건수 및 부정 비율을 조회하여 월별 변화를 비교할 수 있습니다.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>이전 분석 이력을 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-600 bg-red-50 rounded-xl border border-red-200 text-xs">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            저장된 지난 분석 데이터가 없습니다. 상단에서 리뷰 CSV 파일을 업로드하여 분석을 시작하세요.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">분석일자</th>
                  <th className="py-3 px-4 text-center">전체 건수</th>
                  <th className="py-3 px-4 text-center">부정 리뷰 건수</th>
                  <th className="py-3 px-4 text-center">부정 비율 (광고 제외)</th>
                  <th className="py-3 px-4">분석 모델</th>
                  <th className="py-3 px-4 text-center">조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((item) => (
                  <tr key={item.analyzed_on} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.analyzed_on}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {item.total_count}건
                    </td>
                    <td className="py-3 px-4 text-center text-rose-600 font-medium">
                      {item.negative_count}건
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.negative_ratio}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {item.model_used || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleLoadDetail(item.analyzed_on, item.model_used || '')}
                        disabled={fetchingDate === item.analyzed_on}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        {fetchingDate === item.analyzed_on ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        <span>결과 보기</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

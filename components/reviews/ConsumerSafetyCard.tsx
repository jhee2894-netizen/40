'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw, Info, ExternalLink } from 'lucide-react';
import { ConsumerSafetyData } from '@/types';

export const ConsumerSafetyCard: React.FC = () => {
  const [safetyData, setSafetyData] = useState<ConsumerSafetyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSafetyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/safety');
      if (!res.ok) {
        throw new Error('불러오지 못했습니다');
      }
      const data: ConsumerSafetyData = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSafetyData(data);
    } catch (err: any) {
      setError('소비자 위해 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                한국소비자원 위해정보 비교
              </h3>
              <span className="text-xs text-slate-400">품목: 가정용 진공청소기 사고 분석</span>
            </div>
          </div>
          <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
            24시간 캐시 적용
          </span>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">공공데이터 위해정보 수집 및 분석 중 (3,000건 스캔)...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center bg-rose-50 rounded-xl border border-rose-200 p-4">
              <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rose-800">{error}</p>
              <p className="text-xs text-rose-600 mt-1">네트워크 상태 및 공공데이터 API 키를 확인해 주세요.</p>
            </div>
          ) : safetyData ? (
            <div>
              {/* Total Cases Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    가정용 진공청소기 공식 접수 사고
                  </p>
                  <p className="text-2xl font-black text-amber-950 mt-0.5">
                    {safetyData.totalCount.toLocaleString()}건
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded font-medium">
                    최근 3,000건 표본 조사
                  </span>
                </div>
              </div>

              {/* Top 1~3 Reasons */}
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <span>주요 사고 원인 상위 1~3위</span>
                </p>

                <div className="space-y-2">
                  {safetyData.topReasons.length > 0 ? (
                    safetyData.topReasons.map((item) => {
                      const badgeColors =
                        item.rank === 1
                          ? 'bg-rose-100 text-rose-700 border-rose-300'
                          : item.rank === 2
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300';

                      return (
                        <div
                          key={item.reason}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold border ${badgeColors}`}
                            >
                              {item.rank}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {item.reason}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {item.count}건
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      접수된 사고 원인이 없습니다.
                    </p>
                  )}
                </div>
              </div>

              {/* CEO Inspection Note */}
              <div className="mt-4 p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
                <div className="flex items-start gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-950">대표님 지시사항 대응 포인트</p>
                    <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                      "충전기 발열/과열" 문제는 실제 진공청소기 위해 사례(과열 1건 등)로도 보고되고 있습니다. 자사 제품 리뷰 중 안전 이슈 리뷰와 교차 분석하여 개선 우선순위에 반영하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              불러오지 못했습니다
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>출처: 한국소비자원 위해정보국</span>
        {safetyData?.cachedAt && (
          <span>수집시각: {new Date(safetyData.cachedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, Star, CheckCircle, HelpCircle, Megaphone, ShieldAlert } from 'lucide-react';
import { AnalyzedReview } from '@/types';

interface ReviewTableProps {
  reviews: AnalyzedReview[];
}

export const ReviewTable: React.FC<ReviewTableProps> = ({ reviews }) => {
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('전체');
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [safetyOnly, setSafetyOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract all unique categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const r of reviews) {
      if (r.categories) {
        r.categories.split(',').forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    }
    return Array.from(set).sort();
  }, [reviews]);

  // Filtered reviews
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      // Safety filter
      if (safetyOnly && !r.is_safety_issue) return false;

      // Sentiment filter
      if (sentimentFilter !== '전체' && r.sentiment !== sentimentFilter) return false;

      // Category filter
      if (categoryFilter !== '전체') {
        const cats = r.categories.split(',').map((c) => c.trim());
        if (!cats.includes(categoryFilter)) return false;
      }

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const textMatch = r.review_text.toLowerCase().includes(q);
        const reqMatch = r.improvement_request.toLowerCase().includes(q);
        const catMatch = r.categories.toLowerCase().includes(q);
        if (!textMatch && !reqMatch && !catMatch) return false;
      }

      return true;
    });
  }, [reviews, search, sentimentFilter, categoryFilter, safetyOnly]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case '긍정':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" />
            긍정
          </span>
        );
      case '부정':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3" />
            부정
          </span>
        );
      case '광고':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <Megaphone className="w-3 h-3" />
            광고
          </span>
        );
      case '중립':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <HelpCircle className="w-3 h-3" />
            중립
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            리뷰 전수 분석 상세 내역 ({filtered.length}건 / 전체 {reviews.length}건)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            감성, 유형, 개선 요청 및 안전 이슈 분류 결과를 확인하고 필터링할 수 있습니다.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="리뷰 내용 또는 키워드 검색"
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 sm:w-56"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="전체">모든 유형</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Sentiment Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
        {['전체', '부정', '긍정', '중립', '광고'].map((sent) => (
          <button
            key={sent}
            onClick={() => {
              setSentimentFilter(sent);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              sentimentFilter === sent
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {sent}
          </button>
        ))}

        <button
          onClick={() => {
            setSafetyOnly(!safetyOnly);
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
            safetyOnly
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          안전 이슈만 보기
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-3 w-14 text-center">번호</th>
              <th className="py-3 px-3 w-24">작성일</th>
              <th className="py-3 px-3 w-16 text-center">별점</th>
              <th className="py-3 px-4 min-w-[280px]">리뷰 내용</th>
              <th className="py-3 px-3 w-20 text-center">감성</th>
              <th className="py-3 px-3 w-36">유형</th>
              <th className="py-3 px-3 min-w-[180px]">개선 요청 사항</th>
              <th className="py-3 px-3 w-24 text-center">안전 이슈</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length > 0 ? (
              paginated.map((r) => (
                <tr
                  key={r.review_no}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    r.is_safety_issue ? 'bg-red-50/30' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center text-slate-400 font-medium">
                    #{r.review_no}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{r.written_on || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 leading-relaxed font-normal">
                    {r.review_text}
                  </td>
                  <td className="py-3 px-3 text-center">{getSentimentBadge(r.sentiment)}</td>
                  <td className="py-3 px-3 text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {r.categories ? (
                        r.categories.split(',').map((c, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {c.trim()}
                          </span>
                        ))
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-blue-700 font-medium">
                    {r.improvement_request ? (
                      <span className="inline-block bg-blue-50/80 px-2 py-1 rounded text-[11px] border border-blue-100">
                        {r.improvement_request}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.is_safety_issue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                        <ShieldAlert className="w-3 h-3" />
                        위험
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">정상</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  조건에 일치하는 리뷰가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>
            페이지 {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

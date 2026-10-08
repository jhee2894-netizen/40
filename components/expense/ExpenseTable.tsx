'use client';

import React, { useState, useMemo } from 'react';
import { AuditedExpenseItem, ArticleCode } from '@/lib/types';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Receipt,
  Users,
  Calendar,
  Clock,
  Filter,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExpenseTableProps {
  items: AuditedExpenseItem[];
  selectedArticleFilter?: ArticleCode | null;
  onClearArticleFilter?: () => void;
  onOpenRejectModal?: () => void;
}

type SortField = 'id' | 'usedDate' | 'amount' | 'perPersonAmount' | 'submitter' | 'isViolation';
type SortOrder = 'asc' | 'desc';

export default function ExpenseTable({
  items,
  selectedArticleFilter,
  onClearArticleFilter,
  onOpenRejectModal,
}: ExpenseTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProof, setSelectedProof] = useState<string>('ALL');
  const [onlyViolations, setOnlyViolations] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // 고유 카테고리 목록 추출
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  // 고유 증빙 유형 목록 추출
  const proofTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.proofType) set.add(item.proofType);
    });
    return Array.from(set);
  }, [items]);

  // 전체 위반 건수 계산
  const totalViolationsCount = useMemo(() => {
    return items.filter((i) => i.isViolation).length;
  }, [items]);

  // 정렬 토글 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 필터링 및 정렬 파이프라인
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      // 위반 건만 보기 필터 (PRD 3.4)
      if (onlyViolations && !item.isViolation) {
        return false;
      }

      // 조항 칩 필터
      if (selectedArticleFilter) {
        const hasArticle = item.violations.some((v) => v.article === selectedArticleFilter);
        if (!hasArticle) return false;
      }

      // 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchSubmitter = item.submitter.toLowerCase().includes(query);
        const matchDepartment = item.department.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchMerchant = item.merchant.toLowerCase().includes(query);
        const matchMemo = item.memo.toLowerCase().includes(query);
        const matchApproval = (item.approvalNumber || '').toLowerCase().includes(query);
        const matchViolations = item.violations.some((v) =>
          v.reason.toLowerCase().includes(query) || v.article.toLowerCase().includes(query)
        );

        if (
          !matchSubmitter &&
          !matchDepartment &&
          !matchCategory &&
          !matchMerchant &&
          !matchMemo &&
          !matchApproval &&
          !matchViolations
        ) {
          return false;
        }
      }

      // 항목 필터
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // 증빙 필터
      if (selectedProof !== 'ALL' && item.proofType !== selectedProof) {
        return false;
      }

      return true;
    });

    // 정렬
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'usedDate':
          comparison = a.usedDate.localeCompare(b.usedDate);
          if (comparison === 0) {
            comparison = (a.usedTime || '').localeCompare(b.usedTime || '');
          }
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'perPersonAmount':
          comparison = a.perPersonAmount - b.perPersonAmount;
          break;
        case 'submitter':
          comparison = a.submitter.localeCompare(b.submitter, 'ko-KR');
          break;
        case 'isViolation':
          comparison = (a.isViolation ? 1 : 0) - (b.isViolation ? 1 : 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    items,
    searchQuery,
    selectedCategory,
    selectedProof,
    onlyViolations,
    selectedArticleFilter,
    sortField,
    sortOrder,
  ]);

  // 필터링 결과 통계
  const filteredTotalAmount = useMemo(() => {
    return filteredAndSortedItems.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredAndSortedItems]);

  const filteredViolationCount = useMemo(() => {
    return filteredAndSortedItems.filter((item) => item.isViolation).length;
  }, [filteredAndSortedItems]);

  // 카테고리 배지 스타일
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '식대':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case '택시':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '교통비':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case '접대비':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case '소모품':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '회의비':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case '자재':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 증빙 배지 스타일
  const getProofBadgeClass = (proof: string) => {
    switch (proof) {
      case '법인카드':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case '간이영수증':
        return 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
      case '세금계산서':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // 정렬 아이콘
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-slate-400 opacity-60 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-blue-600 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-blue-600 inline" />
    );
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700">로드된 경비 데이터가 없습니다</h3>
        <p className="text-sm text-slate-500 mt-1">
          상단의 업로드 영역을 통해 CSV 파일을 업로드하거나 샘플 데이터를 불러와 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* 툴바: 검색, 토글, 필터 컨트롤 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* 검색 인풋 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제출자, 가맹점, 메모, 위반 사유 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* 필터 및 토글 그룹 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PRD 3.4: "위반 건만 보기" 스위치 토글 */}
          <button
            type="button"
            onClick={() => setOnlyViolations(!onlyViolations)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs ${
              onlyViolations
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                onlyViolations ? 'bg-white animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>위반 건만 보기</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                onlyViolations ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {totalViolationsCount}
            </span>
          </button>

          {/* 항목 필터 */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">항목:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">전체 ({items.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 증빙 필터 */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">증빙:</span>
            <select
              value={selectedProof}
              onChange={(e) => setSelectedProof(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">전체 ({items.length})</option>
              {proofTypes.map((proof) => (
                <option key={proof} value={proof}>
                  {proof}
                </option>
              ))}
            </select>
          </div>

          {/* PRD 3.4: 반려 사유 클립보드 복사 모달 열기 버튼 */}
          {onOpenRejectModal && totalViolationsCount > 0 && (
            <button
              type="button"
              onClick={onOpenRejectModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-rose-300" />
              <span>반려 사유 복사</span>
            </button>
          )}
        </div>
      </div>

      {/* 결과 메트릭 및 조항 필터 활성 배너 */}
      <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            총 <strong className="text-slate-900 font-semibold">{filteredAndSortedItems.length}</strong>건 표시
            {filteredAndSortedItems.length !== items.length && ` (전체 ${items.length}건 중)`}
          </span>
          <span className="text-slate-300">|</span>
          <span>
            표시 금액 합계: <strong className="text-slate-900 font-semibold font-mono">₩{filteredTotalAmount.toLocaleString()}</strong>
          </span>
          {filteredViolationCount > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                위반 {filteredViolationCount}건 포함
              </span>
            </>
          )}

          {/* 조항 칩 필터 활성 뱃지 */}
          {selectedArticleFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-semibold">
              필터: {selectedArticleFilter}
              <button
                type="button"
                onClick={onClearArticleFilter}
                className="hover:text-rose-950 font-bold ml-1 text-sm"
              >
                ×
              </button>
            </span>
          )}

          {/* 위반 필터 활성 뱃지 */}
          {onlyViolations && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-semibold">
              위반 건만 필터링 중
              <button
                type="button"
                onClick={() => setOnlyViolations(false)}
                className="hover:text-rose-950 font-bold ml-1 text-sm"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {(searchQuery || selectedCategory !== 'ALL' || selectedProof !== 'ALL' || onlyViolations || selectedArticleFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedProof('ALL');
              setOnlyViolations(false);
              onClearArticleFilter?.();
            }}
            className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
          >
            모든 필터 초기화
          </button>
        )}
      </div>

      {/* 반응형 테이블 컨테이너 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th
                onClick={() => handleSort('id')}
                className="py-3 px-3 w-14 cursor-pointer hover:bg-slate-100 text-center"
              >
                No {renderSortIcon('id')}
              </th>
              <th
                onClick={() => handleSort('isViolation')}
                className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-100 text-center"
              >
                검사 결과 {renderSortIcon('isViolation')}
              </th>
              <th
                onClick={() => handleSort('usedDate')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100"
              >
                사용일시 {renderSortIcon('usedDate')}
              </th>
              <th
                onClick={() => handleSort('submitter')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100"
              >
                제출자 (부서) {renderSortIcon('submitter')}
              </th>
              <th className="py-3 px-3">항목</th>
              <th className="py-3 px-3">가맹점</th>
              <th
                onClick={() => handleSort('amount')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
              >
                금액 {renderSortIcon('amount')}
              </th>
              <th
                onClick={() => handleSort('perPersonAmount')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
              >
                인원 / 1인당 {renderSortIcon('perPersonAmount')}
              </th>
              <th className="py-3 px-3 text-center">증빙</th>
              <th className="py-3 px-3">품의번호</th>
              <th className="py-3 px-3">제출일</th>
              <th className="py-3 px-4 min-w-[140px]">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  일치하는 경비 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const isExpanded = expandedRowId === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                      className={`cursor-pointer transition-colors group ${
                        item.isViolation
                          ? 'bg-rose-50/50 hover:bg-rose-100/60 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-50/90 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* 번호 */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {item.id}
                      </td>

                      {/* 검사 결과 배지 */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.isViolation ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>위반 ({item.violations.map((v) => v.article).join(', ')})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>정상</span>
                          </div>
                        )}
                      </td>

                      {/* 사용일시 */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-slate-800">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.usedDate}</span>
                        </div>
                        {item.usedTime && (
                          <div className="flex items-center gap-1 font-mono text-slate-500 text-[11px] mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{item.usedTime}</span>
                          </div>
                        )}
                      </td>

                      {/* 제출자 (부서) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{item.submitter}</span>
                        <span className="ml-1.5 text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.department}
                        </span>
                      </td>

                      {/* 항목 배지 */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* 가맹점 */}
                      <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-800 font-medium" title={item.merchant}>
                        {item.merchant}
                      </td>

                      {/* 금액 */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-900 font-mono">
                        ₩{item.amount.toLocaleString()}
                      </td>

                      {/* 인원 및 1인당 금액 */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono">
                        {item.attendeesCount > 1 ? (
                          <div>
                            <span className={`font-semibold ${item.perPersonAmount > 12000 && item.category.includes('식대') ? 'text-rose-600' : 'text-slate-800'}`}>
                              ₩{item.perPersonAmount.toLocaleString()}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center justify-end gap-0.5">
                              <Users className="w-2.5 h-2.5" />
                              <span>{item.attendeesCount}명</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">1명</span>
                        )}
                      </td>

                      {/* 증빙 */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getProofBadgeClass(
                            item.proofType
                          )}`}
                        >
                          {item.proofType}
                        </span>
                      </td>

                      {/* 품의번호 */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {item.approvalNumber ? (
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.approvalNumber}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 제출일 */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {item.submittedDate || '-'}
                      </td>

                      {/* 메모 */}
                      <td className="py-2.5 px-4 text-slate-600 text-[11px] max-w-[180px] truncate" title={item.memo}>
                        <div className="flex items-center justify-between">
                          <span className="truncate">{item.memo || '-'}</span>
                          {item.isViolation && (
                            <span className="text-rose-500 shrink-0 ml-1">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 위반 세부사유 확장 행 */}
                    {item.isViolation && (
                      <tr className={`${isExpanded ? 'table-row' : 'hidden md:table-row'} bg-rose-50/70 border-b border-rose-200`}>
                        <td colSpan={12} className="py-2.5 px-5">
                          <div className="flex flex-col gap-1.5">
                            {item.violations.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="flex items-start gap-2 text-xs text-rose-800"
                              >
                                <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[11px] shrink-0 font-mono">
                                  {v.article}
                                </span>
                                <span className="font-semibold text-rose-900 shrink-0">
                                  [{v.articleTitle}]
                                </span>
                                <span className="leading-relaxed">
                                  {v.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

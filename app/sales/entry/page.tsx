'use client';

import { useState, useId } from 'react';
import { supabase } from '@/lib/supabase';
import { BRANCHES, BranchName, SalesRecord } from '@/types/database';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  KeyRound,
  RotateCcw,
  Send,
  Users,
} from 'lucide-react';

export default function EntryPage() {
  const modalTitleId = useId();
  const modalDescId = useId();

  // 기본값 설정: 10월 기준 전월은 2026-09
  const [month, setMonth] = useState('2026-09');
  const [branch, setBranch] = useState<BranchName>('용산역점');
  const [pin, setPin] = useState('');
  const [salesAmountStr, setSalesAmountStr] = useState('');
  const [customerCountStr, setCustomerCountStr] = useState('');
  const [notes, setNotes] = useState('');

  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<number | string | null>(null);

  // 천 단위 콤마 포맷팅 헬퍼
  const formatNumberWithCommas = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('ko-KR');
  };

  const salesAmountNumber = salesAmountStr
    ? parseInt(salesAmountStr.replace(/,/g, ''), 10)
    : 0;
  const customerCountNumber = customerCountStr
    ? parseInt(customerCountStr.replace(/,/g, ''), 10)
    : 0;

  // 객단가 자동 계산
  const averageSpend =
    salesAmountNumber > 0 && customerCountNumber > 0
      ? Math.round(salesAmountNumber / customerCountNumber)
      : 0;

  const handleSalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalesAmountStr(formatNumberWithCommas(e.target.value));
  };

  const handleCustomersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerCountStr(formatNumberWithCommas(e.target.value));
  };

  // 폼 제출 검증 및 중복 확인
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. PIN 번호 검증 (기본 1234 또는 환경 변수)
    const requiredPin = process.env.NEXT_PUBLIC_BRANCH_PIN || '1234';
    if (pin.trim() !== requiredPin) {
      setErrorMessage('지점 PIN 번호가 올바르지 않습니다. (기본 PIN: 1234)');
      return;
    }

    if (!salesAmountNumber || salesAmountNumber <= 0) {
      setErrorMessage('매출액을 정확히 입력해 주세요.');
      return;
    }

    if (!customerCountNumber || customerCountNumber <= 0) {
      setErrorMessage('객수를 정확히 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      // 2. 이미 등록된 데이터가 있는지 확인
      const { data: existing, error: checkError } = await supabase
        .from('sales')
        .select('*')
        .eq('월', month)
        .eq('지점', branch)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existing) {
        const row = existing as unknown as SalesRecord;
        // 이미 존재함 -> 덮어쓰기 모달 띄우기
        setExistingRecordId(row.id ?? null);
        setShowOverwriteModal(true);
        setLoading(false);
        return;
      }

      // 신규 등록 실행
      await insertOrUpdateData(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '실적 등록 중 오류가 발생했습니다.';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  // 실제 데이터 등록 / 업데이트 실행
  const insertOrUpdateData = async (isUpdate: boolean) => {
    setLoading(true);
    setErrorMessage(null);

    const payload = {
      월: month,
      지점: branch,
      매출액: salesAmountNumber,
      객수: customerCountNumber,
      비고: notes.trim() ? notes.trim() : null,
    };

    try {
      if (isUpdate && existingRecordId) {
        const { error } = await supabase
          .from('sales')
          .update(payload)
          .eq('id', existingRecordId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sales').insert([payload]);
        if (error) throw error;
      }

      // 성공 토스트 메시지
      const monthDisplay = month.split('-')[1].replace(/^0/, '');
      setToastMessage(`${monthDisplay}월 실적이 정상 등록되었습니다.`);

      // 폼 초기화 (지점 및 월은 유지하고 입력값만 정리)
      setSalesAmountStr('');
      setCustomerCountStr('');
      setNotes('');
      setPin('');
      setShowOverwriteModal(false);
      setExistingRecordId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // 월 옵션 (2026-01 ~ 2026-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    return `2026-${m}`;
  });

  return (
    <div className="mx-auto max-w-2xl">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="font-semibold text-sm sm:text-base">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline ml-4"
          >
            닫기
          </button>
        </div>
      )}

      {/* 에러 알림 */}
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {/* 실적 등록 카드 */}
      <div className="overflow-hidden rounded-2xl border border-[#eaddd7] bg-white shadow-sm">
        <div className="border-b border-[#f2e8e5] bg-[#fbf6f3] px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#7f5539]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7f5539]">
              지점장 전용
            </span>
            <span className="text-xs text-[#8c7060]">1분 간편 실적 등록</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#4a3528]">
            월별 지점 실적 입력
          </h1>
          <p className="mt-1 text-sm text-[#8c7060]">
            해당 월의 확정 매출과 방문 객수를 입력해 주세요. 중앙 대시보드에 즉시 반영됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
          {/* 대상 월 및 지점 선택 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#4a3528]">
                <Calendar className="inline-block mr-1.5 h-4 w-4 text-[#7f5539]" />
                대상 월 선택
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2b2523] focus:border-[#7f5539] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/20"
              >
                {monthOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.split('-')[0]}년 {parseInt(opt.split('-')[1], 10)}월 실적
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4a3528]">
                <Building2 className="inline-block mr-1.5 h-4 w-4 text-[#7f5539]" />
                지점 선택
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as BranchName)}
                className="mt-1.5 block w-full rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2b2523] focus:border-[#7f5539] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/20"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 지점 PIN 번호 */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3528]">
              <KeyRound className="inline-block mr-1.5 h-4 w-4 text-[#7f5539]" />
              지점 접근 PIN 코드
            </label>
            <div className="relative mt-1.5">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4자리 PIN 입력 (기본: 1234)"
                className="block w-full rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2.5 text-sm text-[#2b2523] placeholder-[#b09e94] focus:border-[#7f5539] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/20"
                required
              />
            </div>
            <p className="mt-1 text-xs text-[#8c7060]">
              * 미인가 등록을 방지하기 위한 보안 코드입니다.
            </p>
          </div>

          <div className="border-t border-[#f2e8e5] pt-5">
            {/* 매출액 및 객수 */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#4a3528]">
                  <DollarSign className="inline-block mr-1.5 h-4 w-4 text-[#7f5539]" />
                  월 매출액 (원)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={salesAmountStr}
                    onChange={handleSalesChange}
                    placeholder="예: 54,320,000"
                    className="block w-full rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2.5 pr-10 text-right text-base font-semibold text-[#2b2523] placeholder-[#b09e94] focus:border-[#7f5539] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/20"
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-medium text-[#8c7060]">
                    원
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4a3528]">
                  <Users className="inline-block mr-1.5 h-4 w-4 text-[#7f5539]" />
                  월 방문 객수 (명)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customerCountStr}
                    onChange={handleCustomersChange}
                    placeholder="예: 6,820"
                    className="block w-full rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2.5 pr-10 text-right text-base font-semibold text-[#2b2523] placeholder-[#b09e94] focus:border-[#7f5539] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/20"
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-medium text-[#8c7060]">
                    명
                  </span>
                </div>
              </div>
            </div>

            {/* 실시간 객단가 참고 지표 */}
            <div className="mt-4 rounded-xl border border-[#eaddd7] bg-[#fbf6f3] p-3.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-[#6f5647]">실시간 계산 객단가 (매출액 ÷ 객수):</span>
                <span className="text-base font-bold text-[#7f5539]">
                  {averageSpend > 0 ? `${averageSpend.toLocaleString('ko-KR')} 원` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 비고란 */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3528]">
              비고 (특이사항)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 추석 연휴 3일 단축 영업, 인근 도로 공사, 매장 리뉴얼 등"
              className="mt-1.5 block w-full rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2.5 text-sm text-[#2b2523] placeholder-[#b09e94] focus:border-[#7f5539] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/20"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7f5539] px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#6c4830] focus:outline-none focus:ring-2 focus:ring-[#7f5539]/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCcw className="h-5 w-5 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>{month} 실적 등록하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 덮어쓰기 확인 팝업 모달 */}
      {showOverwriteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          aria-describedby={modalDescId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 id={modalTitleId} className="text-lg font-bold text-[#4a3528]">
                기존 실적 데이터 덮어쓰기
              </h2>
            </div>
            <p id={modalDescId} className="mt-3 text-sm text-[#6f5647] leading-relaxed">
              <strong>{month}</strong>의 <strong>{branch}</strong> 실적이 이미 등록되어 있습니다.
              새로 입력하신 실적 데이터로 덮어쓰시겠습니까?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOverwriteModal(false)}
                className="rounded-xl border border-[#d2bab0] px-4 py-2 text-sm font-semibold text-[#6f5647] hover:bg-[#f2e8e5]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => insertOrUpdateData(true)}
                className="rounded-xl bg-[#7f5539] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6c4830]"
              >
                덮어쓰기 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

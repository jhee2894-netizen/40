'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SalesRecord, MonthlyHoliday, BRANCHES } from '@/types/database';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Calendar,
  CreditCard,
  Download,
  Filter,
  Layers,
  PenLine,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function Dashboard() {
  const [salesList, setSalesList] = useState<SalesRecord[]>([]);
  const [holidays, setHolidays] = useState<Record<string, MonthlyHoliday>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [subChartType, setSubChartType] = useState<'line' | 'bar'>('line');

  // 데이터 로딩
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Supabase에서 매출 실적 조회
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('월', { ascending: true })
        .order('지점', { ascending: true });

      if (salesError) throw salesError;

      const salesData = (sales || []) as unknown as SalesRecord[];
      setSalesList(salesData);

      // 고유 월 목록 추출
      const uniqueMonths = Array.from(new Set(salesData.map((s) => s.월))).sort();
      if (uniqueMonths.length > 0 && !selectedMonth) {
        // 가장 최근 월을 기본 선택
        setSelectedMonth(uniqueMonths[uniqueMonths.length - 1]);
      }

      // 2. 해당 월들의 공휴일 정보 조회 (/api/holidays 호출)
      const holidayMap: Record<string, MonthlyHoliday> = {};
      await Promise.all(
        uniqueMonths.map(async (ym) => {
          try {
            const res = await fetch(`/api/holidays?year_month=${ym}`);
            if (res.ok) {
              const hData: MonthlyHoliday = await res.json();
              holidayMap[ym] = hData;
            }
          } catch (e) {
            console.warn(`공휴일 조회 실패 (${ym}):`, e);
          }
        })
      );
      setHolidays(holidayMap);
    } catch (err) {
      console.error('데이터 조회 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 전체 등록된 월 목록
  const allMonths = useMemo(() => {
    return Array.from(new Set(salesList.map((s) => s.월))).sort();
  }, [salesList]);

  // 메인 듀얼 축 차트용 집계 데이터 (월별 총매출 + 공휴일 수)
  const mainChartData = useMemo(() => {
    return allMonths.map((ym) => {
      const monthRecords = salesList.filter((s) => s.월 === ym);
      const totalSales = monthRecords.reduce((sum, r) => sum + Number(r.매출액), 0);
      const totalCustomers = monthRecords.reduce((sum, r) => sum + Number(r.객수), 0);
      const hInfo = holidays[ym];
      const holidayCount = hInfo ? hInfo.holiday_count : 0;
      const holidayNames = hInfo ? hInfo.holiday_names : [];

      return {
        month: ym,
        monthLabel: `${ym.split('-')[1]}월`,
        totalSales,
        totalSalesInMillion: Math.round(totalSales / 10000) / 100, // 백만 원 단위
        totalCustomers,
        holidayCount,
        holidayNames,
      };
    });
  }, [allMonths, salesList, holidays]);

  // 지점별 추이 차트용 데이터
  const branchTrendData = useMemo(() => {
    return allMonths.map((ym) => {
      const row: Record<string, string | number> = {
        month: ym,
        monthLabel: `${ym.split('-')[1]}월`,
      };
      BRANCHES.forEach((b) => {
        const record = salesList.find((s) => s.월 === ym && s.지점 === b);
        row[b] = record ? Number(record.매출액) : 0;
        row[`${b}_inTenMillion`] = record ? Math.round(Number(record.매출액) / 10000000 * 10) / 10 : 0;
      });
      return row;
    });
  }, [allMonths, salesList]);

  // 선택된 월의 KPI 지표 계산
  const currentMonthKpi = useMemo(() => {
    if (!selectedMonth) return null;

    const currIndex = allMonths.indexOf(selectedMonth);
    const currRecords = salesList.filter((s) => s.월 === selectedMonth);
    const currTotalSales = currRecords.reduce((sum, r) => sum + Number(r.매출액), 0);
    const currTotalCust = currRecords.reduce((sum, r) => sum + Number(r.객수), 0);
    const avgSpend = currTotalCust > 0 ? Math.round(currTotalSales / currTotalCust) : 0;

    // 전월 대비(MoM) 증감률
    let momGrowth: number | null = null;
    if (currIndex > 0) {
      const prevMonth = allMonths[currIndex - 1];
      const prevRecords = salesList.filter((s) => s.월 === prevMonth);
      const prevTotalSales = prevRecords.reduce((sum, r) => sum + Number(r.매출액), 0);
      if (prevTotalSales > 0) {
        momGrowth = ((currTotalSales - prevTotalSales) / prevTotalSales) * 100;
      }
    }

    // 최고 매출 지점
    let topBranch = '-';
    let topBranchSales = 0;
    currRecords.forEach((r) => {
      if (Number(r.매출액) > topBranchSales) {
        topBranchSales = Number(r.매출액);
        topBranch = r.지점;
      }
    });

    const holidayInfo = holidays[selectedMonth];
    const holidayCount = holidayInfo ? holidayInfo.holiday_count : 0;
    const holidayNames = holidayInfo ? holidayInfo.holiday_names : [];

    return {
      month: selectedMonth,
      totalSales: currTotalSales,
      momGrowth,
      totalCustomers: currTotalCust,
      avgSpend,
      topBranch,
      topBranchSales,
      holidayCount,
      holidayNames,
    };
  }, [selectedMonth, allMonths, salesList, holidays]);

  // 필터링된 테이블 데이터
  const filteredTableData = useMemo(() => {
    let result = [...salesList];
    if (filterBranch !== 'all') {
      result = result.filter((s) => s.지점 === filterBranch);
    }
    // 월 내림차순(최신순) 정렬
    return result.sort((a, b) => b.월.localeCompare(a.월) || a.지점.localeCompare(b.지점));
  }, [salesList, filterBranch]);

  // CSV(엑셀) 다운로드 핸들러
  const handleDownloadCsv = () => {
    const headers = ['월', '지점', '매출액', '객수', '객단가', '비고'];
    const rows = filteredTableData.map((r) => {
      const avg = r.객수 > 0 ? Math.round(Number(r.매출액) / Number(r.객수)) : 0;
      return [
        r.월,
        r.지점,
        r.매출액,
        r.객수,
        avg,
        r.비고 ? `"${r.비고.replace(/"/g, '""')}"` : '',
      ];
    });

    // BOM 추가 (엑셀 한글 깨짐 방지)
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `오늘의원두_매출실적_${filterBranch}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const branchColors: Record<string, string> = {
    용산역점: '#8b4513', // 진한 커피 브라운
    삼각지점: '#c026d3', // 선명한 비비드 보라 (마젠타 퍼플 - 이태원점 블루와 완벽 분리)
    이태원점: '#2563eb', // 블루 (파랑)
    효창공원점: '#059669', // 에메랄드 그린 (초록)
    한남점: '#ea580c', // 선명한 오렌지 (주황)
  };

  return (
    <div className="space-y-8">
      {/* 대시보드 상단 헤더 & 컨트롤 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f2e8e5] px-3 py-1 text-xs font-semibold text-[#7f5539]">
            <span>실시간 연동</span> • <span>5개 지점 통합 관리판</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4a3528]">
            종합 매출 및 공휴일 분석 대시보드
          </h1>
          <p className="mt-1 text-sm text-[#8c7060]">
            지점별 월별 매출 실적과 공공데이터포털 법정 공휴일 일수 상관관계를 한눈에 비교합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 선택 월 변경 드롭다운 */}
          <div className="flex items-center rounded-xl border border-[#d2bab0] bg-white px-3 py-2 shadow-sm">
            <Calendar className="mr-2 h-4 w-4 text-[#7f5539]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#4a3528] focus:outline-none"
            >
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {m.split('-')[0]}년 {parseInt(m.split('-')[1], 10)}월 실적 기준
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            title="데이터 새로고침"
            className="inline-flex items-center justify-center rounded-xl border border-[#d2bab0] bg-white p-2.5 text-[#6f5647] shadow-sm hover:bg-[#f2e8e5]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/sales/entry"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7f5539] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6c4830]"
          >
            <PenLine className="h-4 w-4" />
            <span>실적 등록</span>
          </Link>
        </div>
      </div>

      {/* 1. 상단 KPI 요약 카드 */}
      {currentMonthKpi && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 총 매출액 & MoM */}
          <div className="rounded-2xl border border-[#eaddd7] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8c7060]">
              <span>{currentMonthKpi.month} 총매출</span>
              <CreditCard className="h-4 w-4 text-[#7f5539]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#4a3528]">
              {currentMonthKpi.totalSales.toLocaleString('ko-KR')}
              <span className="ml-1 text-sm font-semibold text-[#8c7060]">원</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              {currentMonthKpi.momGrowth !== null ? (
                currentMonthKpi.momGrowth >= 0 ? (
                  <span className="inline-flex items-center text-emerald-600 font-bold">
                    <TrendingUp className="mr-1 h-3.5 w-3.5" />
                    +{currentMonthKpi.momGrowth.toFixed(1)}% (전월대비)
                  </span>
                ) : (
                  <span className="inline-flex items-center text-rose-600 font-bold">
                    <TrendingDown className="mr-1 h-3.5 w-3.5" />
                    {currentMonthKpi.momGrowth.toFixed(1)}% (전월대비)
                  </span>
                )
              ) : (
                <span className="text-[#8c7060]">전월 데이터 없음</span>
              )}
            </div>
          </div>

          {/* 총 방문 객수 & 평균 객단가 */}
          <div className="rounded-2xl border border-[#eaddd7] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8c7060]">
              <span>총 방문 객수 및 객단가</span>
              <Users className="h-4 w-4 text-[#7f5539]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#4a3528]">
              {currentMonthKpi.totalCustomers.toLocaleString('ko-KR')}
              <span className="ml-1 text-sm font-semibold text-[#8c7060]">명</span>
            </div>
            <div className="mt-3 text-xs font-semibold text-[#6f5647]">
              평균 객단가:{' '}
              <span className="font-bold text-[#7f5539]">
                {currentMonthKpi.avgSpend.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          {/* 최고 매출 지점 */}
          <div className="rounded-2xl border border-[#eaddd7] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8c7060]">
              <span>최고 매출 달성 지점</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#4a3528]">
              {currentMonthKpi.topBranch}
            </div>
            <div className="mt-3 text-xs text-[#6f5647]">
              달성 매출:{' '}
              <span className="font-bold text-[#7f5539]">
                {currentMonthKpi.topBranchSales.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          {/* 공휴일 일수 배지 */}
          <div className="rounded-2xl border border-[#eaddd7] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8c7060]">
              <span>해당 월 법정 공휴일</span>
              <Calendar className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#4a3528]">
                {currentMonthKpi.holidayCount}
              </span>
              <span className="text-sm font-semibold text-[#8c7060]">일</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                특일 정보 연동
              </span>
            </div>
            <div className="mt-3 truncate text-xs text-[#6f5647]" title={currentMonthKpi.holidayNames.join(', ')}>
              {currentMonthKpi.holidayNames.length > 0 ? (
                <>휴일: {currentMonthKpi.holidayNames.join(', ')}</>
              ) : (
                <>공휴일 없음 (0일)</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. 메인 차트: 월별 총매출(막대) & 공휴일 수(꺾은선) Recharts 이중 축 복합 차트 */}
      <div className="rounded-2xl border border-[#eaddd7] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f2e8e5] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#4a3528]">
              월별 총매출 & 공휴일 상관관계 분석 (이중 축 복합 차트)
            </h2>
            <p className="text-xs text-[#8c7060]">
              좌측 축: 전체 지점 합산 매출액 (원 단위) | 우측 축: 해당 월 법정 공휴일 수 (일 단위)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#9c6644]" />
              합산 매출액 (막대)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-[#3b82f6]" />
              공휴일 일수 (라인)
            </span>
          </div>
        </div>

        <div className="mt-6 h-80 w-full sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mainChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6e0" />
              <XAxis dataKey="monthLabel" stroke="#6f5647" tick={{ fontSize: 13 }} />
              {/* 왼쪽 Y축: 매출액 */}
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#9c6644"
                tickFormatter={(val) => `${(val / 10000000).toLocaleString('ko-KR')}천만`}
                tick={{ fontSize: 12 }}
              />
              {/* 오른쪽 Y축: 공휴일 일수 */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#3b82f6"
                domain={[0, 6]}
                tickFormatter={(val) => `${val}일`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-[#d2bab0] bg-white p-4 shadow-lg text-xs">
                        <div className="font-bold text-sm text-[#4a3528] pb-1 border-b border-[#f2e8e5]">
                          {data.month} 실적 리포트
                        </div>
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-[#8c7060]">전체 합산 매출:</span>
                            <span className="font-bold text-[#9c6644]">
                              {data.totalSales.toLocaleString('ko-KR')}원
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[#8c7060]">총 방문 객수:</span>
                            <span className="font-semibold text-[#4a3528]">
                              {data.totalCustomers.toLocaleString('ko-KR')}명
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[#8c7060]">법정 공휴일:</span>
                            <span className="font-bold text-[#3b82f6]">
                              {data.holidayCount}일
                            </span>
                          </div>
                          {data.holidayNames.length > 0 && (
                            <div className="mt-1 pt-1.5 border-t border-[#f2e8e5] text-[#6f5647]">
                              휴일 명칭: {data.holidayNames.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="totalSales"
                name="합산 매출액"
                fill="#9c6644"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="holidayCount"
                name="공휴일 수"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#3b82f6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. 서브 차트: 5개 지점별 매출 기여도 및 추이 */}
      <div className="rounded-2xl border border-[#eaddd7] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f2e8e5] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#4a3528]">
              5개 지점별 월별 매출 추이
            </h2>
            <p className="text-xs text-[#8c7060]">
              지점별 실적 증감 및 기여도를 한눈에 비교합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubChartType('line')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subChartType === 'line'
                  ? 'bg-[#7f5539] text-white shadow-sm'
                  : 'bg-[#f2e8e5] text-[#6f5647] hover:bg-[#eaddd7]'
              }`}
            >
              라인 차트
            </button>
            <button
              onClick={() => setSubChartType('bar')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subChartType === 'bar'
                  ? 'bg-[#7f5539] text-white shadow-sm'
                  : 'bg-[#f2e8e5] text-[#6f5647] hover:bg-[#eaddd7]'
              }`}
            >
              스택 바 차트
            </button>
          </div>
        </div>

        <div className="mt-6 h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {subChartType === 'line' ? (
              <LineChart data={branchTrendData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e6e0" />
                <XAxis dataKey="monthLabel" stroke="#6f5647" tick={{ fontSize: 13 }} />
                <YAxis
                  stroke="#6f5647"
                  tickFormatter={(val) => `${(val / 10000000).toLocaleString('ko-KR')}천만`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${Number(value).toLocaleString('ko-KR')}원`,
                    name,
                  ]}
                />
                <Legend />
                {BRANCHES.map((b) => (
                  <Line
                    key={b}
                    type="monotone"
                    dataKey={b}
                    stroke={branchColors[b]}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            ) : (
              <ComposedChart data={branchTrendData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e6e0" />
                <XAxis dataKey="monthLabel" stroke="#6f5647" tick={{ fontSize: 13 }} />
                <YAxis
                  stroke="#6f5647"
                  tickFormatter={(val) => `${(val / 10000000).toLocaleString('ko-KR')}천만`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${Number(value).toLocaleString('ko-KR')}원`,
                    name,
                  ]}
                />
                <Legend />
                {BRANCHES.map((b) => (
                  <Bar
                    key={b}
                    dataKey={b}
                    stackId="branchStack"
                    fill={branchColors[b]}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. 월별/지점별 실적 상세 테이블 */}
      <div className="overflow-hidden rounded-2xl border border-[#eaddd7] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#f2e8e5] p-5 sm:flex-row sm:items-center sm:justify-between bg-[#fbf6f3]">
          <div>
            <h2 className="text-lg font-bold text-[#4a3528]">
              월별/지점별 실적 상세 데이터
            </h2>
            <p className="text-xs text-[#8c7060]">
              총 {filteredTableData.length}건의 매출 실적 데이터가 조회되었습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 지점 필터 */}
            <div className="flex items-center rounded-xl border border-[#d2bab0] bg-white px-3 py-2 text-xs shadow-sm">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-[#7f5539]" />
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-transparent font-semibold text-[#4a3528] focus:outline-none"
              >
                <option value="all">전체 지점 보기</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* CSV 다운로드 버튼 */}
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d2bab0] bg-white px-3.5 py-2 text-xs font-semibold text-[#6f5647] shadow-sm hover:bg-[#f2e8e5]"
            >
              <Download className="h-3.5 w-3.5 text-[#7f5539]" />
              <span>엑셀(CSV) 다운로드</span>
            </button>
          </div>
        </div>

        {/* 테이블 렌더링 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#eaddd7] bg-[#fbf6f3] text-xs font-bold text-[#6f5647]">
              <tr>
                <th className="px-5 py-3.5">월</th>
                <th className="px-5 py-3.5">지점</th>
                <th className="px-5 py-3.5 text-right">매출액 (원)</th>
                <th className="px-5 py-3.5 text-right">객수 (명)</th>
                <th className="px-5 py-3.5 text-right">객단가 (원)</th>
                <th className="px-5 py-3.5">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e8e5] text-[#2b2523]">
              {filteredTableData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#8c7060]">
                    등록된 실적 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredTableData.map((row, idx) => {
                  const spend =
                    row.객수 > 0 ? Math.round(Number(row.매출액) / Number(row.객수)) : 0;
                  return (
                    <tr
                      key={row.id || `${row.월}-${row.지점}-${idx}`}
                      className="transition hover:bg-[#fdf8f6]"
                    >
                      <td className="px-5 py-3 font-medium text-[#4a3528]">
                        {row.월}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-md bg-[#f2e8e5] px-2 py-0.5 text-xs font-semibold text-[#6f5647]">
                          {row.지점}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-[#4a3528]">
                        {Number(row.매출액).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-5 py-3 text-right text-[#6f5647]">
                        {Number(row.객수).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-[#7f5539]">
                        {spend.toLocaleString('ko-KR')}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#8c7060]">
                        {row.비고 ? (
                          <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                            {row.비고}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

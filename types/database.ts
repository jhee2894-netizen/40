export interface SalesRecord {
  id?: number | string;
  월: string; // 'YYYY-MM' (예: '2026-09')
  지점: string; // '용산역점' | '삼각지점' | '이태원점' | '효창공원점' | '한남점'
  매출액: number; // 원 단위 (BIGINT)
  객수: number; // 방문객 수 (INT)
  비고: string | null; // 특이사항
  created_at?: string;
}

export interface MonthlyHoliday {
  year_month: string; // 'YYYY-MM'
  holiday_count: number; // 법정 공휴일 수
  holiday_names: string[]; // 휴일 명칭 목록
  updated_at?: string;
}

export const BRANCHES = [
  '용산역점',
  '삼각지점',
  '이태원점',
  '효창공원점',
  '한남점',
] as const;

export type BranchName = (typeof BRANCHES)[number];

export interface DashboardMonthlySummary {
  month: string; // 'YYYY-MM'
  totalSales: number;
  totalCustomers: number;
  averageSpend: number;
  holidayCount: number;
  holidayNames: string[];
  branchSales: Record<string, number>;
}

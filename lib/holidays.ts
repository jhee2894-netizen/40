import { MonthlyHoliday } from '@/types/database';
import { supabase } from './supabase';

// 한국 법정 공휴일 표준 데이터 (API 키 미설정 또는 호출 실패 시 fallback용)
const FALLBACK_HOLIDAYS_2026: Record<string, { count: number; names: string[] }> = {
  '2026-01': { count: 1, names: ['신정'] },
  '2026-02': { count: 3, names: ['설날 연휴 (3일)'] },
  '2026-03': { count: 2, names: ['삼일절', '대체공휴일'] },
  '2026-04': { count: 0, names: [] },
  '2026-05': { count: 2, names: ['어린이날', '부처님오신날 대체공휴일'] },
  '2026-06': { count: 1, names: ['현충일'] },
  '2026-07': { count: 0, names: [] },
  '2026-08': { count: 2, names: ['광복절', '대체공휴일'] },
  '2026-09': { count: 4, names: ['추석 연휴', '추석', '추석 연휴', '대체공휴일'] },
  '2026-10': { count: 3, names: ['개천절', '개천절 대체공휴일', '한글날'] },
  '2026-11': { count: 0, names: [] },
  '2026-12': { count: 1, names: ['크리스마스'] },
};

/**
 * 공공데이터포털 또는 캐시를 통해 해당 연월의 공휴일 정보를 조회합니다.
 */
export async function getHolidaysForMonth(yearMonth: string): Promise<MonthlyHoliday> {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // 1. Supabase monthly_holidays 캐시 확인
  try {
    const { data: cached, error: cacheErr } = await supabase
      .from('monthly_holidays')
      .select('*')
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (cached && !cacheErr) {
      return {
        year_month: cached.year_month,
        holiday_count: cached.holiday_count,
        holiday_names: cached.holiday_names || [],
        updated_at: cached.updated_at,
      };
    }
  } catch (err) {
    console.warn('캐시 조회 중 오류:', err);
  }

  // 2. 공공데이터포털 특일 정보 API 호출
  const serviceKey = process.env.HOLIDAY_API_KEY || process.env.PUBLIC_DATA_PORTAL_HOLIDAY_KEY;
  let holidayCount = 0;
  let holidayNames: string[] = [];

  if (serviceKey && serviceKey !== 'your_api_service_key_here') {
    try {
      const formattedMonth = month.toString().padStart(2, '0');
      const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&solMonth=${formattedMonth}&_type=json&ServiceKey=${encodeURIComponent(
        serviceKey
      )}`;

      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (res.ok) {
        const json = await res.json();
        const items = json?.response?.body?.items?.item;

        if (Array.isArray(items)) {
          const validItems = items.filter((item: { isHoliday?: string }) => item.isHoliday === 'Y');
          holidayCount = validItems.length;
          holidayNames = validItems.map((item: { dateName?: string }) => item.dateName || '공휴일');
        } else if (items && items.isHoliday === 'Y') {
          holidayCount = 1;
          holidayNames = [items.dateName || '공휴일'];
        }
      }
    } catch (apiErr) {
      console.warn('공공데이터포털 API 호출 실패, fallback 사용:', apiErr);
    }
  }

  // API 키가 없거나 데이터가 비어있을 때 fallback 활용
  if (holidayCount === 0 && holidayNames.length === 0 && FALLBACK_HOLIDAYS_2026[yearMonth]) {
    holidayCount = FALLBACK_HOLIDAYS_2026[yearMonth].count;
    holidayNames = FALLBACK_HOLIDAYS_2026[yearMonth].names;
  }

  const result: MonthlyHoliday = {
    year_month: yearMonth,
    holiday_count: holidayCount,
    holiday_names: holidayNames,
  };

  // 3. Supabase monthly_holidays에 캐시 저장 (UPSERT)
  try {
    await supabase.from('monthly_holidays').upsert(
      {
        year_month: yearMonth,
        holiday_count: holidayCount,
        holiday_names: holidayNames,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'year_month' }
    );
  } catch (saveErr) {
    console.warn('공휴일 캐시 저장 중 오류:', saveErr);
  }

  return result;
}

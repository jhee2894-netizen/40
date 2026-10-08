import { NextRequest, NextResponse } from 'next/server';
import { getHolidaysForMonth } from '@/lib/holidays';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get('year_month');
  const year = searchParams.get('year');

  try {
    if (yearMonth) {
      const data = await getHolidaysForMonth(yearMonth);
      return NextResponse.json(data);
    }

    if (year) {
      // 해당 연도의 전체 12개월 조회
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = (i + 1).toString().padStart(2, '0');
        return `${year}-${m}`;
      });

      const results = await Promise.all(months.map((ym) => getHolidaysForMonth(ym)));
      return NextResponse.json(results);
    }

    // 기본: Supabase monthly_holidays 전체 캐시 목록 반환
    const { data: cached, error } = await supabase
      .from('monthly_holidays')
      .select('*')
      .order('year_month', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(cached || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

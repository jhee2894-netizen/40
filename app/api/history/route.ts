import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
      // Fetch details for a specific date
      const { data, error } = await supabase
        .from('review_analysis')
        .select('*')
        .eq('analyzed_on', date)
        .order('review_no', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: '해당 일자의 분석 내역을 불러오지 못했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ date, results: data });
    }

    // Otherwise, fetch all rows to calculate past analysis summary by date
    const { data, error } = await supabase
      .from('review_analysis')
      .select('analyzed_on, sentiment, model_used')
      .order('analyzed_on', { ascending: false });

    if (error) {
      console.error('Failed to fetch review history from Supabase:', error);
      return NextResponse.json(
        { error: '지난 분석 목록을 불러오지 못했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ summaries: [] });
    }

    // Group by analyzed_on
    const map = new Map<string, {
      total: number;
      negative: number;
      ad: number;
      models: Set<string>;
    }>();

    for (const row of data) {
      const dateKey = row.analyzed_on || '미지정';
      if (!map.has(dateKey)) {
        map.set(dateKey, { total: 0, negative: 0, ad: 0, models: new Set() });
      }
      const entry = map.get(dateKey)!;
      entry.total += 1;
      if (row.sentiment === '부정') {
        entry.negative += 1;
      } else if (row.sentiment === '광고') {
        entry.ad += 1;
      }
      if (row.model_used) {
        entry.models.add(row.model_used);
      }
    }

    const summaries = Array.from(map.entries()).map(([analyzed_on, stats]) => {
      // Exclude ads from denominator as per PRD
      const validTotal = stats.total - stats.ad;
      const negative_ratio = validTotal > 0
        ? Math.round((stats.negative / validTotal) * 1000) / 10
        : 0;

      return {
        analyzed_on,
        total_count: stats.total,
        negative_count: stats.negative,
        negative_ratio,
        model_used: Array.from(stats.models).join(', ') || '-',
      };
    });

    return NextResponse.json({ summaries });
  } catch (err: any) {
    console.error('History API error:', err);
    return NextResponse.json(
      { error: '과거 분석 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ConsumerSafetyData } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

// In-memory cache
let memoryCache: { data: ConsumerSafetyData; timestamp: number } | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// File-based cache fallback
const CACHE_FILE_PATH = path.join(process.cwd(), '.next', 'consumer_safety_cache.json');

function readFromFileCache(): ConsumerSafetyData | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('Failed to read safety cache file:', e);
  }
  return null;
}

function writeToFileCache(data: ConsumerSafetyData) {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify({ timestamp: Date.now(), data }),
      'utf-8'
    );
  } catch (e) {
    console.warn('Failed to write safety cache file:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Check memory cache
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION_MS) {
      return NextResponse.json(memoryCache.data);
    }

    // 2. Check file cache
    const fileCache = readFromFileCache();
    if (fileCache) {
      memoryCache = { data: fileCache, timestamp: Date.now() };
      return NextResponse.json(fileCache);
    }

    // 3. Fetch from Open API
    const serviceKey = process.env.CONSUMER_SAFETY_API_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'CONSUMER_SAFETY_API_KEY 환경 변수가 없습니다.' },
        { status: 500 }
      );
    }

    const filteredItems: any[] = [];

    // Collect 1,000 items each for 3 pages (3,000 items total) as specified in PRD
    for (let page = 1; page <= 3; page++) {
      const url = `https://apis.data.go.kr/B551919/open-api/harm/reception?serviceKey=${encodeURIComponent(
        serviceKey
      )}&pageNo=${page}&numOfRows=1000&apiFormat=json`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        console.error(`Consumer Safety API page ${page} HTTP error: ${res.status}`);
        continue;
      }

      const raw = await res.json();
      const items = raw.response?.body?.items?.item || [];

      for (const item of items) {
        // PRD requirement: itemMinor가 「가정용 진공청소기」인 항목만 골라냄
        if (item.itemMinor === '가정용 진공청소기') {
          filteredItems.push(item);
        }
      }
    }

    if (filteredItems.length === 0) {
      // If no items found, return empty result without fabricating
      const result: ConsumerSafetyData = {
        totalCount: 0,
        topReasons: [],
        cachedAt: new Date().toISOString(),
      };
      return NextResponse.json(result);
    }

    // Count by injuryReason
    const reasonCounts: Record<string, number> = {};
    for (const item of filteredItems) {
      const reason = (item.injuryReason || '기타 원인').trim();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }

    // Sort descending and pick top 1~3
    const sorted = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count], idx) => ({
        rank: idx + 1,
        reason,
        count,
      }));

    const result: ConsumerSafetyData = {
      totalCount: filteredItems.length,
      topReasons: sorted,
      cachedAt: new Date().toISOString(),
    };

    // Save to cache
    memoryCache = { data: result, timestamp: Date.now() };
    writeToFileCache(result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Consumer Safety API error:', error);
    return NextResponse.json(
      { error: '소비자 위해 정보 데이터를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

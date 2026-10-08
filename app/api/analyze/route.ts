import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { RawReview, AnalyzedReview } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for bulk processing

export async function POST(req: NextRequest) {
  try {
    const { reviews, analyzed_on: customAnalyzedOn } = await req.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: '분석할 리뷰 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const today = customAnalyzedOn || new Date().toISOString().split('T')[0];

    // Format reviews for Gemini
    const reviewTexts = reviews.map((r: RawReview) => {
      return `[번호: ${r.review_no}] 작성일: ${r.written_on || '-'}, 별점: ${r.rating || '-'}, 내용: ${r.review_text}`;
    }).join('\n');

    const systemInstruction = `당신은 생활가전 쇼핑몰 「하루살림」의 무선 청소기 「클린핏 미니」 전문 리뷰 분석 AI입니다.
주어진 전체 리뷰 목록을 분석하여 각 리뷰별로 다음 항목을 엄격한 기준에 따라 분류하고 JSON 객체 형태로 응답하세요.

[분류 원칙]
1. sentiment (감성): "긍정", "부정", "중립", "광고" 중 하나
   - 별점이 아닌 내용의 실제 의미와 뉘앙스를 기준으로 판단합니다.
   - 반어법(말은 칭찬이나 실제 뜻은 불만인 경우)은 반드시 "부정"으로 분류합니다.
   - 체험단, 원고료, 무상 제공, 협찬, 할인 링크 등이 포함된 리뷰는 반드시 "광고"로 분류합니다.
   - 칭찬과 불만이 섞인 경우 더 강한 쪽으로 판단하고, 비중이 비슷하면 "중립"으로 분류합니다.
2. categories (유형): 다음 목록 중 해당하는 유형들을 쉼표와 공백(", ")으로 구분하여 모두 복수 적용 (여러 개일 수 있음, 해당 없으면 "기타")
   목록: 배터리, 흡입력, 소음, 무게·사용감, 디자인, 관리·청소, 구성품, 품질·불량, 배송, 포장, 고객센터, 가격, 설명서, 기타
3. improvement_request (개선 요청 사항):
   - "~면 좋겠어요", "~해 주세요", "~있으면 좋겠다" 등 고객의 구체적인 개선 요구나 바람을 추출합니다. 없으면 빈 문자열("")로 반환합니다.
4. is_safety_issue (안전 이슈 여부): true / false
   - 뜨거움, 발열, 과열, 냄새, 연기, 감전, 불꽃, 화재 위험 등 안전 관련 내용이 언급된 경우 조건 없이 무조건 true, 그 외에는 false.

[반환 JSON 스키마]
반드시 다음 구조의 JSON만 반환하세요:
{
  "results": [
    {
      "review_no": 1,
      "sentiment": "긍정",
      "categories": "흡입력",
      "improvement_request": "",
      "is_safety_issue": false
    }
  ]
}`;

    const userPrompt = `다음은 분석해야 할 전체 리뷰 목록입니다. 한 번에 빠짐없이 일괄 분석하여 JSON으로 반환하세요:\n\n${reviewTexts}`;

    const callGemini = async (model: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction + '\n\n' + userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });
    };

    let modelUsed = 'gemini-3.8-flash';
    let res = await callGemini(modelUsed);

    // PRD: 503(요청 몰림) 오류 발생 시 gemini-3.5-flash-lite 모델로 1회 자동 재시도
    if (res.status === 503) {
      console.warn('Gemini 503 received, retrying once with gemini-3.5-flash-lite...');
      modelUsed = 'gemini-3.5-flash-lite';
      res = await callGemini(modelUsed);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini API Error [${res.status}]:`, errText);
      return NextResponse.json(
        { error: 'AI 응답을 불러오지 못했습니다. (API 오류)' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: 'AI 응답이 비어 있어 분석을 불러오지 못했습니다.' },
        { status: 502 }
      );
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(generatedText);
    } catch (e) {
      console.error('Failed to parse Gemini response:', generatedText);
      return NextResponse.json(
        { error: 'AI 응답 형식을 해석할 수 없어 불러오지 못했습니다.' },
        { status: 502 }
      );
    }

    const rawList = Array.isArray(parsedResult)
      ? parsedResult
      : (parsedResult.results || parsedResult.reviews || []);

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return NextResponse.json(
        { error: '분석 결과를 불러오지 못했습니다.' },
        { status: 502 }
      );
    }

    // Map each raw review with analyzed attributes
    const rawMap = new Map<number, any>();
    for (const item of rawList) {
      if (item && item.review_no !== undefined) {
        rawMap.set(Number(item.review_no), item);
      }
    }

    const analyzedRows: AnalyzedReview[] = reviews.map((r: RawReview) => {
      const analyzed = rawMap.get(Number(r.review_no)) || {};
      return {
        analyzed_on: today,
        review_no: Number(r.review_no),
        written_on: String(r.written_on || ''),
        rating: Number(r.rating || 0),
        review_text: String(r.review_text || ''),
        sentiment: analyzed.sentiment || '중립',
        categories: Array.isArray(analyzed.categories)
          ? analyzed.categories.join(', ')
          : String(analyzed.categories || '기타'),
        improvement_request: String(analyzed.improvement_request || '').trim(),
        is_safety_issue: Boolean(analyzed.is_safety_issue),
        model_used: modelUsed,
      };
    });

    // Save to Supabase review_analysis table
    const { error: dbError } = await supabase
      .from('review_analysis')
      .insert(analyzedRows);

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // Return data anyway with a warning flag, so user is not blocked
      return NextResponse.json({
        success: true,
        savedToDb: false,
        dbError: dbError.message,
        model_used: modelUsed,
        analyzed_on: today,
        results: analyzedRows,
      });
    }

    return NextResponse.json({
      success: true,
      savedToDb: true,
      model_used: modelUsed,
      analyzed_on: today,
      results: analyzedRows,
    });
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return NextResponse.json(
      { error: err.message || '서버 오류로 인해 분석을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

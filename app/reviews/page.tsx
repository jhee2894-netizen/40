'use client';

import React, { useState } from 'react';
import { Header } from '@/components/reviews/Header';
import { FileUploader } from '@/components/reviews/FileUploader';
import { AnalysisSummary } from '@/components/reviews/AnalysisSummary';
import { ReviewTable } from '@/components/reviews/ReviewTable';
import { ManualConclusion } from '@/components/reviews/ManualConclusion';
import { PastAnalysisList } from '@/components/reviews/PastAnalysisList';
import { RawReview, AnalyzedReview } from '@/types';

export default function ReviewsPage() {
  const [analyzedReviews, setAnalyzedReviews] = useState<AnalyzedReview[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [analyzedOn, setAnalyzedOn] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState<number>(0);

  const handleAnalyzeReviews = async (reviews: RawReview[]) => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews,
          analyzed_on: today,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI 응답을 불러오지 못했습니다.');
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        throw new Error('분석 결과를 불러오지 못했습니다.');
      }

      setAnalyzedReviews(data.results);
      setModelUsed(data.model_used || 'gemini-3.8-flash');
      setAnalyzedOn(data.analyzed_on || today);
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPastDate = (
    date: string,
    reviews: AnalyzedReview[],
    model: string
  ) => {
    setAnalyzedReviews(reviews);
    setAnalyzedOn(date);
    setModelUsed(model);
    // Smooth scroll to top analysis summary
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: File Upload & Action */}
        <FileUploader
          onAnalyze={handleAnalyzeReviews}
          isLoading={isLoading}
          modelUsed={modelUsed}
        />

        {/* Step 2: Analysis Results & Metrics Dashboard */}
        {analyzedReviews.length > 0 && (
          <>
            <AnalysisSummary
              results={analyzedReviews}
              modelUsed={modelUsed}
              analyzedOn={analyzedOn}
            />

            {/* Step 3: Manual Conclusion (우리가 고칠 것 3줄) */}
            <ManualConclusion analyzedOn={analyzedOn} />

            {/* Step 4: Detailed Review Table */}
            <ReviewTable reviews={analyzedReviews} />
          </>
        )}

        {/* Step 5: Past Analysis History (Bottom) */}
        <PastAnalysisList
          onSelectDate={handleSelectPastDate}
          refreshTrigger={historyRefreshTrigger}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>하루살림 생활가전 쇼핑몰 · 무선 핸디 청소기 「클린핏 미니」 리뷰 분석 시스템</p>
        <p className="mt-1">Powered by Next.js, Supabase, Google Gemini API & 한국소비자원 공공데이터포털</p>
      </footer>
    </div>
  );
}

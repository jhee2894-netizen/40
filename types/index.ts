export interface RawReview {
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
}

export interface AnalyzedReview {
  id?: number;
  created_at?: string;
  analyzed_on: string;
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
  sentiment: '긍정' | '부정' | '중립' | '광고' | string;
  categories: string;
  improvement_request: string;
  is_safety_issue: boolean;
  model_used: string;
}

export interface ConsumerSafetyReason {
  reason: string;
  count: number;
  rank: number;
}

export interface ConsumerSafetyData {
  totalCount: number;
  topReasons: ConsumerSafetyReason[];
  cachedAt?: string;
  error?: string;
}

export interface PastAnalysisSummary {
  analyzed_on: string;
  total_count: number;
  negative_count: number;
  negative_ratio: number;
  model_used?: string;
}

export * from './database';
export * from '../lib/expense/types';

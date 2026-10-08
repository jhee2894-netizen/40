'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { RawReview } from '@/types';

interface FileUploaderProps {
  onAnalyze: (reviews: RawReview[]) => Promise<void>;
  isLoading: boolean;
  modelUsed?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onAnalyze,
  isLoading,
  modelUsed,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedReviews, setParsedReviews] = useState<RawReview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (f: File) => {
    setErrorMessage(null);
    setFile(f);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          if (!rows || rows.length === 0) {
            setErrorMessage('CSV 파일에 내용이 없습니다.');
            setParsedReviews([]);
            return;
          }

          // Support various Korean or English column naming
          const normalized: RawReview[] = rows.map((row, idx) => {
            const reviewNo =
              row['번호'] ?? row['review_no'] ?? row['id'] ?? (idx + 1);
            const writtenOn =
              row['작성일'] ?? row['written_on'] ?? row['날짜'] ?? row['date'] ?? '';
            const rating =
              row['별점'] ?? row['rating'] ?? row['평점'] ?? row['score'] ?? 0;
            const reviewText =
              row['리뷰'] ?? row['review_text'] ?? row['내용'] ?? row['content'] ?? row['리뷰내용'] ?? '';

            return {
              review_no: Number(reviewNo) || idx + 1,
              written_on: String(writtenOn).trim(),
              rating: Number(rating) || 0,
              review_text: String(reviewText).trim(),
            };
          }).filter((r) => r.review_text.length > 0);

          if (normalized.length === 0) {
            setErrorMessage('유효한 리뷰 텍스트를 찾을 수 없습니다. 컬럼명을 확인해 주세요.');
            setParsedReviews([]);
            return;
          }

          setParsedReviews(normalized);
        } catch (err: any) {
          setErrorMessage('파일을 파싱하는 중 오류가 발생했습니다: ' + err.message);
          setParsedReviews([]);
        }
      },
      error: (err) => {
        setErrorMessage('CSV 파싱 오류: ' + err.message);
        setParsedReviews([]);
      },
    });
  };

  const handleStartAnalysis = async () => {
    if (parsedReviews.length === 0) {
      setErrorMessage('분석할 리뷰 데이터가 없습니다.');
      return;
    }
    setErrorMessage(null);
    try {
      await onAnalyze(parsedReviews);
    } catch (err: any) {
      setErrorMessage(err.message || '분석 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            리뷰 파일 업로드 및 단건 일괄 분석
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            CSV 파일을 교체하여 업로드하면 Gemini API에 전체 리뷰를 단 한 번의 요청으로 전달하여 일괄 분석합니다.
          </p>
        </div>
        {modelUsed && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            응답 모델: {modelUsed}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            file
              ? 'border-blue-400 bg-blue-50/30'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            {file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-800 text-base">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB · 인식된 유효 리뷰 <strong>{parsedReviews.length}건</strong>
                </p>
                <p className="text-xs text-blue-600 mt-2 font-medium">클릭하거나 다른 파일을 드래그하여 교체할 수 있습니다.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700 text-sm">
                  클릭하여 CSV 파일을 선택하거나 여기로 드래그하세요
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  열 구성: 번호, 작성일, 별점, 리뷰 (.csv)
                </p>
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">오류 안내</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {parsedReviews.length > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                준비 완료: 총 {parsedReviews.length}개의 리뷰를 일괄 분석할 준비가 되었습니다.
              </span>
            )}
          </div>

          <button
            onClick={handleStartAnalysis}
            disabled={parsedReviews.length === 0 || isLoading}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              parsedReviews.length === 0 || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>전체 리뷰 일괄 분석 진행 중...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>AI 일괄 분석 시작 ({parsedReviews.length}건)</span>
              </>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Gemini AI가 전체 리뷰를 일괄 분석 중입니다...</p>
              <p className="text-blue-700 mt-0.5">
                기본 모델(gemini-3.8-flash)을 호출하며, 503(요청 몰림) 발생 시 gemini-3.5-flash-lite로 자동 1회 재시도합니다. 분석 완료 후 Supabase에 자동 저장됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { parseExpenseCSV, parseExpenseCSVContent } from '@/lib/parser';
import { ParseResult } from '@/lib/types';
import { SAMPLE_SEPTEMBER_CSV } from '@/constants/sampleData';

interface FileUploaderProps {
  onDataLoaded: (result: ParseResult) => void;
  currentFileName?: string;
  totalCount?: number;
}

export default function FileUploader({
  onDataLoaded,
  currentFileName,
  totalCount,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 드래그 이벤트 핸들러
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  // 파일 선택 이벤트 핸들러
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // 재선택 가능하도록 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 처리 및 파싱
  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('CSV 형식의 파일(.csv)만 업로드할 수 있습니다.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await parseExpenseCSV(file);
      if (result.items.length === 0) {
        setErrorMessage('유효한 경비 데이터가 발견되지 않았습니다. 헤더 및 내용을 확인해 주세요.');
      } else {
        onDataLoaded(result);
      }
    } catch (err: any) {
      setErrorMessage(`파일 파싱 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 샘플 데이터 즉시 불러오기
  const handleLoadSample = () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = parseExpenseCSVContent(SAMPLE_SEPTEMBER_CSV, '9월_경비내역.csv');
      onDataLoaded(result);
    } catch (err: any) {
      setErrorMessage('샘플 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 업로드 드롭존 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-blue-50 text-blue-600">
          <Upload className="w-7 h-7" />
        </div>

        <p className="text-base font-semibold text-slate-800 text-center">
          경비 내역 CSV 파일을 드래그하여 놓거나 클릭하여 선택하세요
        </p>
        <p className="mt-1 text-sm text-slate-500 text-center">
          클라이언트 브라우저에서 안전하게 직접 파싱됩니다 (서버로 전송되지 않음)
        </p>

        {/* 현재 로드된 파일 정보 */}
        {currentFileName && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>현재 로드됨: {currentFileName} ({totalCount}건)</span>
          </div>
        )}
      </div>

      {/* 에러 메시지 알림 */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 보조 액션 바 (샘플 데이터 불러오기 등) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          지원 포맷: UTF-8 / CP949 인코딩 CSV
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleLoadSample();
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors border border-slate-200 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>9월 경비내역 샘플 즉시 불러오기 (25건)</span>
        </button>
      </div>
    </div>
  );
}

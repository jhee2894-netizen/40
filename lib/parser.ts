import Papa from 'papaparse';
import { ExpenseItem, ParseResult } from './types';

// 헤더 정규화 맵
const HEADER_MAP: Record<string, keyof ExpenseItem | 'approvalNumber'> = {
  번호: 'id',
  id: 'id',
  No: 'id',
  no: 'id',
  제출자: 'submitter',
  성명: 'submitter',
  이름: 'submitter',
  부서: 'department',
  소속: 'department',
  사용일: 'usedDate',
  사용일자: 'usedDate',
  날짜: 'usedDate',
  사용시각: 'usedTime',
  시간: 'usedTime',
  시각: 'usedTime',
  항목: 'category',
  구분: 'category',
  계정: 'category',
  가맹점: 'merchant',
  상호: 'merchant',
  사용처: 'merchant',
  금액: 'amount',
  사용금액: 'amount',
  비용: 'amount',
  인원: 'attendeesCount',
  인원수: 'attendeesCount',
  증빙: 'proofType',
  증빙유형: 'proofType',
  품의번호: 'approvalNumber',
  사전품의: 'approvalNumber',
  품의: 'approvalNumber',
  제출일: 'submittedDate',
  제출일자: 'submittedDate',
  메모: 'memo',
  적요: 'memo',
  비고: 'memo',
};

// 금액 문자열을 숫자로 정규화 (예: "15,000", "₩12,000", 12000 -> 12000)
export function parseAmount(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleanStr = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// 인원수 정규화 (최소 1)
export function parseAttendeesCount(value: any): number {
  if (!value) return 1;
  const parsed = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

// 날짜 정규화 (YYYY-MM-DD 형태 보정)
export function normalizeDate(value: any): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  // 2026.09.01 또는 2026/09/01 형태를 YYYY-MM-DD로 변환
  return trimmed.replace(/\./g, '-').replace(/\//g, '-');
}

// 단일 행 데이터를 ExpenseItem으로 매핑
export function mapRowToExpenseItem(
  row: Record<string, string>,
  index: number
): ExpenseItem {
  const normalized: Partial<ExpenseItem> = {};

  // 헤더 매칭
  for (const [key, val] of Object.entries(row)) {
    const trimmedKey = key.trim();
    const mappedField = HEADER_MAP[trimmedKey];
    if (mappedField) {
      (normalized as any)[mappedField] = val ? String(val).trim() : '';
    }
  }

  const id = normalized.id ? parseAmount(normalized.id) : index + 1;
  const amount = parseAmount(normalized.amount);
  const attendeesCount = parseAttendeesCount(normalized.attendeesCount);
  const perPersonAmount = Math.round(amount / attendeesCount);

  return {
    id,
    submitter: normalized.submitter || '미입력',
    department: normalized.department || '미지정',
    usedDate: normalizeDate(normalized.usedDate),
    usedTime: normalized.usedTime || '',
    category: normalized.category || '기타',
    merchant: normalized.merchant || '',
    amount,
    attendeesCount,
    perPersonAmount,
    proofType: normalized.proofType || '미지정',
    approvalNumber: normalized.approvalNumber || '',
    submittedDate: normalizeDate(normalized.submittedDate),
    memo: normalized.memo || '',
    raw: row,
  };
}

// 순수 문자열 기반 CSV 파서 (PapaParse 의존성 없이도 백업 작동)
export function parseCSVStringFallback(csvString: string): Record<string, string>[] {
  const lines = csvString
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  // 쉼표 분리 (간단한 따옴표 처리)
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return rows;
}

// 메인 파싱 함수 (클라이언트 사이드 File 파싱)
export function parseExpenseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const errors: string[] = [];
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach((err) => {
            errors.push(`행 ${err.row}: ${err.message}`);
          });
        }

        const items: ExpenseItem[] = (results.data || [])
          .filter((row) => Object.values(row).some((val) => val && String(val).trim().length > 0))
          .map((row, idx) => mapRowToExpenseItem(row, idx));

        resolve({
          items,
          errors,
          totalRows: items.length,
          fileName: file.name,
        });
      },
      error: (error) => {
        // Fallback 시도
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const rows = parseCSVStringFallback(text);
          const items = rows.map((row, idx) => mapRowToExpenseItem(row, idx));
          resolve({
            items,
            errors: [error.message],
            totalRows: items.length,
            fileName: file.name,
          });
        };
        reader.readAsText(file, 'utf-8');
      },
    });
  });
}

// 문자열 데이터 파싱 (샘플 데이터 직접 로드용)
export function parseExpenseCSVContent(csvText: string, fileName: string = '샘플데이터.csv'): ParseResult {
  try {
    const results = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    const items = (results.data || [])
      .filter((row) => Object.values(row).some((val) => val && String(val).trim().length > 0))
      .map((row, idx) => mapRowToExpenseItem(row, idx));

    return {
      items,
      errors: results.errors.map((e) => e.message),
      totalRows: items.length,
      fileName,
    };
  } catch (err: any) {
    const rows = parseCSVStringFallback(csvText);
    const items = rows.map((row, idx) => mapRowToExpenseItem(row, idx));
    return {
      items,
      errors: [err?.message || '파싱 에러'],
      totalRows: items.length,
      fileName,
    };
  }
}

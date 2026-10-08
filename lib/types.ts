// 경비 내역 항목 기본 타입 정의
export interface ExpenseItem {
  id: number;              // 번호
  submitter: string;       // 제출자
  department: string;      // 부서
  usedDate: string;        // 사용일 (YYYY-MM-DD)
  usedTime: string;        // 사용시각 (HH:mm)
  category: string;        // 항목 (식대, 택시, 교통비, 소모품, 회의비, 접대비, 자재 등)
  merchant: string;        // 가맹점
  amount: number;          // 금액 (원)
  attendeesCount: number;  // 인원 수
  perPersonAmount: number; // 1인당 금액 (금액 / 인원 수)
  proofType: string;       // 증빙 (법인카드, 간이영수증, 세금계산서 등)
  approvalNumber?: string; // 품의번호 (있을 경우)
  submittedDate: string;   // 제출일 (YYYY-MM-DD)
  memo: string;            // 메모 (야근, 고객사 이동, 현장 점심 등)
  raw?: Record<string, string>; // 원본 CSV 행 데이터
}

// 위반 조항 코드 타입
export type ArticleCode = '제5조' | '제6조' | '제7조' | '제8조' | '제9조 1항' | '제9조 2항';

// 세부 위반 정보
export interface ViolationDetail {
  article: ArticleCode;    // 조항 번호 (예: '제5조', '제6조', ...)
  articleTitle: string;   // 조항 명칭 (예: '식대 한도 초과', ...)
  reason: string;         // 구체적인 위반 사유 설명
  severity: 'error' | 'warning';
}

// 룰 검증이 완료된 경비 항목
export interface AuditedExpenseItem extends ExpenseItem {
  isViolation: boolean;
  violations: ViolationDetail[];
  duplicateWithId?: number; // 중복 제출된 원본/대상 항목 ID
}

// CSV 파싱 결과 타입
export interface ParseResult {
  items: ExpenseItem[];
  errors: string[];
  totalRows: number;
  fileName: string;
}

// 룰 감사 요약 통계 지표 (PRD 3.3)
export interface AuditSummary {
  totalCount: number;          // 전체 건수
  compliantCount: number;      // 정상 건수
  violationCount: number;      // 총 위반 건수
  totalAmount: number;         // 전체 총 지출액
  violationAmount: number;     // 위반 건 총 금액
  articleBreakdown: Record<ArticleCode, number>; // 조항별 위반 발생 건수 집계
}

import {
  ExpenseItem,
  AuditedExpenseItem,
  ViolationDetail,
  AuditSummary,
  ArticleCode,
} from './types';
import { POLICY_RULES } from '@/constants/policyRules';

/**
 * 제5조 (식대) 검증
 * - 업무상 식대(야근 식대 포함) 1인당 1회 12,000원 한도
 * - 여러 명 함께 식사한 경우 금액을 인원수로 나눈 1인당 금액으로 판단
 */
export function checkArticle5(item: ExpenseItem): ViolationDetail | null {
  if (!item.category.includes('식대')) return null;

  if (item.perPersonAmount > POLICY_RULES.ARTICLE_5.maxPerPersonAmount) {
    const excess = item.perPersonAmount - POLICY_RULES.ARTICLE_5.maxPerPersonAmount;
    return {
      article: '제5조',
      articleTitle: POLICY_RULES.ARTICLE_5.title,
      reason: `1인당 1회 한도(${POLICY_RULES.ARTICLE_5.maxPerPersonAmount.toLocaleString()}원) 초과: 1인당 ₩${item.perPersonAmount.toLocaleString()} (₩${excess.toLocaleString()} 초과)`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * 제6조 (교통비) 검증
 * - 택시비는 22:00 이후 퇴근 또는 대중교통 이용 어려운 업무상 이동만 인정
 * - 22:00 이전의 퇴근 택시비 불인정
 */
export function checkArticle6(item: ExpenseItem): ViolationDetail | null {
  if (!item.category.includes('택시')) return null;

  const memo = (item.memo || '').trim();
  const time = (item.usedTime || '').trim();

  // 메모에 퇴근이 언급된 경우: 22:00 이전이면 위반
  const isLeavingWork = memo.includes('퇴근');
  if (isLeavingWork) {
    if (time && time < POLICY_RULES.ARTICLE_6.nightTaxiStartTime) {
      return {
        article: '제6조',
        articleTitle: POLICY_RULES.ARTICLE_6.title,
        reason: `오후 10시(${POLICY_RULES.ARTICLE_6.nightTaxiStartTime}) 이전 퇴근 택시비 불인정 (사용시각: ${time})`,
        severity: 'error',
      };
    }
  } else {
    // 퇴근이 아닌 경우: 업무 목적이 메모에 기재되어 있어야 함
    if (!memo) {
      return {
        article: '제6조',
        articleTitle: POLICY_RULES.ARTICLE_6.title,
        reason: '업무상 외부 이동 목적 미기재 (대중교통 이용 곤란 사유 및 메모 필수)',
        severity: 'error',
      };
    }
  }

  return null;
}

/**
 * 제7조 (증빙) 검증
 * - 1건 30,000원 이상 지출은 적격증빙(법인카드, 세금계산서, 현금영수증) 필수
 * - 간이영수증은 30,000원 미만 지출에만 인정
 */
export function checkArticle7(item: ExpenseItem): ViolationDetail | null {
  if (item.proofType === '간이영수증' && item.amount >= POLICY_RULES.ARTICLE_7.simpleReceiptThreshold) {
    return {
      article: '제7조',
      articleTitle: POLICY_RULES.ARTICLE_7.title,
      reason: `30,000원 이상 지출 시 간이영수증 불가 (적격증빙 필요, 지출액: ₩${item.amount.toLocaleString()})`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * 제8조 (접대비) 검증
 * - 거래처 접대비가 1건 300,000원을 넘는 경우 사전 품의 및 품의번호 필수
 */
export function checkArticle8(item: ExpenseItem): ViolationDetail | null {
  if (item.category.includes('접대')) {
    if (item.amount > POLICY_RULES.ARTICLE_8.approvalThreshold) {
      if (!item.approvalNumber || item.approvalNumber.trim() === '') {
        return {
          article: '제8조',
          articleTitle: POLICY_RULES.ARTICLE_8.title,
          reason: `300,000원 초과 접대비 사전 품의번호 누락 (지출액: ₩${item.amount.toLocaleString()})`,
          severity: 'error',
        };
      }
    }
  }

  return null;
}

/**
 * 제9조 1항 (제출 기한) 검증
 * - 경비는 사용일로부터 30일 이내에 제출 (30일 초과 시 처리 불가)
 */
export function checkArticle9_1(item: ExpenseItem): ViolationDetail | null {
  if (!item.usedDate || !item.submittedDate) return null;

  try {
    const used = new Date(item.usedDate);
    const submitted = new Date(item.submittedDate);

    // 날짜 유효성 체크
    if (isNaN(used.getTime()) || isNaN(submitted.getTime())) return null;

    const diffMs = submitted.getTime() - used.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > POLICY_RULES.ARTICLE_9_1.maxSubmissionDays) {
      return {
        article: '제9조 1항',
        articleTitle: POLICY_RULES.ARTICLE_9_1.title,
        reason: `사용일로부터 30일 초과 제출 (${diffDays}일 경과, 규정 한도: ${POLICY_RULES.ARTICLE_9_1.maxSubmissionDays}일)`,
        severity: 'error',
      };
    }
  } catch {
    // 날짜 파싱 오류 무시
  }

  return null;
}

/**
 * 제9조 2항 (중복 제출) 검증
 * - 같은 지출(사용일, 가맹점, 금액 일치)을 2번 이상 제출할 수 없음
 */
export function checkDuplicates(items: ExpenseItem[]): Map<number, { duplicateWithId: number; detail: ViolationDetail }> {
  const duplicateMap = new Map<number, { duplicateWithId: number; detail: ViolationDetail }>();
  const seenMap = new Map<string, ExpenseItem>();

  for (const item of items) {
    if (!item.usedDate || !item.merchant || !item.amount) continue;

    // 일자 + 가맹점 + 금액 조합 키
    const key = `${item.usedDate}_${item.merchant.trim()}_${item.amount}`;

    if (seenMap.has(key)) {
      const original = seenMap.get(key)!;
      duplicateMap.set(item.id, {
        duplicateWithId: original.id,
        detail: {
          article: '제9조 2항',
          articleTitle: POLICY_RULES.ARTICLE_9_2.title,
          reason: `중복 제출 의심: No.${original.id} 건과 동일 지출 (일자: ${item.usedDate}, 가맹점: ${item.merchant}, 금액: ₩${item.amount.toLocaleString()})`,
          severity: 'error',
        },
      });
    } else {
      seenMap.set(key, item);
    }
  }

  return duplicateMap;
}

/**
 * 전체 경비 내역 일괄 규정 감사 (Main Rule Engine Pipeline)
 */
export function auditExpenseItems(items: ExpenseItem[]): AuditedExpenseItem[] {
  // 중복 감지 사전 실행
  const duplicateMap = checkDuplicates(items);

  return items.map((item) => {
    const violations: ViolationDetail[] = [];

    // 제5조 식대 검사
    const v5 = checkArticle5(item);
    if (v5) violations.push(v5);

    // 제6조 교통비 검사
    const v6 = checkArticle6(item);
    if (v6) violations.push(v6);

    // 제7조 증빙 검사
    const v7 = checkArticle7(item);
    if (v7) violations.push(v7);

    // 제8조 접대비 검사
    const v8 = checkArticle8(item);
    if (v8) violations.push(v8);

    // 제9조 1항 제출기한 검사
    const v9_1 = checkArticle9_1(item);
    if (v9_1) violations.push(v9_1);

    // 제9조 2항 중복제출 검사
    const dup = duplicateMap.get(item.id);
    if (dup) {
      violations.push(dup.detail);
    }

    return {
      ...item,
      isViolation: violations.length > 0,
      violations,
      duplicateWithId: dup?.duplicateWithId,
    };
  });
}

/**
 * 감사 결과 요약 집계 함수 (PRD 3.3 대시보드 지표 생성)
 */
export function calculateAuditSummary(auditedItems: AuditedExpenseItem[]): AuditSummary {
  const totalCount = auditedItems.length;
  let compliantCount = 0;
  let violationCount = 0;
  let totalAmount = 0;
  let violationAmount = 0;

  const articleBreakdown: Record<ArticleCode, number> = {
    제5조: 0,
    제6조: 0,
    제7조: 0,
    제8조: 0,
    '제9조 1항': 0,
    '제9조 2항': 0,
  };

  for (const item of auditedItems) {
    totalAmount += item.amount;

    if (item.isViolation) {
      violationCount++;
      violationAmount += item.amount;

      // 조항별 발생 수 누적
      for (const v of item.violations) {
        if (articleBreakdown[v.article] !== undefined) {
          articleBreakdown[v.article]++;
        }
      }
    } else {
      compliantCount++;
    }
  }

  return {
    totalCount,
    compliantCount,
    violationCount,
    totalAmount,
    violationAmount,
    articleBreakdown,
  };
}

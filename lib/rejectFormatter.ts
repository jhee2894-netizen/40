import { AuditedExpenseItem } from './types';

export interface SubmitterViolations {
  submitter: string;
  department: string;
  items: AuditedExpenseItem[];
}

/**
 * 위반된 경비 항목들을 제출자별로 그룹화
 */
export function groupViolationsBySubmitter(
  items: AuditedExpenseItem[]
): SubmitterViolations[] {
  const map = new Map<string, { department: string; items: AuditedExpenseItem[] }>();

  for (const item of items) {
    if (!item.isViolation) continue;

    const key = item.submitter;
    if (!map.has(key)) {
      map.set(key, {
        department: item.department,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }

  const result: SubmitterViolations[] = [];
  map.forEach((value, submitter) => {
    result.push({
      submitter,
      department: value.department,
      items: value.items,
    });
  });

  // 위반 건수 많은 순, 이름 순 정렬
  return result.sort((a, b) => b.items.length - a.items.length || a.submitter.localeCompare(b.submitter));
}

/**
 * 특정 제출자에 대한 정형화된 반려 사유 텍스트 생성
 * (슬랙, 잔디, 카카오톡, 사내 메일 등에 즉시 붙여넣을 수 있는 포맷)
 */
export function formatSubmitterRejectMessage(group: SubmitterViolations): string {
  const lines: string[] = [];

  lines.push(`[경비 정산 규정 위반 안내 및 반려 요청]`);
  lines.push(`대상: ${group.submitter} 님 (${group.department})`);
  lines.push(`안녕하세요 ${group.submitter} 님, 경영지원팀 회계담당자입니다.`);
  lines.push(`제출해 주신 경비 내역 중 사내 규정 위반 항목이 확인되어 안내드립니다.`);
  lines.push(``);
  lines.push(`■ 반려 대상 내역 (총 ${group.items.length}건):`);

  group.items.forEach((item, index) => {
    lines.push(`----------------------------------------`);
    lines.push(`${index + 1}. [No.${item.id}] ${item.usedDate} | ${item.category} | ${item.merchant}`);
    lines.push(`   - 지출 금액: ₩${item.amount.toLocaleString()}${item.attendeesCount > 1 ? ` (${item.attendeesCount}명 / 1인당 ₩${item.perPersonAmount.toLocaleString()})` : ''}`);
    lines.push(`   - 증빙: ${item.proofType}${item.approvalNumber ? ` (품의: ${item.approvalNumber})` : ''}`);
    if (item.memo) {
      lines.push(`   - 제출 메모: ${item.memo}`);
    }
    lines.push(`   - 위반 사유:`);
    item.violations.forEach((v) => {
      lines.push(`     • [${v.article} ${v.articleTitle}] ${v.reason}`);
    });
  });

  lines.push(`----------------------------------------`);
  lines.push(``);
  lines.push(`위 항목에 대해 사내 경비 규정 확인 후 사유 보완 또는 수정 재제출을 부탁드립니다.`);
  lines.push(`문의사항이 있으시면 경영지원팀으로 연락 바랍니다. 감사합니다.`);

  return lines.join('\n');
}

/**
 * 전체 위반자 일괄 복사용 종합 텍스트 생성
 */
export function formatAllRejectMessages(groups: SubmitterViolations[]): string {
  if (groups.length === 0) return '규정 위반 항목이 없습니다.';

  return groups.map((g) => formatSubmitterRejectMessage(g)).join('\n\n========================================\n\n');
}

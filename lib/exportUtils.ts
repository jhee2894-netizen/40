import { AuditedExpenseItem } from './types';

/**
 * 위반된 경비 내역을 CSV 파일(UTF-8 BOM 포함)로 브라우저에서 즉시 다운로드
 */
export function exportViolationsToCSV(items: AuditedExpenseItem[], originalFileName: string = '경비내역'): void {
  const violationItems = items.filter((i) => i.isViolation);
  if (violationItems.length === 0) {
    alert('위반 항목이 없습니다.');
    return;
  }

  // CSV 헤더
  const headers = [
    '번호',
    '제출자',
    '부서',
    '사용일',
    '사용시각',
    '항목',
    '가맹점',
    '지출금액',
    '인원',
    '1인당금액',
    '증빙',
    '품의번호',
    '제출일',
    '메모',
    '위반조항',
    '위반사유',
  ];

  const escapeCSV = (str: any) => {
    const val = String(str ?? '').replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = violationItems.map((item) => {
    const articles = item.violations.map((v) => v.article).join(', ');
    const reasons = item.violations.map((v) => `[${v.article}] ${v.reason}`).join(' / ');

    return [
      item.id,
      escapeCSV(item.submitter),
      escapeCSV(item.department),
      escapeCSV(item.usedDate),
      escapeCSV(item.usedTime),
      escapeCSV(item.category),
      escapeCSV(item.merchant),
      item.amount,
      item.attendeesCount,
      item.perPersonAmount,
      escapeCSV(item.proofType),
      escapeCSV(item.approvalNumber || ''),
      escapeCSV(item.submittedDate),
      escapeCSV(item.memo),
      escapeCSV(articles),
      escapeCSV(reasons),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseName = originalFileName.replace(/\.csv$/i, '');
  a.download = `[규정위반목록]_${baseName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

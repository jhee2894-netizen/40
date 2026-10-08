// 경비 처리 규정 정책 상수 및 기본 파라미터 (제5조 ~ 제9조)

export const POLICY_RULES = {
  ARTICLE_5: {
    code: '제5조',
    title: '식대 한도 규정',
    maxPerPersonAmount: 12000, // 1인당 1회 12,000원 한도
    description: '업무상 식대(야근 식대 포함)는 1인당 1회 12,000원을 한도로 합니다.',
  },
  ARTICLE_6: {
    code: '제6조',
    title: '교통비(택시) 이용 규정',
    nightTaxiStartTime: '22:00', // 오후 10시 이후 퇴근
    description: '택시비는 22:00 이후 퇴근 또는 이동 목적이 명시된 대중교통 이용 불가 업무 이동만 인정됩니다.',
  },
  ARTICLE_7: {
    code: '제7조',
    title: '증빙 규정',
    simpleReceiptThreshold: 30000, // 30,000원 미만만 간이영수증 허용
    validProofs: ['법인카드', '세금계산서', '현금영수증'],
    description: '30,000원 이상 지출은 적격증빙이 필수이며, 간이영수증은 30,000원 미만에만 인정됩니다.',
  },
  ARTICLE_8: {
    code: '제8조',
    title: '접대비 사전 품의 규정',
    approvalThreshold: 300000, // 300,000원 초과 시 사전 품의 필수
    description: '거래처 접대비가 1건 300,000원을 초과하는 경우 사전 품의번호 기재가 필수입니다.',
  },
  ARTICLE_9_1: {
    code: '제9조 1항',
    title: '제출 기한 규정',
    maxSubmissionDays: 30, // 30일 이내 제출
    description: '경비는 사용일로부터 30일 이내에 제출해야 합니다.',
  },
  ARTICLE_9_2: {
    code: '제9조 2항',
    title: '중복 제출 금지 규정',
    description: '같은 지출(동일 일자, 동일 금액, 동일 가맹점)을 두 번 이상 제출할 수 없습니다.',
  },
} as const;
